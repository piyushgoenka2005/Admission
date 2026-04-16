'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Intern } from '@/lib/db';

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  const rem = day % 10;
  if (rem === 1) return 'st';
  if (rem === 2) return 'nd';
  if (rem === 3) return 'rd';
  return 'th';
}

function formatPrettyDate(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function getInternshipStatusLabel(intern: Intern): string {
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = new Date(intern.start_date).getTime();
  const end = new Date(intern.end_date).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return 'Upcoming';

  const startDay = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), new Date(start).getDate()).getTime();
  const endDay = new Date(new Date(end).getFullYear(), new Date(end).getMonth(), new Date(end).getDate()).getTime();

  if (endDay < nowDay) return 'Completed';
  if (startDay <= nowDay && endDay >= nowDay) return 'Doing';
  return 'Upcoming';
}

function getDurationMonths(startDate: string, endDate: string): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '-';
  const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
  return `${months} month${months === 1 ? '' : 's'}`;
}

export default function InternDetailPage() {
  const params = useParams<{ slNo: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intern, setIntern] = useState<Intern | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatingClosure, setGeneratingClosure] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  const slNo = useMemo(() => {
    const value = Array.isArray(params?.slNo) ? params.slNo[0] : params?.slNo;
    return String(value || '').trim();
  }, [params?.slNo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slNo]);

  useEffect(() => {
    const fetchIntern = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/interns/list?force=1');
        if (!response.ok) {
          throw new Error('Failed to fetch interns');
        }
        const data = await response.json();
        const allInterns: Intern[] = data.data || [];
        const found = allInterns.find((entry) => String(entry.sl_no) === slNo) || null;
        setIntern(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading student details');
      } finally {
        setLoading(false);
      }
    };

    if (slNo) {
      fetchIntern();
    } else {
      setLoading(false);
      setError('Invalid student number');
    }
  }, [slNo]);

  const handleOfferLetter = async () => {
    if (!intern) return;
    setGeneratingLetter(true);
    setMessages((prev) => {
      const next = { ...prev };
      delete next.offer;
      return next;
    });
    try {
      const response = await fetch('/api/letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to print offer letter');
      setMessages((prev) => ({ ...prev, offer: { type: 'success', text: 'Offer letter sent to printer.' } }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        offer: { type: 'error', text: err instanceof Error ? err.message : 'Offer letter failed' },
      }));
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleClosureLetter = async () => {
    if (!intern) return;
    setGeneratingClosure(true);
    setMessages((prev) => {
      const next = { ...prev };
      delete next.closure;
      return next;
    });
    try {
      const response = await fetch('/api/letters/closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to print closure letter');
      setMessages((prev) => ({ ...prev, closure: { type: 'success', text: 'Closure letter sent to printer.' } }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        closure: { type: 'error', text: err instanceof Error ? err.message : 'Closure letter failed' },
      }));
    } finally {
      setGeneratingClosure(false);
    }
  };

  const handleEmail = async () => {
    if (!intern) return;
    setSendingEmail(true);
    setMessages((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
    try {
      const response = await fetch('/api/letters/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send email');
      setMessages((prev) => ({ ...prev, email: { type: 'success', text: data.message || 'Email sent successfully.' } }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        email: { type: 'error', text: err instanceof Error ? err.message : 'Email failed' },
      }));
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8">
            <p className="text-center text-slate-600">Loading student details...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 space-y-4">
            <p className="text-center text-red-600">{error}</p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/')}>Back to Dashboard</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!intern) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 space-y-4">
            <p className="text-center text-slate-700">Student not found for SL. No. {slNo}</p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.push('/')}>Back to Dashboard</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const status = getInternshipStatusLabel(intern);
  const profileFields: Array<[string, string]> = [
    ['SL. No.', String(intern.sl_no || '-')],
    ['Salute', intern.salute || '-'],
    ['Email', intern.email || '-'],
    ['Phone', intern.phone || '-'],
    ['Location', intern.location || '-'],
  ];

  const academicFields: Array<[string, string]> = [
    ['Course', intern.course || '-'],
    ['Specialization', intern.specialization || '-'],
    ['College', intern.college || '-'],
    ['College Dean/HOD', intern.college_dean_hod || '-'],
    ['District', intern.district || '-'],
    ['State', intern.state || '-'],
  ];

  const guideFields: Array<[string, string]> = [
    ['Guide Name', intern.guide_name || '-'],
    ['Guide Area', intern.guide_area || '-'],
    ['Guide Email', intern.guide_mail || '-'],
    ['Guide Reporting Officer', intern.guide_reporting_officer || '-'],
    ['DD', intern.dd || '-'],
    ['HOD Email', intern.hod_mail || '-'],
  ];

  const timelineFields: Array<[string, string]> = [
    ['Start Date', formatPrettyDate(intern.start_date)],
    ['End Date', formatPrettyDate(intern.end_date)],
    ['Duration', getDurationMonths(intern.start_date, intern.end_date)],
    ['Allotment Date', formatPrettyDate(intern.allotment_date)],
    ['Guide Allocation Date', formatPrettyDate(intern.guide_allocation_date)],
    ['Signed Application Date', formatPrettyDate(intern.signed_application_date)],
    ['Biometric Date', formatPrettyDate(intern.biometric_date)],
    ['Submitted At', formatPrettyDate(intern.submitted_at)],
  ];

  const miscFields: Array<[string, string]> = [
    ['Month', intern.month || '-'],
    ['Mode of Work', intern.mode_of_work || '-'],
    ['Project/Internship', intern.project_or_internship || '-'],
    ['Project Title', intern.project_title || '-'],
    ['Remarks', intern.remarks || '-'],
  ];

  const renderFieldList = (items: Array<[string, string]>) => (
    <div className="space-y-2 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[140px_1fr] gap-2">
          <p className="text-slate-500">{label}</p>
          <p className="text-slate-800 break-words">{value}</p>
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Card className="overflow-hidden border-slate-200">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300 mb-2">Student Profile</p>
                <h1 className="text-3xl font-semibold leading-tight">{intern.salute} {intern.name}</h1>
                <p className="mt-2 text-slate-300">{intern.college || 'College not provided'}</p>
              </div>
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">Status: {status}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/')}>Back to Dashboard</Button>
              <Button onClick={handleOfferLetter} disabled={generatingLetter}>
                {generatingLetter ? 'Printing...' : 'Offer Letter'}
              </Button>
              <Button variant="outline" onClick={handleClosureLetter} disabled={generatingClosure}>
                {generatingClosure ? 'Printing...' : 'Closure Letter'}
              </Button>
              <Button variant="outline" onClick={handleEmail} disabled={sendingEmail}>
                {sendingEmail ? 'Sending...' : 'Approval Letter Email'}
              </Button>
            </div>
          </div>
        </Card>

        {(messages.offer || messages.closure || messages.email) && (
          <Card className="p-4 border-slate-200 space-y-2">
            {messages.offer && (
              <p className={`text-sm ${messages.offer.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {messages.offer.text}
              </p>
            )}
            {messages.closure && (
              <p className={`text-sm ${messages.closure.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {messages.closure.text}
              </p>
            )}
            {messages.email && (
              <p className={`text-sm ${messages.email.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {messages.email.text}
              </p>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Basic Details</h2>
            {renderFieldList(profileFields)}
          </Card>

          <Card className="p-5 border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Academic Details</h2>
            {renderFieldList(academicFields)}
          </Card>

          <Card className="p-5 border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Guide Details</h2>
            {renderFieldList(guideFields)}
          </Card>

          <Card className="p-5 border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Timeline</h2>
            {renderFieldList(timelineFields)}
          </Card>

          <Card className="p-5 border-slate-200 lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Other Information</h2>
            {renderFieldList(miscFields)}
          </Card>
        </div>
      </div>
    </main>
  );
}