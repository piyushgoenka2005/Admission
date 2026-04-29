import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const aadhaar = String(body?.aadhaar || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    if (!aadhaar || !email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const db = await getMongoDb();
    const accounts = db.collection('student_accounts');

    const hashedPassword = Buffer.from(password).toString('base64');

    const user = await accounts.findOne({ aadhaar_number: aadhaar, email, password_hash: hashedPassword });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const studentsCol = db.collection('students');
    const appRecord = await studentsCol.findOne({ account_id: user._id });

    return NextResponse.json({ id: String(user._id), aadhaar: user.aadhaar_number, email: user.email, appId: appRecord ? String(appRecord.id || appRecord._id) : null });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
