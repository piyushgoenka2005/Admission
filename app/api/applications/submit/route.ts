import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

type ApplicationPayload = {
  joining_month: string;
  name_college_dean: string;
  name_college: string;
  state: string;
  district: string;
  salute: string;
  name_student: string;
  course: string;
  project_from_date: string;
  project_to_date: string;
  student_email: string;
  student_phone: string;
  email_college_dean: string;
  subject: string;
};

const REQUIRED_KEYS: Array<keyof ApplicationPayload> = [
  'joining_month',
  'name_college_dean',
  'name_college',
  'state',
  'district',
  'salute',
  'name_student',
  'course',
  'project_from_date',
  'project_to_date',
  'student_email',
  'student_phone',
  'email_college_dean',
  'subject',
];

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const payload: ApplicationPayload = {
      joining_month: normalize(body.joining_month),
      name_college_dean: normalize(body.name_college_dean),
      name_college: normalize(body.name_college),
      state: normalize(body.state),
      district: normalize(body.district),
      salute: normalize(body.salute),
      name_student: normalize(body.name_student),
      course: normalize(body.course),
      project_from_date: normalize(body.project_from_date),
      project_to_date: normalize(body.project_to_date),
      student_email: normalize(body.student_email),
      student_phone: normalize(body.student_phone),
      email_college_dean: normalize(body.email_college_dean),
      subject: normalize(body.subject),
    };

    const missing = REQUIRED_KEYS.filter((key) => !payload[key]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Please fill all required fields. Missing: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'student-applications.json');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]')
      : [];

    const record = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      submitted_at: new Date().toISOString(),
      ...payload,
    };

    const records = Array.isArray(existing) ? existing : [];
    records.push(record);
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Application submitted successfully.' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
