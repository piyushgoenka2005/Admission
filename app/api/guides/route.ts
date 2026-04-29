import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { guideProfiles } from '@/lib/guideDetails';
import { normalizeGuideName } from '@/lib/portal';
import { getMongoDb } from '@/lib/mongodb';

const execFileAsync = promisify(execFile);

// Using local MongoDB instead of Supabase
const guideExcelEnabled = process.env.GUIDE_EXCEL_ENABLED === 'true';
const guideWorkbookPath = '/Users/aditi./internship-portal/guideDetails.xlsx';
const guideExcelScriptPath = '/Users/aditi./internship-portal/scripts/append_guide_to_excel.py';
const guidePythonExecutable = process.env.GUIDE_PYTHON_EXECUTABLE || 'python';

const getGuidesFromDatabase = async () => {
  const db = await getMongoDb();
  const guides = await db
    .collection('guides')
    .find()
    .sort({ name: 1 })
    .toArray();

  return { data: guides, error: null } as const;
};

const syncDefaultGuidesToDatabase = async () => {
  const payload = guideProfiles.map((guide) => ({
    name: guide.name,
    normalized_name: normalizeGuideName(guide.name),
    division: guide.division,
    reporting_officer: guide.reportingOfficer,
    email: guide.email,
    dd: guide.dd,
    created_at: new Date(),
  }));

  if (!payload.length) return;

  const db = await getMongoDb();
  const col = db.collection('guides');

  // Upsert each bundled guide by normalized_name
  for (const doc of payload) {
    await col.updateOne(
      { normalized_name: doc.normalized_name },
      { $set: { name: doc.name, division: doc.division, reporting_officer: doc.reporting_officer, email: doc.email, dd: doc.dd }, $setOnInsert: { created_at: doc.created_at } },
      { upsert: true },
    );
  }
};

export async function GET() {
  const { data } = await getGuidesFromDatabase();

  return NextResponse.json({
    guides: (data || []).map((guide: any) => ({
      name: guide.name,
      division: guide.division,
      reportingOfficer: guide.reporting_officer,
      email: guide.email,
      dd: guide.dd || '',
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const division = String(body?.division || '').trim();
    const reportingOfficer = String(body?.reportingOfficer || '').trim();
    const email = String(body?.email || '').trim();
    const dd = String(body?.dd || '').trim();

    if (!name || !division || !reportingOfficer || !email) {
      return NextResponse.json({ error: 'All four guide fields are required.' }, { status: 400 });
    }

    const normalizedName = normalizeGuideName(name);
    const db = await getMongoDb();
    const col = db.collection('guides');

    const existingGuide = await col.findOne({ normalized_name: normalizedName });
    const wasExisting = Boolean(existingGuide);

    const upsertDoc = {
      name,
      normalized_name: normalizedName,
      division,
      reporting_officer: reportingOfficer,
      email,
      dd,
      updated_at: new Date(),
    } as any;

    const result = await col.findOneAndUpdate(
      { normalized_name: normalizedName },
      { $set: upsertDoc, $setOnInsert: { created_at: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );

    let data = result && (result as any).value;

    // Some driver versions / environments may not populate result.value reliably with upsert.
    // Fetch the document explicitly as a fallback to ensure we return the saved record.
    if (!data) {
      try {
        data = await col.findOne({ normalized_name: normalizedName });
      } catch (fetchErr) {
        console.error('Failed to fetch guide after upsert:', fetchErr, 'findOneAndUpdate result:', result);
      }
    }

    if (!data) {
      console.error('Upsert returned no document for normalized_name:', normalizedName, 'result:', result);
      return NextResponse.json({ error: 'Guide save failed unexpectedly. No record after upsert.' }, { status: 500 });
    }

    if (!wasExisting && guideExcelEnabled) {
      try {
        await execFileAsync(guidePythonExecutable, [guideExcelScriptPath, guideWorkbookPath, name, division, reportingOfficer, email]);
      } catch (excelError) {
        return NextResponse.json(
          {
            guide: {
              name: data.name,
              division: data.division,
              reportingOfficer: data.reporting_officer,
              email: data.email,
              dd: data.dd || dd,
            },
            action: wasExisting ? 'updated' : 'created',
            error: excelError instanceof Error ? excelError.message : 'Guide saved in database, but Excel update failed.',
            partialSuccess: true,
          },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({
      guide: {
        name: data.name,
        division: data.division,
        reportingOfficer: data.reporting_officer,
        email: data.email,
        dd: data.dd || dd,
      },
      action: wasExisting ? 'updated' : 'created',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
