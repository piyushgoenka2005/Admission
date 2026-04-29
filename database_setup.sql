-- Create the students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_uid TEXT UNIQUE,
    salutation TEXT,
    name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT NOT NULL,
    residential_address TEXT,
    state TEXT,
    city TEXT,
    duration TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT,
    gender TEXT,
    date_of_birth DATE,
    age INTEGER,
    fathers_name TEXT,
    mothers_name TEXT,
    college_name TEXT,
    college_address TEXT,
    college_phone_number TEXT,
    university_name TEXT,
    qualification TEXT,
    hod_name TEXT,
    hod_email TEXT,
    permanent_address TEXT,
    present_address TEXT,
    assigned_scientist TEXT,
    guide_division TEXT,
    guide_reporting_officer TEXT,
    guide_email TEXT,
    guide_phone TEXT,
    guide_assigned_at TIMESTAMP WITH TIME ZONE,
    reporting_date DATE,
    reported_at TIMESTAMP WITH TIME ZONE,
    latest_notification_type TEXT,
    latest_notification_message TEXT,
    latest_notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Existing database may require running this in Supabase SQL editor:
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS assigned_scientist TEXT;

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

INSERT INTO public.portal_settings (id, applications_open, application_notice)
VALUES (
    1,
    true,
    'We are currently not accepting internship applications. Please check back later.'
)
ON CONFLICT (id) DO NOTHING;

-- Note: Ensure you have also created a storage bucket named 'documents' in Supabase
-- and have made it PUBLIC for the marksheet and LOR file uploads to work.
