"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PersonalDetails from '@/components/PersonalDetails';
import { CheckCircle2, Lock, Sparkles, TestTube } from 'lucide-react';
import { ApplicationFormData, Student, StudentNotification } from '@/types';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  DEFAULT_APPLICATION_NOTICE,
  DEFAULT_APPLICATIONS_OPEN,
  PORTAL_SETTINGS_STORAGE_KEY,
  getErrorMessage,
} from '@/lib/portal';
import { emitNewApplicationAlert } from '@/lib/liveApplicationAlerts';

const defaultStudentData: ApplicationFormData['student'] = {
  name: '',
  phone_number: '',
  email: '',
  state: '',
  duration: '',
  start_date: '',
  end_date: '',
  // Personal Details
  salutation: 'Mr.',
  gender: '',
  date_of_birth: '',
  city: '',
  // Family Details
  fathers_name: '',
  mothers_name: '',
  identification_marks: '',
  family_members: [],
  // Educational Details
  college_name: '',
  college_address: '',
  college_phone_number: '',
  university_name: '',
  qualification: '',
  hod_name: '',
  hod_email: '',
  // Address Details
  permanent_address: '',
  present_address: '',
  // Application Details
  main_category: 'intern',
  photo_id_proof: '',
  reporting_division: '',
  entry_permissions: [],
  project_name: '',
  project_description: '',
  network_internal: false,
  network_internet: false,
  software_required: '',
  storage_space: '',
  // Meta
  photo_url: '',
  signature_url: '',
  aadhaar_url: '',
  college_id_url: '',
  bonafide_url: '',
};

interface StoredApplication {
  id: string;
  student: Partial<Student>;
  student_uid?: string;
  latest_notification_type?: string;
  latest_notification_message?: string;
  latest_notification_sent_at?: string;
  notification_history?: StudentNotification[];
  created_at?: string;
}

const getHyderabadLocalTimestamp = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const values: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
};

const calculateAgeFromDob = (dob?: string): number | undefined => {
  if (!dob) return undefined;

  const [yearStr, monthStr, dayStr] = dob.split('T')[0].split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return undefined;

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age >= 0 ? age : undefined;
};

const calculateDurationDays = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '';

  const dayMs = 1000 * 60 * 60 * 24;
  const duration = Math.round((end.getTime() - start.getTime()) / dayMs);
  return `${duration}_days`;
};

