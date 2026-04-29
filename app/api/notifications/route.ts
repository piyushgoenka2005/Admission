import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_URL = 'https://api.resend.com/emails';

const templates = {
  application_received: ({ studentName }: { studentName: string }) => ({
    subject: 'NRSC Internship Portal Application Received',
    text: `Dear ${studentName},\n\nThank you for applying to the NRSC Internship Portal. We have received your application and will review it shortly.\n\nRegards,\nNRSC Internship Team`,
  }),
  under_consideration: ({ studentName }: { studentName: string }) => ({
    subject: 'NRSC Internship Application Under Review',
    text: `Dear ${studentName},\n\nThank you for applying. Your application is currently under consideration and our team is reviewing it carefully.\n\nRegards,\nNRSC Internship Team`,
  }),
  reporting_instruction: ({ studentName, reportingDate }: { studentName: string; reportingDate?: string }) => ({
    subject: 'NRSC Internship Reporting Instruction',
    text: `Dear ${studentName},\n\nYour application has been processed. Please report to the office on ${reportingDate || 'the communicated reporting date'} for the next steps.\n\nRegards,\nNRSC Internship Team`,
  }),
  guide_unavailable: ({ studentName }: { studentName: string }) => ({
    subject: 'NRSC Internship Update',
    text: `Dear ${studentName},\n\nCurrently no guides are available for your application. Please apply again after about one month.\n\nRegards,\nNRSC Internship Team`,
  }),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, studentEmail, studentName, reportingDate } = body;

    const resendKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (!resendKey) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    const template = templates[type as keyof typeof templates];
    if (!template) {
      return NextResponse.json({ error: 'Unsupported notification type' }, { status: 400 });
    }

    const content = template({ studentName, reportingDate });

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [studentEmail],
        subject: content.subject,
        text: content.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to send email' }, { status: response.status });
    }

    return NextResponse.json({
      subject: content.subject,
      message: content.text,
      providerResponse: data,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
