import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { generateStudentUid } from '@/lib/portal';

export const runtime = 'nodejs';

type ApplicationDocument = {
  _id?: ObjectId;
  student: Record<string, unknown>;
  academics: Record<string, unknown>[];
  student_uid: string;
  created_at: string;
  updated_at: string;
  notification_history?: Record<string, unknown>[];
  latest_notification_type?: string;
  latest_notification_message?: string;
  latest_notification_sent_at?: string;
};

const toResponseShape = (doc: ApplicationDocument) => ({
  id: doc._id?.toString(),
  student: doc.student,
  academics: doc.academics || [],
  student_uid: doc.student_uid,
  created_at: doc.created_at,
  updated_at: doc.updated_at,
  notification_history: doc.notification_history || [],
  latest_notification_type: doc.latest_notification_type || '',
  latest_notification_message: doc.latest_notification_message || '',
  latest_notification_sent_at: doc.latest_notification_sent_at || '',
});

const getMonthWindow = (dateValue: string) => {
  const date = new Date(dateValue);
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();
  return { start, end };
};

const getNextStudentUid = async (createdAtIso: string) => {
  const db = await getMongoDb();
  const applications = db.collection<ApplicationDocument>('applications');
  const { start, end } = getMonthWindow(createdAtIso);

  const count = await applications.countDocuments({
    created_at: { $gte: start, $lt: end },
  });

  return generateStudentUid(count + 1, createdAtIso);
};

export async function GET(request: NextRequest) {
  try {
    const appId = request.nextUrl.searchParams.get('appId');
    if (!appId || !ObjectId.isValid(appId)) {
      return NextResponse.json({ application: null }, { status: 200 });
    }

    const db = await getMongoDb();
    const applications = db.collection<ApplicationDocument>('applications');
    const application = await applications.findOne({ _id: new ObjectId(appId) });

    if (!application) {
      return NextResponse.json({ application: null }, { status: 200 });
    }

    return NextResponse.json({ application: toResponseShape(application) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load application.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const appId = typeof body?.appId === 'string' ? body.appId : null;
    const student = body?.student;
    const academics = Array.isArray(body?.academics) ? body.academics : [];

    if (!student || typeof student !== 'object') {
      return NextResponse.json({ error: 'Student payload is required.' }, { status: 400 });
    }

    const db = await getMongoDb();
    const applications = db.collection<ApplicationDocument>('applications');
    const nowIso = new Date().toISOString();

    if (appId && ObjectId.isValid(appId)) {
      const existing = await applications.findOne({ _id: new ObjectId(appId) });
      if (!existing) {
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
      }

      const preservedUid =
        (typeof (student as Record<string, unknown>).student_uid === 'string' && (student as Record<string, unknown>).student_uid) ||
        existing.student_uid ||
        (await getNextStudentUid(existing.created_at));

      const updatedDoc: Partial<ApplicationDocument> = {
        student: {
          ...student,
          student_uid: preservedUid as string,
        },
        academics,
        student_uid: preservedUid as string,
        updated_at: nowIso as string,
      };

      await applications.updateOne(
        { _id: new ObjectId(appId) },
        { $set: updatedDoc },
      );

      const updated = await applications.findOne({ _id: new ObjectId(appId) });
      return NextResponse.json({
        applicationId: appId,
        studentUid: preservedUid,
        application: updated ? toResponseShape(updated) : null,
      });
    }

    const studentUid =
      (typeof (student as Record<string, unknown>).student_uid === 'string' && (student as Record<string, unknown>).student_uid) ||
      (await getNextStudentUid(nowIso));

    const insertDoc: ApplicationDocument = {
      student: {
        ...student,
        student_uid: studentUid as string,
      },
      academics,
      student_uid: studentUid as string,
      created_at: nowIso as string,
      updated_at: nowIso as string,
      notification_history: [],
      latest_notification_type: '',
      latest_notification_message: '',
      latest_notification_sent_at: '',
    };

    const insertResult = await applications.insertOne(insertDoc);
    const created = await applications.findOne({ _id: insertResult.insertedId });

    return NextResponse.json({
      applicationId: insertResult.insertedId.toString(),
      studentUid,
      application: created ? toResponseShape(created) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save application.' },
      { status: 500 },
    );
  }
}
