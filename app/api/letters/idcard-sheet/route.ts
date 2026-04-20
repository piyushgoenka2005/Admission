import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getAllInterns } from '@/lib/db';

export const runtime = 'nodejs';

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

function parseResult(output: string) {
  const match = output.match(/RESULT:\s*success=(\d+)\s+failed=(\d+)\s+output=(.+?)(?:\s+printed=\d+)?\s*$/m);
  if (!match) {
    return null;
  }

  return {
    successCount: Number(match[1]),
    failedCount: Number(match[2]),
    outputPath: match[3].trim(),
  };
}

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

async function runIdCardSheet(
  scriptPath: string,
  studentsPayload: object[],
  outputDir: string,
  options?: { sendToPrinter?: boolean }
) {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const configuredPython =
    process.env.PYTHON_EXECUTABLE || venvPython;

  const studentsJson = JSON.stringify(studentsPayload);
  const commonArgs = ['--students-json', studentsJson, '--output', outputDir];
  const printArgs = options?.sendToPrinter ? ['--print'] : [];

  const attempts: Array<{ command: string; args: string[] }> = [
    {
      command: configuredPython,
      args: [scriptPath, ...commonArgs, ...printArgs],
    },
    {
      command: 'py',
      args: ['-3', scriptPath, ...commonArgs, ...printArgs],
    },
    {
      command: 'python',
      args: [scriptPath, ...commonArgs, ...printArgs],
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

  throw lastError instanceof Error ? lastError : new Error('Failed to execute generate_idcard_sheet.py');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const internIds: string[] = Array.isArray(body?.internIds) ? body.internIds : [];
    const mode = body?.mode === 'print' ? 'print' : 'download';

    if (!internIds.length) {
      return NextResponse.json({ error: 'No students selected' }, { status: 400 });
    }

    const allInterns = await getAllInterns();
    const idSet = new Set(internIds);
    const selected = allInterns.filter((i) => idSet.has(i.id));

    if (!selected.length) {
      return NextResponse.json({ error: 'No matching students found' }, { status: 404 });
    }

    const studentsPayload = selected.map((intern) => ({
      name: intern.name,
      salute: intern.salute,
      start_date: intern.start_date,
      end_date: intern.end_date,
      location: intern.location,
    }));

    const scriptPath = path.join(process.cwd(), 'generate_idcard_sheet.py');
    const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-idcard-'));
    const result = await runIdCardSheet(scriptPath, studentsPayload, tempOutputDir, {
      sendToPrinter: mode === 'print',
    });

    if (mode === 'print') {
      return NextResponse.json(
        {
          success: true,
          message: `ID card data sheet for ${selected.length} student(s) sent to printer on server machine`,
          stdout: result.stdout,
          stderr: result.stderr,
        },
        { status: 200 }
      );
    }

    const parsed = parseResult(result.stdout);
    const outputPath = parsed?.outputPath || '';
    const absoluteOutputPath = path.isAbsolute(outputPath)
      ? outputPath
      : path.join(process.cwd(), outputPath);

    if (!outputPath || !fs.existsSync(absoluteOutputPath)) {
      return NextResponse.json({ error: 'Generated ACS biometric memo file was not found.' }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(absoluteOutputPath);
    const fileName = path.basename(absoluteOutputPath);

    try {
      fs.unlinkSync(absoluteOutputPath);
      if (tempOutputDir.startsWith(os.tmpdir()) && fs.existsSync(tempOutputDir)) {
        fs.rmdirSync(tempOutputDir);
      }
    } catch {
      // Ignore cleanup failures.
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate ID card data sheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
