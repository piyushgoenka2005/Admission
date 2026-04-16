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

async function runIdCardSheet(scriptPath: string, studentsPayload: object[], outputDir: string) {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const configuredPython =
    process.env.PYTHON_EXECUTABLE || venvPython;

  const studentsJson = JSON.stringify(studentsPayload);

  const attempts: Array<{ command: string; args: string[] }> = [
    {
      command: configuredPython,
      args: [scriptPath, '--students-json', studentsJson, '--print', '--output', outputDir],
    },
    {
      command: 'py',
      args: ['-3', scriptPath, '--students-json', studentsJson, '--print', '--output', outputDir],
    },
    {
      command: 'python',
      args: [scriptPath, '--students-json', studentsJson, '--print', '--output', outputDir],
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
    const result = await runIdCardSheet(scriptPath, studentsPayload, tempOutputDir);

    return NextResponse.json(
      {
        success: true,
        message: `ID card data sheet for ${selected.length} student(s) sent to printer`,
        stdout: result.stdout,
        stderr: result.stderr,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate ID card data sheet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
