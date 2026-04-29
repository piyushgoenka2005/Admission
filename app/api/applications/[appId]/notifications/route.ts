import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

type NotificationPayload = {
  type: string;
  subject: string;
  message: string;
  sent_at: string;
  recipient_email: string;
  status: 'SENT' | 'FAILED' | 'LOGGED';
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await context.params;
    if (!ObjectId.isValid(appId)) {
      return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
    }

    const body = await request.json();
    const notification = body?.notification as NotificationPayload | undefined;

    if (!notification || !notification.type || !notification.message || !notification.sent_at) {
      return NextResponse.json({ error: 'Notification payload is required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const applications = db.collection('applications');

    const result = await applications.updateOne(
      { _id: new ObjectId(appId) },
      {
        $push: {
          notification_history: notification,
        },
        $set: {
          latest_notification_type: notification.type,
          latest_notification_message: notification.message,
          latest_notification_sent_at: notification.sent_at,
          updated_at: new Date().toISOString(),
        },
      },
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to append notification.' },
      { status: 500 },
    );
  }
}
