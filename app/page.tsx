'use client';

import { FormEvent, useState } from 'react';

type FormState = {
  joining_month: string;
  name_college_dean: string;
  name_college: string;
  state: string;
  district: string;
  salute: string;
  name_student: string;
  course: string;
  project_from_date: string;
  project_to_date: string;
  student_email: string;
  student_phone: string;
  email_college_dean: string;
  subject: string;
};

const initialFormState: FormState = {
  joining_month: '',
  name_college_dean: '',
  name_college: '',
  state: '',
  district: '',
  salute: '',
  name_student: '',
  course: '',
  project_from_date: '',
  project_to_date: '',
  student_email: '',
  student_phone: '',
  email_college_dean: '',
  subject: '',
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setMessage({ type: 'success', text: data.message || 'Application submitted successfully.' });
      setForm(initialFormState);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit application.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Student Application Form</h1>
          <p className="mt-2 text-sm text-slate-600">Fill in all details below and submit your request.</p>

          <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Joining Month</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.joining_month} onChange={(e) => update('joining_month', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Name CollegeDean</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name_college_dean} onChange={(e) => update('name_college_dean', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Name College</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name_college} onChange={(e) => update('name_college', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">State</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.state} onChange={(e) => update('state', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">District</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.district} onChange={(e) => update('district', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Salute</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.salute} onChange={(e) => update('salute', e.target.value)} required />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Name Student</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name_student} onChange={(e) => update('name_student', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Course</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.course} onChange={(e) => update('course', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Subject</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.subject} onChange={(e) => update('subject', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Project From Date</span>
              <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.project_from_date} onChange={(e) => update('project_from_date', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Project To Date</span>
              <input type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.project_to_date} onChange={(e) => update('project_to_date', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Student Email</span>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.student_email} onChange={(e) => update('student_email', e.target.value)} required />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Student Phone No</span>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.student_phone} onChange={(e) => update('student_phone', e.target.value)} required />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Email College Dean</span>
              <input type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.email_college_dean} onChange={(e) => update('email_college_dean', e.target.value)} required />
            </label>

            {message && (
              <p className={`md:col-span-2 text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
