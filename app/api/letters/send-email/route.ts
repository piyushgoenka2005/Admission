import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import nodemailer from 'nodemailer';
import { getInternById } from '@/lib/db';

export const runtime = 'nodejs';

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.EMAIL_HOST || 'mail1.nrsc.gov.in';
  const user = process.env.EMAIL_HOST_USER || process.env.ZIMBRA_USER || '';
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.ZIMBRA_PASS || '';
  const port = Number(process.env.EMAIL_PORT) || 587;

  if (!host || !user || !pass) return null;
  return { host, port, user, pass };
}

function isMockEmailMode(): boolean {
  // Default to real email mode. Set EMAIL_MOCK=true to force mock mode.
  const forceMock = process.env.EMAIL_MOCK === 'true';
  const missingSmtpConfig = !getSmtpConfig();

  return forceMock || missingSmtpConfig;
}

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => { resolve({ code: code ?? 1, stdout, stderr }); });
  });
}

function parseOutputPath(stdout: string): string | null {
  const match = stdout.match(/RESULT:\s*success=(\d+)\s+failed=\d+\s+output=(.+)/);
  if (!match || Number(match[1]) === 0) return null;
  return match[2].trim();
}

async function generateLetter(scriptPath: string, studentPayload: object, outputDir: string): Promise<string> {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const python = process.env.PYTHON_EXECUTABLE || venvPython;
  const studentJson = JSON.stringify(studentPayload);

  const attempts = [
    { command: python,    args: [scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--output', outputDir] },
    { command: 'py',      args: ['-3', scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--output', outputDir] },
    { command: 'python',  args: [scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--output', outputDir] },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const result = await runCommand(attempt.command, attempt.args);
      if (result.code === 0) {
        const outPath = parseOutputPath(result.stdout);
        if (!outPath) throw new Error('Letter generation succeeded but no output path found');
        return path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
      }
      lastError = new Error(result.stderr || result.stdout || `Exit code ${result.code}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to execute generate_letter.py');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const internId = typeof body?.internId === 'string' ? body.internId.trim() : '';

    if (!internId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const intern = await getInternById(internId);
    if (!intern) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!intern.email) {
      return NextResponse.json({ error: 'Student does not have an email address' }, { status: 400 });
    }

    // ── 1. Generate the offer letter .docx ─────────────────────────────────
    const scriptPath = path.join(process.cwd(), 'generate_letter.py');
    const studentPayload = {
      salute: intern.salute,
      name: intern.name,
      email: intern.email,
      college: intern.college,
      district: intern.district,
      guide_name: intern.guide_name,
      guide_area: intern.guide_area,
      guide_reporting_officer: intern.guide_reporting_officer,
      dd: intern.dd,
      course: intern.course,
      start_date: intern.start_date,
      end_date: intern.end_date,
      allotment_date: intern.allotment_date,
      month: intern.month,
      sl_no: intern.sl_no,
      college_dean_hod: intern.college_dean_hod,
    };

    const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-offer-'));
    const letterPath = await generateLetter(scriptPath, studentPayload, tempOutputDir);

    if (!fs.existsSync(letterPath)) {
      return NextResponse.json({ error: `Generated file not found at: ${letterPath}` }, { status: 500 });
    }

    const attachment = fs.readFileSync(letterPath);
    const fileName = path.basename(letterPath);

    // ── 2. Build CC list (filter out empty values) ─────────────────────────
    const ccList = [intern.guide_mail, intern.hod_mail].filter(Boolean);

    const mockEmail = isMockEmailMode();
    const smtpConfig = getSmtpConfig();
    const fromAddress =
      process.env.DEFAULT_FROM_EMAIL ||
      process.env.FETCH_FROM_ID ||
      smtpConfig?.user ||
      'student@nrsc.gov.in';
    const studentName = `${intern.salute} ${intern.name}`.trim();

    const subject = `Internship / Project Offer Letter – ${studentName}`;
    const bodyText = `Dear ${studentName},

Please find attached your Offer Letter for the Student Project / Internship at National Remote Sensing Centre (NRSC).

Details:
  Name    : ${studentName}
  College : ${intern.college}
  Course  : ${intern.course}
  Period  : ${intern.start_date} to ${intern.end_date}
  Guide   : ${intern.guide_name}${intern.guide_area ? ` (${intern.guide_area})` : ''}

Kindly report to NRSC as per the schedule mentioned in the letter.

For any queries, please contact the Student Project Interface Division (SPID/TEOG), NRSC.

Regards,
Student Project Interface Division (SPID)
Training, Education & Outreach Group (TEOG)
Management Systems Area (MSA)
National Remote Sensing Centre (NRSC), ISRO
Hyderabad`;

    if (mockEmail) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: `Email sent to ${intern.email}${ccList.length ? ` (CC: ${ccList.join(', ')})` : ''}`,
      });
    }

    if (!smtpConfig) {
      return NextResponse.json({ error: 'SMTP configuration is missing' }, { status: 500 });
    }

    // ── 3. Send via configured SMTP server ─────────────────────────────────
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: process.env.EMAIL_USE_SSL === 'true',
      requireTLS: process.env.EMAIL_USE_TLS !== 'false',
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      tls: {
        // Allow self-signed certs on intranet server
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: fromAddress,
      to: intern.email,
      cc: ccList.length > 0 ? ccList.join(', ') : undefined,
      subject,
      text: bodyText,
      attachments: [
        {
          filename: fileName,
          content: attachment,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
    });

    // Cleanup generated document after successful mail send.
    try {
      if (fs.existsSync(letterPath)) {
        fs.unlinkSync(letterPath);
      }
      const dir = path.dirname(letterPath);
      if (dir.startsWith(os.tmpdir())) {
        fs.rmdirSync(dir);
      }
    } catch {
      // Ignore cleanup failures.
    }

    return NextResponse.json({
      success: true,
      message: `Offer letter emailed to ${intern.email}${ccList.length ? ` (CC: ${ccList.join(', ')})` : ''}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
