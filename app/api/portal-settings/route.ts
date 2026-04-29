import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { DEFAULT_APPLICATION_NOTICE, DEFAULT_APPLICATIONS_OPEN } from '@/lib/portal';

const parseApplicationsOpen = () => {
  const fromEnv = process.env.APPLICATIONS_OPEN;
  if (fromEnv === undefined) {
    return DEFAULT_APPLICATIONS_OPEN;
  }

  return fromEnv.toLowerCase() === 'true';
};

export async function GET() {
  try {
    const db = await getMongoDb();
    const settingsCollection = db.collection('settings');
    const stored = await settingsCollection.findOne({ key: 'portal_settings' });

    return NextResponse.json({
      applications_open: stored?.applications_open ?? parseApplicationsOpen(),
      application_notice: stored?.application_notice || process.env.APPLICATION_NOTICE || DEFAULT_APPLICATION_NOTICE,
    });
  } catch {
    return NextResponse.json({
      applications_open: parseApplicationsOpen(),
      application_notice: process.env.APPLICATION_NOTICE || DEFAULT_APPLICATION_NOTICE,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const applicationsOpen = Boolean(body?.applications_open);
    const applicationNotice = String(body?.application_notice || DEFAULT_APPLICATION_NOTICE);

    const db = await getMongoDb();
    const settingsCollection = db.collection('settings');

    await settingsCollection.updateOne(
      { key: 'portal_settings' },
      {
        $set: {
          key: 'portal_settings',
          applications_open: applicationsOpen,
          application_notice: applicationNotice,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      applications_open: applicationsOpen,
      application_notice: applicationNotice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save portal settings.' },
      { status: 500 },
    );
  }
}
