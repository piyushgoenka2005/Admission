-- 1. Create student_accounts table for Auth
CREATE TABLE IF NOT EXISTS public.student_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aadhaar_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter students table to add new fields
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.student_accounts(id),
ADD COLUMN IF NOT EXISTS student_uid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS guide_division TEXT,
ADD COLUMN IF NOT EXISTS guide_reporting_officer TEXT,
ADD COLUMN IF NOT EXISTS guide_email TEXT,
ADD COLUMN IF NOT EXISTS reporting_date DATE,
ADD COLUMN IF NOT EXISTS latest_notification_type TEXT,
ADD COLUMN IF NOT EXISTS latest_notification_message TEXT,
ADD COLUMN IF NOT EXISTS latest_notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS application_type TEXT DEFAULT '45_days',
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previously_applied_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_45_days_previously BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS step_completed INTEGER DEFAULT 0;

-- Optional: ensure email uniqueness in students table to prevent multiple applications
ALTER TABLE public.students ADD CONSTRAINT students_email_key UNIQUE (email);

CREATE TABLE IF NOT EXISTS public.portal_settings (
    id INTEGER PRIMARY KEY,
    applications_open BOOLEAN DEFAULT true,
    application_notice TEXT DEFAULT 'We are currently not accepting internship applications. Please check back later.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    division TEXT NOT NULL,
    reporting_officer TEXT NOT NULL,
    email TEXT NOT NULL,
    dd TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS dd TEXT;

INSERT INTO public.portal_settings (id, applications_open, application_notice)
VALUES (
    1,
    true,
    'We are currently not accepting internship applications. Please check back later.'
)
ON CONFLICT (id) DO UPDATE
SET
    applications_open = EXCLUDED.applications_open,
    application_notice = EXCLUDED.application_notice,
    updated_at = timezone('utc'::text, now());