export default function ApplicationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [hasExistingApp, setHasExistingApp] = useState(false);
  const [existingStudentId, setExistingStudentId] = useState<string | null>(null);
  const [existingStudentRecord, setExistingStudentRecord] = useState<Student | null>(null);
  const [generatedStudentUid, setGeneratedStudentUid] = useState('');
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(DEFAULT_APPLICATIONS_OPEN);
  const [applicationNotice, setApplicationNotice] = useState(DEFAULT_APPLICATION_NOTICE);
  const [formData, setFormData] = useState<ApplicationFormData['student']>(defaultStudentData);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const loadPage = async () => {
      const storedApplicationId = localStorage.getItem('nrsc_app_id');
      await fetchPortalSettings();
      if (storedApplicationId) {
        await fetchExistingApp(storedApplicationId);
      }
      setIsLoadingApp(false);
    };

    loadPage();
  }, []);

  const fetchPortalSettings = async () => {
    try {
      const response = await fetch('/api/portal-settings', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load portal settings');
      }

      setApplicationsOpen(data.applications_open ?? DEFAULT_APPLICATIONS_OPEN);
      setApplicationNotice(data.application_notice || DEFAULT_APPLICATION_NOTICE);
      localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify(data));
    } catch (err: unknown) {
      const storedSettings = localStorage.getItem(PORTAL_SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setApplicationsOpen(parsed.applications_open ?? DEFAULT_APPLICATIONS_OPEN);
        setApplicationNotice(parsed.application_notice || DEFAULT_APPLICATION_NOTICE);
        console.warn('Using cached portal settings. Local settings API unavailable:', getErrorMessage(err));
        return;
      }
      console.warn('Unable to load portal settings:', getErrorMessage(err));
    }
  };

  const fetchExistingApp = async (studentId: string) => {
    try {
      const response = await fetch(`/api/applications?appId=${encodeURIComponent(studentId)}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load existing application');
      }

      const application = data?.application as StoredApplication | null;
      if (!application) {
        localStorage.removeItem('nrsc_app_id');
        return;
      }

      setHasExistingApp(true);
      setExistingStudentId(application.id);
      setExistingStudentRecord({
        ...(application.student as Student),
        id: application.id,
        student_uid: application.student_uid || application.student.student_uid,
        latest_notification_type: application.latest_notification_type,
        latest_notification_message: application.latest_notification_message,
        latest_notification_sent_at: application.latest_notification_sent_at,
        notification_history: application.notification_history || [],
      });
      setGeneratedStudentUid(application.student_uid || application.student.student_uid || '');
      setFormData({
        name: application.student.name || '',
        phone_number: application.student.phone_number || '',
        email: application.student.email || '',
        state: application.student.state || '',
        start_date: application.student.start_date || '',
        end_date: application.student.end_date || '',
        // Personal Details
        salutation: application.student.salutation || 'Mr.',
        gender: application.student.gender || '',
        date_of_birth: application.student.date_of_birth || '',
        age: calculateAgeFromDob(application.student.date_of_birth) ?? application.student.age ?? undefined,
        city: application.student.city || '',
        // Family Details
        fathers_name: application.student.fathers_name || '',
        mothers_name: application.student.mothers_name || '',
        // Educational Details
        college_name: application.student.college_name || '',
        college_address: application.student.college_address || '',
        college_phone_number: application.student.college_phone_number || '',
        university_name: application.student.university_name || '',
        qualification: application.student.qualification || '',
        hod_name: application.student.hod_name || '',
        hod_email: application.student.hod_email || '',
        // Address Details
        permanent_address: application.student.permanent_address || '',
        present_address: application.student.present_address || '',
        // Meta
        photo_url: application.student.photo_url || '',
        signature_url: application.student.signature_url || '',
        aadhaar_url: application.student.aadhaar_url || '',
        assigned_scientist: application.student.assigned_scientist || '',
        student_uid: application.student.student_uid || '',
      });
    } catch (err: unknown) {
      console.warn('Error fetching existing application:', getErrorMessage(err));
    }
  };

  const sendNotificationEmail = async (type: string, studentEmail: string, studentName: string, reportingDate?: string) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, studentEmail, studentName, reportingDate }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        subject: 'Application Received',
        message: data?.error || 'Notification logged without email delivery.',
        skipped: true,
      };
    }
    return { ...(data as { subject: string; message: string }), skipped: false };
  };

  const appendNotificationHistory = async (studentId: string, notification: StudentNotification) => {
    const response = await fetch(`/api/applications/${studentId}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to update notification history.');
    }
  };

  const fillTestData = () => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 months later
    const dob = '2000-01-15';
    
    setFormData({
      name: 'John William Doe',
      phone_number: '+91-9876543210',
      email: 'john.doe.test@example.com',
      state: 'Telangana',
      duration: '3_months',
      start_date: startDate,
      end_date: endDate,
      // Personal Details
      salutation: 'Mr.',
      gender: 'Male',
      date_of_birth: dob,
      age: 25,
      city: 'Hyderabad',
      // Category
      main_category: 'intern',
      // Family Details
      fathers_name: 'Robert Doe',
      mothers_name: 'Jane Doe',
      identification_marks: 'Mole on left cheek',
      family_members: [
        { name: 'Alice Doe', relationship: 'Sister' },
      ],
      // Educational Details
      college_name: 'Test Engineering College',
      college_address: '456 College Road, Hyderabad',
      college_phone_number: '+91-9876543211',
      university_name: 'Test University',
      qualification: 'B.Tech Computer Science',
      hod_name: 'Dr. Smith Johnson',
      hod_email: 'hod.test@college.edu',
      // Address Details
      permanent_address: '123 Test Street, Sample Area, Hyderabad',
      present_address: '456 Hostel Road, Hyderabad',
      // Photo ID Proofs
      photo_id_proof: 'Aadhaar Card,College ID Card',
      // Project Details
      reporting_division: 'AA&CIG',
      entry_permissions: [
        { location: 'Balanagar - High Security Zone', allowed: true },
        { location: 'Balanagar - Low Security Zone', allowed: true },
      ],
      // System Resources
      project_name: 'Remote Sensing Data Analysis',
      project_description: 'Analysis of satellite imagery for agricultural monitoring',
      network_internal: true,
      network_internet: true,
      software_required: 'ERDAS, ArcGIS, QGIS',
      storage_space: '100 GB',
    });
  };

  const handleSubmit = async () => {
    if (!applicationsOpen && !hasExistingApp) {
      setSubmitError(applicationNotice);
      return;
    }

    // Validate required fields
    const requiredFields = [
      { field: formData.name, name: 'Student Name' },
      { field: formData.phone_number, name: 'Phone Number' },
      { field: formData.email, name: 'Email' },
      { field: formData.gender, name: 'Gender' },
      { field: formData.state, name: 'State' },
      { field: formData.date_of_birth, name: 'Date of Birth' },
      { field: formData.fathers_name, name: "Father's Name" },
      { field: formData.mothers_name, name: "Mother's Name" },
      { field: formData.college_name, name: 'College Name' },
      { field: formData.college_address, name: 'College Address' },
      { field: formData.college_phone_number, name: 'College Phone Number' },
      { field: formData.university_name, name: 'University Name' },
      { field: formData.qualification, name: 'Qualification' },
      { field: formData.hod_name, name: 'HOD Name' },
      { field: formData.hod_email, name: 'HOD Email' },
      { field: formData.permanent_address, name: 'Permanent Address' },
      { field: formData.present_address, name: 'Present Address' },
      { field: formData.start_date, name: 'Date of Joining' },
      { field: formData.end_date, name: 'Date of Expiry' },
    ];

    const missingFields = requiredFields.filter(f => !f.field || f.field.trim() === '');
    if (missingFields.length > 0) {
      setSubmitError(`Please fill in all required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const submissionTimestamp = getHyderabadLocalTimestamp();
      const computedAge = calculateAgeFromDob(formData.date_of_birth);
      const computedDuration = calculateDurationDays(formData.start_date, formData.end_date);
      const studentPayload: Partial<Student> = {
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email,
        state: formData.state,
        duration: computedDuration || formData.duration,
        start_date: formData.start_date,
        end_date: formData.end_date,
        // Personal Details
        salutation: formData.salutation,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        age: computedAge,
        city: formData.city,
        // Category
        main_category: formData.main_category,
        // Family Details
        fathers_name: formData.fathers_name,
        mothers_name: formData.mothers_name,
        identification_marks: formData.identification_marks,
        family_members: formData.family_members,
        // Educational Details
        college_name: formData.college_name,
        college_address: formData.college_address,
        college_phone_number: formData.college_phone_number,
        university_name: formData.university_name,
        qualification: formData.qualification,
        hod_name: formData.hod_name,
        hod_email: formData.hod_email,
        // Address Details
        permanent_address: formData.permanent_address,
        present_address: formData.present_address,
        // Photo ID Proofs
        photo_id_proof: formData.photo_id_proof,
        // Project Details
        reporting_division: formData.reporting_division,
        entry_permissions: formData.entry_permissions,
        // System Resources
        project_name: formData.project_name,
        project_description: formData.project_description,
        network_internal: formData.network_internal,
        network_internet: formData.network_internet,
        software_required: formData.software_required,
        storage_space: formData.storage_space,
        // Meta
        photo_url: formData.photo_url || '',
        signature_url: formData.signature_url || '',
        aadhaar_url: formData.aadhaar_url || '',
        college_id_url: formData.college_id_url || '',
        bonafide_url: formData.bonafide_url || '',
        student_uid: generatedStudentUid || undefined,
        reported_at: submissionTimestamp,
        reporting_date: submissionTimestamp,
      };

      const saveResponse = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: existingStudentId,
          student: studentPayload,
          academics: [],
        }),
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData?.error || 'Failed to save application');
      }

      const studentId = saveData.applicationId as string;
      const studentUid = saveData.studentUid as string;

      try {
        const studentName = formData.name.trim();
        const emailResult = await sendNotificationEmail('application_received', formData.email, studentName);
        const notification = {
          type: 'application_received',
          subject: emailResult.subject,
          message: emailResult.skipped
            ? 'Application submitted successfully. Email delivery is currently skipped in test mode.'
            : emailResult.message,
          sent_at: getHyderabadLocalTimestamp(),
          recipient_email: formData.email,
          status: emailResult.skipped ? 'LOGGED' : 'SENT',
        } as StudentNotification;
        await appendNotificationHistory(studentId!, notification);
        setExistingStudentRecord((prev) => ({
          ...(prev || studentPayload as Student),
          id: studentId!,
          student_uid: studentUid,
          latest_notification_type: notification.type,
          latest_notification_message: notification.message,
          latest_notification_sent_at: notification.sent_at,
          notification_history: [...(prev?.notification_history || []), notification],
        }));

        emitNewApplicationAlert({
          id: studentId!,
          studentUid,
          name: studentName,
          createdAt: submissionTimestamp,
          source: 'application-form',
        });
      } catch (notificationError) {
        console.error('Application notification failed:', notificationError);
      }

      setGeneratedStudentUid(studentUid);
      setExistingStudentId(studentId!);
      setHasExistingApp(true);
      localStorage.setItem('nrsc_app_id', studentId!);
      setSubmitSuccess(true);
    } catch (error: unknown) {
      console.error('Submission error:', error);
      setSubmitError(getErrorMessage(error, 'Failed to submit application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingApp) return null;

  if (!applicationsOpen) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
          <div className="w-full rounded-[2.5rem] border border-white/70 bg-white/75 p-10 text-center shadow-[0_30px_80px_rgba(255,111,145,0.15)] backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#ffdce6] to-[#dff5ff] text-[#ff6f91] shadow-lg">
              <Lock size={34} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">Application Intake</p>
            <h1 className="mt-3 text-4xl font-black text-slate-800">Currently Not Accepting Applications</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700">{applicationNotice}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="rounded-2xl bg-white px-6 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5"
              >
                Return Home
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('nrsc_app_id');
                  setHasExistingApp(false);
                  setExistingStudentId(null);
                  setExistingStudentRecord(null);
                  setGeneratedStudentUid('');
                  setFormData({ ...defaultStudentData });
                }}
                className="rounded-2xl bg-gradient-to-r from-[#ff8db2] to-[#8fc7ff] px-6 py-3 font-bold text-white shadow-lg shadow-pink-200/60 transition hover:-translate-y-0.5"
              >
                Start New Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen px-6 py-10">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={320} />
        <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
          <div className="w-full rounded-[2.5rem] border border-white/70 bg-white/80 p-12 text-center shadow-[0_28px_75px_rgba(143,199,255,0.25)] backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#c8f7dc] to-[#dff5ff] text-emerald-600 shadow-xl">
              <CheckCircle2 size={48} />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">Application Submitted</p>
            <h2 className="mt-3 text-4xl font-black text-slate-800">Your profile has been recorded</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              The portal has stored your application successfully. Please keep your student ID safe for future reference.
            </p>
            {generatedStudentUid && (
              <div className="mx-auto mt-8 max-w-sm rounded-[2rem] border border-[#f7d1df] bg-gradient-to-r from-[#fff0f5] to-[#eef9ff] px-6 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-700">Student ID</p>
                <p className="mt-2 text-4xl font-black tracking-[0.2em] text-slate-800">{generatedStudentUid}</p>
              </div>
            )}
            <button
              onClick={() => router.push('/')}
              className="mt-10 rounded-2xl bg-gradient-to-r from-[#ff8db2] via-[#ffb7b2] to-[#8fc7ff] px-8 py-4 font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-pink-200/60 transition hover:-translate-y-1"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    return <PersonalDetails formData={formData} setFormData={setFormData} />;
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-[0_18px_55px_rgba(255,141,178,0.14)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#fff0f5] to-[#eef9ff] p-3 shadow-sm">
                <img src="/isro_logo_secondary.svg" alt="ISRO Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">NRSC Internship Portal</p>
                <h1 className="text-2xl font-black text-slate-800 md:text-3xl">Application Workspace</h1>
                <h2 className="mt-2 text-sm font-black text-slate-800">Complete your application carefully</h2>
              </div>
            </div>
            <button
              onClick={() => {
                router.push('/');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-600 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
            >
              Return Home
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/75 shadow-[0_25px_70px_rgba(35,48,74,0.10)] backdrop-blur-xl">
          {/* <div className="mb-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-[#ffd7e7] bg-gradient-to-r from-[#fff0f6] via-[#fff7ec] to-[#eef9ff] p-6 shadow-[0_18px_40px_rgba(255,141,178,0.14)]">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 text-[#ff6f91]" size={22} />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">Application Status</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-800">
                    {hasExistingApp ? 'Update your submitted application' : 'Complete your application carefully'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Fill only the required personal, family, education and contact details.
                  </p>
                  {existingStudentRecord?.latest_notification_message && (
                    <div className="mt-4 rounded-2xl border border-[#f7d1df] bg-white/80 px-4 py-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-700">Latest Update</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                        {existingStudentRecord.latest_notification_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-[#d9ecff] bg-white/80 p-6 shadow-[0_18px_35px_rgba(143,199,255,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">Reference</p>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-slate-700">Registered email</p>
                <p className="text-lg font-bold text-slate-800">{formData.email || 'Not entered yet'}</p>
                {generatedStudentUid && (
                  <>
                    <p className="pt-3 text-sm text-slate-700">Student ID</p>
                    <p className="text-2xl font-black tracking-[0.2em] text-slate-800">{generatedStudentUid}</p>
                  </>
                )}
              </div>
            </div>
          </div> */}

          <main className="h-[calc(100vh-16rem)] overflow-y-auto bg-transparent px-4 py-6 md:px-8 md:py-8">
            {submitError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                {submitError}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {renderStep()}
            </form>
          </main>

          <footer className="flex items-center justify-between border-t border-[#f4dde5] bg-white/70 px-4 py-4 md:px-8">
            <button
              onClick={fillTestData}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#9ca3af] via-[#6b7280] to-[#4b5563] px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-gray-200/60 transition hover:-translate-y-0.5"
            >
              <TestTube size={16} />
              Fill Test Data
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff8db2] via-[#ffb7b2] to-[#8fc7ff] px-7 py-4 text-sm font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-pink-200/60 transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Processing...' : 'Submit Application'}
              {!isSubmitting && <CheckCircle2 size={18} />}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
