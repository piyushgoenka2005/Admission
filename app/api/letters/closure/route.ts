import { NextResponse } from 'next/server';import { NextResponse } from 'next/server';













































































































































}  }    return NextResponse.json({ error: message }, { status: 500 });    const message = error instanceof Error ? error.message : 'Failed to generate closure certificate';  } catch (error) {    );      { status: 200 }      },        summary: parsed,        stderr: result.stderr,        stdout: result.stdout,        message: 'Closure certificate sent to printer',        success: true,      {    return NextResponse.json(    }      );        { status: 500 }        { error: `Print failed. ${result.stderr || result.stdout}`.trim() },      return NextResponse.json(    if (result.code !== 0 || (parsed && parsed.failedCount > 0)) {    const parsed = parseResult(result.stdout);    const result = await runClosureGeneration(scriptPath, studentPayload, tempOutputDir);    const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-closure-'));    const scriptPath = path.join(process.cwd(), 'generate_closure.py');    };      end_date: intern.end_date,      start_date: intern.start_date,      name: intern.name,    const studentPayload = {    }      return NextResponse.json({ error: 'Student not found' }, { status: 404 });    if (!intern) {    const intern = await getInternById(internId);    }      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });    if (!internId) {    const internId = typeof body?.internId === 'string' ? body.internId.trim() : '';    const body = await request.json().catch(() => ({}));  try {export async function POST(request: Request) {}  throw lastError instanceof Error ? lastError : new Error('Failed to execute generate_closure.py');  }    }      lastError = error;    } catch (error) {      lastError = new Error(result.stderr || result.stdout || `Command failed with code ${result.code}`);      }        return result;      if (result.code === 0) {      const result = await runCommand(attempt.command, attempt.args);    try {  for (const attempt of attempts) {  let lastError: unknown = null;  ];    },      args: [scriptPath, '--student-json', studentJson, '--print', '--output', outputDir],      command: 'python',    {    },      args: ['-3', scriptPath, '--student-json', studentJson, '--print', '--output', outputDir],      command: 'py',    {    },      args: [scriptPath, '--student-json', studentJson, '--print', '--output', outputDir],      command: configuredPython,    {  const attempts: Array<{ command: string; args: string[] }> = [  const studentJson = JSON.stringify(studentPayload);  const configuredPython = process.env.PYTHON_EXECUTABLE || venvPython;  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');async function runClosureGeneration(scriptPath: string, studentPayload: object, outputDir: string) {}  };    outputPath: match[3].trim(),    failedCount: Number(match[2]),    successCount: Number(match[1]),  return {  }    return null;  if (!match) {  const match = output.match(/RESULT:\s*success=(\d+)\s+failed=(\d+)\s+output=(.+)/);function parseResult(output: string) {}  });    });      resolve({ code: code ?? 1, stdout, stderr });    child.on('close', (code) => {    child.on('error', (error) => reject(error));    });      stderr += data.toString();    child.stderr.on('data', (data) => {    });      stdout += data.toString();    child.stdout.on('data', (data) => {    let stderr = '';    let stdout = '';    });      env: { ...process.env, NRSC_PRINTER: process.env.NRSC_PRINTER || '' },      windowsHide: true,      shell: false,      cwd: process.cwd(),    const child = spawn(command, args, {  return new Promise((resolve, reject) => {function runCommand(command: string, args: string[]): Promise<CommandResult> {};  stderr: string;  stdout: string;  code: number;type CommandResult = {export const runtime = 'nodejs';import { getInternById } from '@/lib/db';import os from 'os';import fs from 'fs';import path from 'path';import { spawn } from 'child_process';import { spawn } from 'child_process';
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

function resolveGeneratedFilePath(outputPath: string | undefined, fallbackDir: string): string | null {
  if (outputPath) {
    const normalized = outputPath.trim();
    if (normalized && fs.existsSync(normalized)) {
      const stat = fs.statSync(normalized);
      if (stat.isFile()) return normalized;
      if (stat.isDirectory()) {
        const files = fs
          .readdirSync(normalized)
          .filter((name) => name.toLowerCase().endsWith('.docx'))
          .map((name) => path.join(normalized, name));
        if (files.length > 0) return files[0];
      }
    }
  }

  if (fs.existsSync(fallbackDir)) {
    const files = fs
      .readdirSync(fallbackDir)
      .filter((name) => name.toLowerCase().endsWith('.docx'))
      .map((name) => path.join(fallbackDir, name));
    if (files.length > 0) return files[0];
  }

  return null;
}

async function runClosureGeneration(scriptPath: string, studentPayload: object, outputDir: string) {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const configuredPython =
    process.env.PYTHON_EXECUTABLE || venvPython;

  const studentJson = JSON.stringify(studentPayload);

  const attempts: Array<{ command: string; args: string[] }> = [
    {
      command: configuredPython,
      args: [scriptPath, '--student-json', studentJson, '--output', outputDir],
    },
    {
      command: 'py',
      args: ['-3', scriptPath, '--student-json', studentJson, '--output', outputDir],
    },
    {
      command: 'python',
      args: [scriptPath, '--student-json', studentJson, '--output', outputDir],
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

  throw lastError instanceof Error ? lastError : new Error('Failed to execute generate_closure.py');
}

async function handleClosure(request: Request) {
  let tempOutputDir = '';

  try {
    let internId = '';
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      internId = (searchParams.get('internId') || '').trim();
    } else {
      const body = await request.json().catch(() => ({}));
      internId = typeof body?.internId === 'string' ? body.internId.trim() : '';
    }

    if (!internId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const intern = await getInternById(internId);
    if (!intern) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentPayload = {
      name: intern.name,
      start_date: intern.start_date,
      end_date: intern.end_date,
    };

    const scriptPath = path.join(process.cwd(), 'generate_closure.py');
    tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-closure-'));
    const result = await runClosureGeneration(scriptPath, studentPayload, tempOutputDir);
    const parsed = parseResult(result.stdout);

    if (result.code !== 0 || (parsed && parsed.failedCount > 0)) {
      return NextResponse.json(
        { error: `Generation failed. ${result.stderr || result.stdout}`.trim() },
        { status: 500 }
      );
    }

    const filePath = resolveGeneratedFilePath(parsed?.outputPath, tempOutputDir);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Closure certificate generated but output file was not found.' },
        { status: 500 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate closure certificate';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempOutputDir) {
      try {
        fs.rmSync(tempOutputDir, { recursive: true, force: true });
      } catch {
        // noop
      }
    }
  }
}

export async function GET(request: Request) {
  return handleClosure(request);
}

export async function POST(request: Request) {
  return handleClosure(request);
}
