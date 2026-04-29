import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

type ApplicationDocument = {
  _id: { toString(): string };
  student?: Record<string, unknown>;
  academics?: Record<string, unknown>[];
  student_uid?: string;
  created_at?: string;
  latest_notification_type?: string;
  latest_notification_message?: string;
  latest_notification_sent_at?: string;
  notification_history?: Record<string, unknown>[];
};

const mapApplicationToStudent = (application: ApplicationDocument) => {
  const student = application.student || {};
  const legacy = application as unknown as Record<string, unknown>;

  return {
    id: application._id.toString(),
    ...student,
    // Core fields
    student_uid: (student.student_uid as string) || application.student_uid || '',
    // Personal Details
    name: (student.name as string) || '',
    salutation: (student.salutation as string) || '',
    gender: (student.gender as string) || '',
    date_of_birth: (student.date_of_birth as string) || '',
    age: (student.age as number) || undefined,
    city: (student.city as string) || '',
    // Category
    main_category: (student.main_category as string) || '',
    // Family Details
    fathers_name: (student.fathers_name as string) || '',
    mothers_name: (student.mothers_name as string) || '',
    identification_marks: (student.identification_marks as string) || '',
    family_members: Array.isArray(student.family_members) ? student.family_members : [],
    // Educational Details
    college_name: (student.college_name as string) || (legacy.college_name as string) || (legacy.college as string) || '',
    college_address: (student.college_address as string) || '',
    college_phone_number: (student.college_phone_number as string) || '',
    university_name: (student.university_name as string) || (legacy.university_name as string) || '',
    qualification: (student.qualification as string) || '',
    hod_name: (student.hod_name as string) || (student.college_dean_hod as string) || (legacy.college_dean_hod as string) || (legacy['college dean hod'] as string) || '',
    hod_email: (student.hod_email as string) || '',
    // Address Details
    permanent_address: (student.permanent_address as string) || '',
    present_address: (student.present_address as string) || '',
    // Photo ID Proofs
    photo_id_proof: (student.photo_id_proof as string) || '',
    // Internship Details
    present_date: (student.present_date as string) || (legacy.present_date as string) || '',
    start_date: (student.start_date as string) || (legacy.start_date as string) || '',
    end_date: (student.end_date as string) || (legacy.end_date as string) || '',
    duration: (student.duration as string) || '',
    dd: (student.dd as string) || (legacy.dd as string) || '',
    reporting_division: (student.reporting_division as string) || '',
    entry_permissions: Array.isArray(student.entry_permissions) ? student.entry_permissions : [],
    // System Resources
    project_name: (student.project_name as string) || '',
    project_description: (student.project_description as string) || '',
    network_internal: (student.network_internal as boolean) || false,
    network_internet: (student.network_internet as boolean) || false,
    software_required: (student.software_required as string) || '',
    storage_space: (student.storage_space as string) || '',
    // Meta
    academic_details: Array.isArray(application.academics) ? application.academics : [],
    latest_notification_type: application.latest_notification_type || '',
    latest_notification_message: application.latest_notification_message || '',
    latest_notification_sent_at: application.latest_notification_sent_at || '',
    notification_history: Array.isArray(application.notification_history) ? application.notification_history : [],
    created_at: (student.created_at as string) || application.created_at || '',
    reported_at: (student.reported_at as string) || '',
    guide_assigned_at: (student.guide_assigned_at as string) || '',
  };
};

export async function GET() {
  try {
    const db = await getMongoDb();
    const applications = db.collection<ApplicationDocument>('applications');

    const items = await applications
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({
      students: items.map(mapApplicationToStudent),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch applications.' },
      { status: 500 },
    );
  }
}
