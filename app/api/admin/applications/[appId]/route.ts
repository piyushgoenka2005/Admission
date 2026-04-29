import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

const TOP_LEVEL_FIELDS = new Set([
  'latest_notification_type',
  'latest_notification_message',
  'latest_notification_sent_at',
  'notification_history',
]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await context.params;
    if (!ObjectId.isValid(appId)) {
      return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
    }

    const body = await request.json();
    const updates = (body?.updates || {}) as Record<string, unknown>;

    const setPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'account_id') continue;

      if (TOP_LEVEL_FIELDS.has(key)) {
        setPayload[key] = value;
        continue;
      }

      setPayload[`student.${key}`] = value;
      if (key === 'student_uid') {
        setPayload.student_uid = value;
      }
    }

    const db = await getMongoDb();
    const applications = db.collection('applications');

    const result = await applications.updateOne(
      { _id: new ObjectId(appId) },
      { $set: setPayload },
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update application.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await context.params;
    if (!ObjectId.isValid(appId)) {
      return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const applications = db.collection('applications');

    const result = await applications.deleteOne({ _id: new ObjectId(appId) });
    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete application.' },
      { status: 500 },
    );
  }
}
