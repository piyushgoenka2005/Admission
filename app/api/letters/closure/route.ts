import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

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

async function runClosureGeneration(
  scriptPath: string,
  studentPayload: object,
  outputDir: string,
  options?: { sendToPrinter?: boolean }
) {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const configuredPython = process.env.PYTHON_EXECUTABLE || venvPython;

  const studentJson = JSON.stringify(studentPayload);
  const commonArgs = ['--student-json', studentJson, '--output', outputDir];
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

  throw lastError instanceof Error ? lastError : new Error('Failed to execute generate_closure.py');
}

async function handleClosure(request: Request) {
  let tempOutputDir = '';

  try {
    const body = await request.json().catch(() => ({}));
    const studentPayload = body?.studentPayload;
    const mode = body?.mode === 'print' ? 'print' : 'download';

    if (!studentPayload) {
      return NextResponse.json({ error: 'Student Payload is required' }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_closure.py');
    tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'websa-closure-'));
    const result = await runClosureGeneration(scriptPath, studentPayload, tempOutputDir, {
      sendToPrinter: mode === 'print',
    });
    const parsed = parseResult(result.stdout);

    if (result.code !== 0 || (parsed && parsed.failedCount > 0)) {
      return NextResponse.json(
        { error: `Generation failed. ${result.stderr || result.stdout}`.trim() },
        { status: 500 }
      );
    }

    if (mode === 'print') {
      return NextResponse.json(
        {
          success: true,
          message: 'Closure certificate sent to printer on server machine.',
          stdout: result.stdout,
          stderr: result.stderr,
          summary: parsed,
        },
        { status: 200 }
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

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
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

export async function POST(request: Request) {
  return handleClosure(request);
}
