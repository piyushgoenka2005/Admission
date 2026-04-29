export interface Student {
    id?: string;
    student_uid?: string;
    student_name?: string;
    salutation?: string;
    name: string;
    phone_number: string;
    email: string;
    gender?: string;
    date_of_birth?: string;
    age?: number;
    fathers_name?: string;
    mothers_name?: string;
    duration?: string;
    main_category?: string;
    identification_marks?: string;
    family_members?: Array<{ name?: string; relationship?: string }>;
    college_name?: string;
    college_address?: string;
    college_phone_number?: string;
    university_name?: string;
    qualification?: string;
    hod_email?: string;
    hod_name?: string;
    permanent_address?: string;
    present_address?: string;
    state: string;
    city?: string;
    start_date: string;
    end_date: string;
    status?: 'DOING' | 'DONE' | 'UPCOMING';
    photo_id_proof?: string;
    assigned_scientist?: string;
    guide_division?: string;
    guide_reporting_officer?: string;
    guide_email?: string;
    guide_phone?: string;
    guide_assigned_at?: string;
    reporting_date?: string | null;
    reported_at?: string;
    reporting_division?: string;
    entry_permissions?: Array<{ location?: string; allowed?: boolean }>;
    project_name?: string;
    project_description?: string;
    network_internal?: boolean;
    network_internet?: boolean;
    software_required?: string;
    storage_space?: string;
    remark?: string;
    latest_notification_type?: string;
    latest_notification_message?: string;
    latest_notification_sent_at?: string;
    notification_history?: StudentNotification[];
    created_at?: string;
    // File upload fields (client-side only)
    photo_url?: string;
    signature_url?: string;
    aadhaar_url?: string;
    college_id_url?: string;
    bonafide_url?: string;
    photo_file?: File;
    signature_file?: File;
    aadhaar_file?: File;
    college_id_file?: File;
    bonafide_file?: File;
}

export interface StudentNotification {
    type: string;
    subject: string;
    message: string;
    sent_at: string;
    recipient_email: string;
    status: 'SENT' | 'FAILED' | 'LOGGED';
}

export interface AcademicDetail {
    id?: string;
    student_id?: string;
    board: string;
    education_type: string;
    subjects: string;
    passing_year: number | '';
    percentage: number | '';
    marksheet_url: string;
    file?: File; // For form handling before upload

    // UI specific fields for form
    level?: string;
    ui_board?: string;
    ui_institution?: string;
    ui_degree_type?: string;
    ui_degree_choice?: string;
    ui_specialization?: string;
    ui_specialization_choice?: string;
    ui_gpa?: number | '';
}

export interface ApplicationFormData {
    student: Omit<Student, 'id' | 'created_at'>;
    academics: AcademicDetail[];
}
