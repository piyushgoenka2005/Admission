import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getInternById } from '@/lib/db';

export const runtime = 'nodejs';

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: false,
      windowsHide: true,
      env: { ...process.env, NRSC_PRINTER: process.env.NRSC_PRINTER || '' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => reject(error));

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function parseResult(output: string) {
  const match = output.match(/RESULT:\s*success=(\d+)\s+failed=(\d+)\s+output=(.+)/);
  if (!match) {
    return null;
  }

  return {
    successCount: Number(match[1]),
    failedCount: Number(match[2]),
    outputPath: match[3].trim(),
  };
}

async function runLetterGeneration(scriptPath: string, studentPayload: object, outputDir: string) {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const configuredPython = process.env.PYTHON_EXECUTABLE || venvPython;

  const studentJson = JSON.stringify(studentPayload);

  const attempts: Array<{ command: string; args: string[] }> = [
    {
      command: configuredPython,
      args: [scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--print', '--output', outputDir],
    },
    {
      command: 'py',
      args: ['-3', scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--print', '--output', outputDir],
    },
    {
      command: 'python',
      args: [scriptPath, '--student-json', studentJson, '--non-interactive', '--no-table', '--print', '--output', outputDir],
    },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const result = await runCommand(attempt.command, attempt.args);
      if (result.code === 0) {
        return result;
      }
      lastError = new Error(result.stderr || result.stdout || `Command failed with code ${result.code}`);
    } catch (error) {
      lastError = error;
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

    const studentPayload = {
      salute: intern.salute,
      name: intern.name,
      email: intern.email,
      college: intern.college,
      district: intern.district,
      guide_name: intern.guide_name,
      guide_area: intern.guide_area,
      course: intern.course,
      start_date: intern.start_date,
      end_date: intern.end_date,
      allotment_date: intern.allotment_date,
      month: intern.month,
      sl_no: intern.sl_no,
      college_dean_hod: intern.college_dean_hod,
      guide_reporting_officer: intern.guide_reporting_officer,
      dd: intern.dd,
    };

    const scriptPath = path.join(process.cwd(), 'generate_letter.py');
    const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-offer-print-'));
    const result = await runLetterGeneration(scriptPath, studentPayload, tempOutputDir);
    const parsed = parseResult(result.stdout);

    if (result.code !== 0 || (parsed && parsed.failedCount > 0)) {
      return NextResponse.json(
        { error: `Print failed. ${result.stderr || result.stdout}`.trim() },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Offer letter sent to printer',
        stdout: result.stdout,
        stderr: result.stderr,
        summary: parsed,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate offer letter';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
