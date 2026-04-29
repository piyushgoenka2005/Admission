import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const aadhaar = String(body?.aadhaar || '').trim();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    if (!/^[0-9]{12}$/.test(aadhaar)) {
      return NextResponse.json({ error: 'Aadhaar must be exactly 12 digits.' }, { status: 400 });
    }
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const db = await getMongoDb();
    const accounts = db.collection('student_accounts');

    const hashedPassword = Buffer.from(password).toString('base64');

    const res = await accounts.updateOne({ aadhaar_number: aadhaar, email }, { $set: { password_hash: hashedPassword, updated_at: new Date() } });

    if (res.matchedCount === 0) return NextResponse.json({ error: 'No account found for this Aadhaar and email combination.' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
