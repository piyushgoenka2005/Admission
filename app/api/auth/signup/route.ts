import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const aadhaar = String(body?.aadhaar || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    if (!/^[0-9]{12}$/.test(aadhaar)) {
      return NextResponse.json({ error: 'Aadhaar must be exactly 12 digits' }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const accounts = db.collection('student_accounts');

    const existing = await accounts.findOne({ aadhaar_number: aadhaar });
    if (existing) {
      return NextResponse.json({ error: 'An account with this Aadhaar number already exists.' }, { status: 400 });
    }

    const hashedPassword = Buffer.from(password).toString('base64');

    const insertResult = await accounts.insertOne({ aadhaar_number: aadhaar, email, password_hash: hashedPassword, created_at: new Date() });

    if (!insertResult.insertedId) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
