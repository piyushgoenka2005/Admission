"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileText,
  Lock,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { AcademicDetail, Student, StudentNotification } from '@/types';
import StudentMarksChart from '@/components/StudentMarksChart';
import {
  DEFAULT_APPLICATION_NOTICE,
  DEFAULT_APPLICATIONS_OPEN,
  PORTAL_SETTINGS_STORAGE_KEY,
  formatDisplayDate,
  getEmbeddableDocumentUrl,
  getErrorMessage,
  isImageDocument,
  normalizeGuideName,
} from '@/lib/portal';
import { subscribeToNewApplicationAlerts } from '@/lib/liveApplicationAlerts';
import { STATES } from '@/lib/states';
import { POSTGRAD_DEGREE_OPTIONS, UNDERGRAD_DEGREE_OPTIONS } from '@/lib/education';
import { getGuideProfile, guideProfiles, GuideProfile } from '@/lib/guideDetails';

interface PopulatedStudent extends Student {
  academic_details?: AcademicDetail[];
  [key: string]: any;
}

type DetailPanel = 'documents' | 'visual';
type TimeFilter = 'ALL_TIME' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';
type CustomDateField = 'join_date' | 'end_date';

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

const getHyderabadLocalDate = () => getHyderabadLocalTimestamp().split('T')[0];

const cleanNamePart = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '';
  const lowered = normalized.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') return '';
  return normalized;
};

export default function AdminDashboard({ onLogout, initialStudentUid }: { onLogout: () => void; initialStudentUid?: string }) {
  const router = useRouter();
  const [students, setStudents] = useState<PopulatedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<PopulatedStudent | null>(null);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>('documents');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL_TIME');
  const [customDateField, setCustomDateField] = useState<CustomDateField>('join_date');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [collegeFilter, setCollegeFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [guideFilter, setGuideFilter] = useState('ALL');
  const [assignScientistInput, setAssignScientistInput] = useState('');
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState(DEFAULT_APPLICATIONS_OPEN);
  const [applicationNotice, setApplicationNotice] = useState(DEFAULT_APPLICATION_NOTICE);
  const [savingPortalState, setSavingPortalState] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [guideAreaInput, setGuideAreaInput] = useState('');
  const [guideReportingOfficerInput, setGuideReportingOfficerInput] = useState('');
  const [guideEmailInput, setGuideEmailInput] = useState('');
  const [guideDdInput, setGuideDdInput] = useState('');
  const [availableGuides, setAvailableGuides] = useState<GuideProfile[]>(guideProfiles);
  const [isAddingGuide, setIsAddingGuide] = useState(false);
  const [savingGuideLibrary, setSavingGuideLibrary] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatingClosure, setGeneratingClosure] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [sendingGal, setSendingGal] = useState(false);
  const [docActionMessage, setDocActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveApplicationAlert, setLiveApplicationAlert] = useState<{ id: string; name: string; studentUid: string; count: number } | null>(null);
  const seenStudentKeysRef = useRef<Set<string>>(new Set());
  const hasLoadedInitialSnapshotRef = useRef(false);

  const getStudentName = (student: any) => {
    const directName = cleanNamePart(student.student_name || student.name);
    if (directName) return directName;

    return [cleanNamePart(student.first_name), cleanNamePart(student.middle_name), cleanNamePart(student.last_name)]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getStudentKey = (student: any) => String(student?.id || student?.student_uid || '').trim();

  const playNotificationTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1175, audioCtx.currentTime + 0.22);

      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
      oscillator.onended = () => {
        void audioCtx.close();
      };
    } catch {
      // Ignore failures when autoplay restrictions prevent audio.
    }
  };

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        const authenticated = Boolean(data?.authenticated);

        if (authenticated) {
          setIsLoggedIn(true);
          return;
        }

        const redirectPath = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      } catch {
        const redirectPath = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      } finally {
        setAuthReady(true);
      }
    };

    checkAdminSession();
  }, [router]);

  useEffect(() => {
    if (!authReady || !isLoggedIn) return;

    fetchData();
    fetchPortalSettings();
    fetchGuideLibrary();
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!authReady || !isLoggedIn) return;

    const intervalId = window.setInterval(() => {
      void fetchData({ background: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!liveApplicationAlert) return;
    const timeoutId = window.setTimeout(() => setLiveApplicationAlert(null), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [liveApplicationAlert]);

  useEffect(() => {
    if (!authReady || !isLoggedIn) return;

    const unsubscribe = subscribeToNewApplicationAlerts((payload) => {
      const incomingStudentUid = String(payload.studentUid || (payload as { student_uid?: string }).student_uid || '').trim();
      const incomingName = String(payload.name || (payload as { student_name?: string }).student_name || '').trim();
      const incomingKey = String(payload.id || incomingStudentUid).trim();
      if (!incomingKey) return;

      const alreadySeen = seenStudentKeysRef.current.has(incomingKey);
      if (!alreadySeen) {
        seenStudentKeysRef.current.add(incomingKey);
      }

      setLiveApplicationAlert({
        id: incomingKey,
        name: incomingName || 'New Student',
        studentUid: incomingStudentUid || '-',
        count: 1,
      });
      playNotificationTone();
    });

    return unsubscribe;
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (selectedStudent) {
      setAssignScientistInput(selectedStudent.assigned_scientist || '');
      setIsEditingGuide(!(selectedStudent.assigned_scientist || '').trim());
      setIsAddingGuide(false);
      setGuideAreaInput(selectedStudent.guide_division || '');
      setGuideReportingOfficerInput(selectedStudent.guide_reporting_officer || '');
      setGuideEmailInput(selectedStudent.guide_email || '');
      setGuideDdInput(selectedStudent.dd || '');
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (!initialStudentUid || !students.length) return;

    const decodedUid = decodeURIComponent(initialStudentUid);
    const matchedStudent = students.find(
      (student) => student.student_uid === decodedUid || student.id === decodedUid,
    );

    if (matchedStudent) {
      setSelectedStudent((prev) => (prev?.id === matchedStudent.id ? prev : matchedStudent));
    }
  }, [initialStudentUid, students]);

  const mergeGuideLibrary = (incomingGuides: GuideProfile[]) => {
    const merged = new Map<string, GuideProfile>();

    [...incomingGuides, ...guideProfiles].forEach((profile) => {
      const key = normalizeGuideName(profile.name);
      if (!key) return;
      merged.set(key, profile);
    });

    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const fetchData = async ({ background = false }: { background?: boolean } = {}) => {
    try {
      if (!background) {
        setLoading(true);
      }
      const response = await fetch('/api/admin/applications', { cache: 'no-store', credentials: 'include' });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch applications');
      }

      const nextStudents = Array.isArray(data?.students) ? data.students : [];
      const nextKeys = new Set<string>();

      nextStudents.forEach((student) => {
        const key = getStudentKey(student);
        if (key) nextKeys.add(key);
      });

      if (hasLoadedInitialSnapshotRef.current) {
        const newcomers = nextStudents.filter((student) => {
          const key = getStudentKey(student);
          return key && !seenStudentKeysRef.current.has(key);
        });

        if (newcomers.length > 0) {
          const newest = newcomers[0];
          setLiveApplicationAlert({
            id: getStudentKey(newest),
            name: getStudentName(newest) || 'New Student',
            studentUid: newest.student_uid || '-',
            count: newcomers.length,
          });
          playNotificationTone();
        }
      }

      seenStudentKeysRef.current = nextKeys;
      hasLoadedInitialSnapshotRef.current = true;
      setStudents(nextStudents);
    } catch (err: unknown) {
      console.error('Error fetching data:', getErrorMessage(err));
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

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
      console.warn('Error fetching portal settings:', getErrorMessage(err));
    }
  };

  const fetchGuideLibrary = async () => {
    try {
      const response = await fetch('/api/guides', { cache: 'no-store', credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load guide list');
      }

      if (Array.isArray(data?.guides) && data.guides.length) {
        setAvailableGuides(mergeGuideLibrary(data.guides));
      }
    } catch (err) {
      console.error('Error fetching guides:', err);
      setAvailableGuides(guideProfiles);
    }
  };

  const handleUpdatePortalState = async (nextOpenState: boolean) => {
    try {
      setSavingPortalState(true);
      const payload = {
        applications_open: nextOpenState,
        application_notice: applicationNotice,
      };
      const response = await fetch('/api/portal-settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save intake state');
      }

      setApplicationsOpen(nextOpenState);
      localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      alert(`Application intake ${nextOpenState ? 'enabled' : 'disabled'} successfully.`);
    } catch (err: unknown) {
      const payload = {
        applications_open: nextOpenState,
        application_notice: applicationNotice,
      };
      localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      setApplicationsOpen(nextOpenState);
      alert(`Saved locally for this browser only. Database sync failed: ${getErrorMessage(err)}`);
    } finally {
      setSavingPortalState(false);
    }
  };

  const handleSaveApplicationNotice = async () => {
    try {
      setSavingPortalState(true);
      const payload = {
        applications_open: applicationsOpen,
        application_notice: applicationNotice,
      };
      const response = await fetch('/api/portal-settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save application notice');
      }

      localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      alert('Application notice updated successfully.');
    } catch (err: unknown) {
      localStorage.setItem(PORTAL_SETTINGS_STORAGE_KEY, JSON.stringify({
        applications_open: applicationsOpen,
        application_notice: applicationNotice,
      }));
      alert(`Notice saved locally for this browser only. Database sync failed: ${getErrorMessage(err)}`);
    } finally {
      setSavingPortalState(false);
    }
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Student> & Record<string, any>) => {
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update application');
      }

      setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updates } : student)));
      if (selectedStudent?.id === id) {
        setSelectedStudent((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return true;
    } catch (err: unknown) {
      alert(`Update failed: ${getErrorMessage(err)}`);
      return false;
    }
  };

  const handleDeleteStudent = async (id: string, accountId?: string) => {
    void accountId;
    if (!window.confirm('Are you sure you want to permanently delete this application?')) return;
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete application');
      }

      setStudents((prev) => prev.filter((student) => student.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
      router.push('/admin');
    } catch (err: unknown) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const calculateAverage = (academics?: AcademicDetail[]) => {
    if (!academics?.length) return 0;
    return academics.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / academics.length;
  };

  const getStudentDegreeLabel = (academics?: AcademicDetail[]) => {
    const higherEducationRecords = (academics || []).filter(
      (item) => item.education_type !== '10th' && item.education_type !== '10+2' && item.education_type,
    );

    if (!higherEducationRecords.length) {
      return 'Not added';
    }

    const postgraduateRecord = higherEducationRecords.find((item) =>
      POSTGRAD_DEGREE_OPTIONS.includes(item.education_type as (typeof POSTGRAD_DEGREE_OPTIONS)[number]),
    );

    if (postgraduateRecord) {
      return postgraduateRecord.education_type;
    }

    return higherEducationRecords[0].education_type;
  };

  const studentMatchesAcademicFilters = (student: PopulatedStudent) => {
    const higherEducationRecords = (student.academic_details || []).filter(
      (item) => item.education_type !== '10th' && item.education_type !== '10+2',
    );

    const matchesDegree = degreeFilter === 'ALL' || higherEducationRecords.some((item) => item.education_type === degreeFilter);

    return matchesDegree;
  };

  const parseStudentUidOrder = (uid?: string) => {
    if (!uid) return Number.MAX_SAFE_INTEGER;
    const parsed = Number(uid);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    const rem = day % 10;
    if (rem === 1) return 'st';
    if (rem === 2) return 'nd';
    if (rem === 3) return 'rd';
    return 'th';
  };

  const formatPrettyDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  };

  const getDurationDays = (start?: string | null, end?: string | null) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return '-';
    const dayMs = 1000 * 60 * 60 * 24;
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs);
    return `${duration} days`;
  };

  const getShortText = (value: string | undefined, max = 24) => {
    if (!value) return '-';
    return value.length > max ? `${value.slice(0, max)}…` : value;
  };

  const getMonthLabelFromDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleString('en-GB', { month: 'short' });
    } catch {
      return '-';
    }
  };

  const toDateOnlyTimestamp = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const getStudentDateByField = (student: PopulatedStudent, field: CustomDateField) => {
    if (field === 'end_date') {
      return student.date_of_ending || student.end_date || '';
    }

    return student.present_date || student.start_date || student.created_at || '';
  };

  const getPresetTimeBounds = (filter: Exclude<TimeFilter, 'ALL_TIME' | 'CUSTOM'>) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = new Date(end);

    if (filter === 'TODAY') {
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: end.getTime() };
    }

    if (filter === 'THIS_WEEK') {
      const weekday = now.getDay();
      const daysFromMonday = (weekday + 6) % 7;
      start.setDate(now.getDate() - daysFromMonday);
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: end.getTime() };
    }

    if (filter === 'THIS_MONTH') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start: start.getTime(), end: end.getTime() };
    }

    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return { start: start.getTime(), end: end.getTime() };
  };

  const buildLetterStudentPayload = (student: PopulatedStudent) => {
    const fullName = getStudentName(student);
    const startDate = student.present_date || student.start_date || '';
    const endDate = student.date_of_ending || student.end_date || '';
    const dateForRef = startDate || student.created_at || '';
    const month = getMonthLabelFromDate(dateForRef);
    const collegeName = student.college_name || student.university_name || '';
    const applicationId = student.student_uid || student.id || '';
    const collegeDeanHod = student.college_dean_hod || student.hod_email || '';
    const district = student.district || '';
    const dd = student.dd || '';
    const duration = getDurationDays(student.present_date || student.start_date || '', student.date_of_ending || student.end_date || '');

    return {
      id: student.id,
      salutation: student.salutation || '',
      salute: student.salutation || '',
      name: fullName,
      email: student.email || '',
      phone: student.phone_number || '',
      district,
      college_dean_hod: collegeDeanHod,
      'college dean hod': collegeDeanHod,
      college_name: collegeName,
      'college name': collegeName,
      college: collegeName,
      course: student.qualification || '',
      qualification: student.qualification || '',
      guide_name: student.assigned_scientist || '',
      'guide name': student.assigned_scientist || '',
      guide_area: student.guide_division || '',
      'guide area': student.guide_division || '',
      guide_reporting_officer: student.guide_reporting_officer || '',
      'guide reporting officer': student.guide_reporting_officer || '',
      guide_email: student.guide_email || '',
      guide_mail: student.guide_email || '',
      hod_email: student.hod_email || '',
      hod_mail: student.hod_email || '',
      dd,
      start_date: startDate,
      end_date: endDate,
      'start date': startDate,
      'end date': endDate,
      month,
      allotment_date: getHyderabadLocalDate(),
      'allotment date': getHyderabadLocalDate(),
      sl_no: applicationId,
      'sl. no.': applicationId,
    };
  };

  const buildCoverStudentPayload = (student: PopulatedStudent) => {
    const fullName = getStudentName(student);
    const collegeName = student.college_name || student.university_name || '';
    const collegeAddress = student.college_address || '';
    const reportingDate = student.reporting_date || student.reported_at || student.created_at || '';
    const dateOfJoining = student.present_date || student.start_date || '';
    const dateOfEnding = student.date_of_ending || student.end_date || '';
    const duration = getDurationDays(dateOfJoining, dateOfEnding);
    const guideProfile = selectedGuideProfile || getGuideProfile(student.assigned_scientist || student.guide_reporting_officer || '');

    return {
      id: student.id,
      student_name: fullName,
      name: fullName,
      salutation: student.salutation || '',
      phone_number: student.phone_number || '',
      phone: student.phone_number || '',
      qualification: student.qualification || '',
      email: student.email || '',
      state: student.state || '',
      city: student.city || '',
      date_of_birth: student.date_of_birth || '',
      age: student.age || '',
      fathers_name: student.fathers_name || '',
      mothers_name: student.mothers_name || '',
      college_name: collegeName,
      university_name: student.university_name || collegeName,
      college_address: collegeAddress,
      college_phone_number: student.college_phone_number || '',
      hod_name: student.hod_name || '',
      hod_email: student.hod_email || '',
      permanent_address: student.permanent_address || '',
      present_address: student.present_address || student.residential_address || '',
      residential_address: student.present_address || student.residential_address || '',
      start_date: dateOfJoining,
      end_date: dateOfEnding,
      present_date: dateOfJoining,
      date_of_ending: dateOfEnding,
      reporting_date: reportingDate,
      reported_at: reportingDate,
      assigned_scientist: student.assigned_scientist || '',
      guide_name: student.assigned_scientist || '',
      guide_email: guideProfile.email || student.guide_email || '',
      guide_phone: guideProfile.phone || student.guide_phone || '',
      guide_assigned_at: student.guide_assigned_at || reportingDate || '',
      guide_division: student.guide_division || guideProfile.division || '',
      guide_reporting_officer: student.guide_reporting_officer || guideProfile.reportingOfficer || '',
      photo_url: student.photo_url || '',
      signature_url: student.signature_url || '',
      aadhaar_url: student.aadhaar_url || '',
      college_id_url: student.college_id_url || '',
      bonafide_url: student.bonafide_url || '',
      main_category: 'project',
      project_name: student.project_name || '',
      project_description: student.project_description || '',
      network_internal: student.network_internal || false,
      network_internet: student.network_internet || false,
      software_required: student.software_required || '',
      storage_space: student.storage_space || '',
      guide_email_alias: student.guide_email || '',
      email_college_dean: student.hod_email || '',
      contact_no: student.phone_number || '',
      affiliation: collegeName,
      university_name_or_college_name: collegeName,
      project_from_date: dateOfJoining,
      project_to_date: dateOfEnding,
      duration: duration !== '-' ? duration : (student.duration || ''),
      reporting_division: student.guide_division || '',
    };
  };

  const filteredStudents = students.filter((student) => {
    const searchBlob = `${getStudentName(student)} ${student.email || ''} ${student.student_uid || ''}`.toLowerCase();
    const matchesSearch = searchBlob.includes(searchTerm.toLowerCase());

    const matchesTimeFilter = (() => {
      if (timeFilter === 'ALL_TIME') return true;

      const selectedDateField = timeFilter === 'CUSTOM' ? customDateField : 'join_date';
      const dateValue = getStudentDateByField(student, selectedDateField);
      const recordTimestamp = toDateOnlyTimestamp(dateValue);
      if (recordTimestamp === null) return false;

      if (timeFilter === 'CUSTOM') {
        const fromTimestamp = toDateOnlyTimestamp(customDateFrom);
        const toTimestamp = toDateOnlyTimestamp(customDateTo);

        if (fromTimestamp !== null && recordTimestamp < fromTimestamp) return false;
        if (toTimestamp !== null && recordTimestamp > toTimestamp) return false;
        return true;
      }

      const bounds = getPresetTimeBounds(timeFilter);
      return recordTimestamp >= bounds.start && recordTimestamp <= bounds.end;
    })();

    const matchesCollege = collegeFilter === 'ALL' || (student.college_name || student.university_name || '') === collegeFilter;
    const matchesState = stateFilter === 'ALL' || (student.state || '') === stateFilter;
    const matchesGuide = guideFilter === 'ALL' || (student.assigned_scientist || '') === guideFilter;
    const matchesMonth = (() => {
      if (monthFilter === 'ALL') return true;
      const dateValue = getStudentDateByField(student, 'join_date') || '';
      const d = new Date(dateValue);
      if (Number.isNaN(d.getTime())) return false;
      return (d.getMonth() + 1) === Number(monthFilter);
    })();

    return matchesSearch && matchesTimeFilter && matchesCollege && matchesState && matchesGuide && matchesMonth && studentMatchesAcademicFilters(student);
  }).sort((a, b) => parseStudentUidOrder(b.student_uid) - parseStudentUidOrder(a.student_uid));

  const totalActiveStudents = students.filter((student) => String(student.status || '').toUpperCase() === 'DOING').length;
  const underReviewCount = 0;
  const filteredStudentCount = filteredStudents.length;

  const documentItems = useMemo(() => {
    if (!selectedStudent) return [];

    const docs = [
      { label: 'Photo', url: selectedStudent.photo_url },
      { label: 'Aadhaar Card', url: selectedStudent.aadhaar_url },
      { label: 'Signature', url: selectedStudent.signature_url },
      { label: 'Letter of Recommendation', url: selectedStudent.lor_url },
      ...(selectedStudent.academic_details || [])
        .filter((item) => item.marksheet_url)
        .map((item) => ({
          label: `${item.education_type || 'Academic'} Marksheet`,
          url: item.marksheet_url,
        })),
    ];

    return docs.filter((item) => item.url);
  }, [selectedStudent]);

  const selectedGuideName = (assignScientistInput || selectedStudent?.assigned_scientist || '').trim();
  const selectedGuideProfile = selectedGuideName
    ? availableGuides.find((profile) => normalizeGuideName(profile.name) === normalizeGuideName(selectedGuideName)) || getGuideProfile(selectedGuideName)
    : null;
  const isExistingGuideInLibrary = Boolean(
    assignScientistInput.trim() &&
    availableGuides.find((profile) => normalizeGuideName(profile.name) === normalizeGuideName(assignScientistInput.trim())),
  );

  const handleSelectGuide = (guideName: string) => {
    const guideProfile = availableGuides.find((profile) => normalizeGuideName(profile.name) === normalizeGuideName(guideName)) || getGuideProfile(guideName);
    setAssignScientistInput(guideProfile.name);
    setGuideAreaInput(guideProfile.division);
    setGuideReportingOfficerInput(guideProfile.reportingOfficer);
    setGuideEmailInput(guideProfile.email);
    setGuideDdInput(guideProfile.dd || '');
    setShowGuideDropdown(false);
    setIsAddingGuide(false);
  };

  const handleStartAddGuide = () => {
    setIsEditingGuide(true);
    setIsAddingGuide(true);
    setShowGuideDropdown(false);
    setAssignScientistInput('');
    setGuideAreaInput('');
    setGuideReportingOfficerInput('');
    setGuideEmailInput('');
    setGuideDdInput('');
  };

  const handleCancelAddGuide = () => {
    setIsAddingGuide(false);
    setAssignScientistInput(selectedStudent?.assigned_scientist || '');
    setGuideAreaInput(selectedStudent?.guide_division || '');
    setGuideReportingOfficerInput(selectedStudent?.guide_reporting_officer || '');
    setGuideEmailInput(selectedStudent?.guide_email || '');
    setGuideDdInput(selectedStudent?.dd || '');
  };

  const handleSaveGuideLibrary = async () => {
    const payload = {
      name: assignScientistInput.trim(),
      division: guideAreaInput.trim(),
      reportingOfficer: guideReportingOfficerInput.trim(),
      email: guideEmailInput.trim(),
      dd: guideDdInput.trim(),
    };

    if (!payload.name || !payload.division || !payload.reportingOfficer || !payload.email) {
      alert('Enter guide name, guide area, reporting officer, and guide email first.');
      return false;
    }

    try {
      setSavingGuideLibrary(true);
      const response = await fetch('/api/guides', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save guide');
      }

      const savedGuide = data?.guide as GuideProfile | undefined;
      if (savedGuide) {
        setAvailableGuides((prev) => mergeGuideLibrary([...prev, savedGuide]));
        handleSelectGuide(savedGuide.name);

        // If a student is selected and a guide is currently selected in the form, update the student record with the new guide details
        if (selectedStudent && assignScientistInput.trim()) {
          await handleUpdateStudent(selectedStudent.id!, {
            assigned_scientist: savedGuide.name,
            guide_division: savedGuide.division,
            guide_reporting_officer: savedGuide.reportingOfficer,
            guide_email: savedGuide.email,
            dd: savedGuide.dd,
          });
        }
      }

      if (data?.partialSuccess) {
        alert(`Guide saved in database, but Excel update needs attention: ${data.error}`);
      } else {
        alert(data?.action === 'updated' ? 'Guide details updated successfully.' : 'Guide added successfully.');
      }

      await fetchGuideLibrary();

      return true;
    } catch (err) {
      alert(`Guide save failed: ${getErrorMessage(err)}`);
      return false;
    } finally {
      setSavingGuideLibrary(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTimeFilter('ALL_TIME');
    setCustomDateField('join_date');
    setCustomDateFrom('');
    setCustomDateTo('');
    setDegreeFilter('ALL');
    setMonthFilter('ALL');
    setCollegeFilter('ALL');
    setStateFilter('ALL');
    setGuideFilter('ALL');
  };

  const appendNotificationHistory = async (student: PopulatedStudent, notification: StudentNotification) => {
    const currentHistory = Array.isArray(student.notification_history) ? student.notification_history : [];
    const updates: Partial<Student> = {
      latest_notification_type: notification.type,
      latest_notification_message: notification.message,
      latest_notification_sent_at: notification.sent_at,
      notification_history: [...currentHistory, notification],
    };
    await handleUpdateStudent(student.id!, updates);
  };

  const saveGuideAssignment = async () => {
    if (!selectedStudent) return false;

    const guideName = assignScientistInput.trim();
    if (!guideName) {
      alert('Select a guide first.');
      return false;
    }

    if (isAddingGuide) {
      const saved = await handleSaveGuideLibrary();
      if (!saved) return false;
    }

    const guideProfile = getGuideProfile(guideName);
    const guideAssignedAt = getHyderabadLocalTimestamp();
    const updated = await handleUpdateStudent(selectedStudent.id!, {
      assigned_scientist: guideName,
      guide_division: guideAreaInput || guideProfile.division,
      guide_reporting_officer: guideReportingOfficerInput || guideProfile.reportingOfficer,
      guide_email: guideEmailInput || guideProfile.email,
      dd: guideDdInput || guideProfile.dd,
      guide_assigned_at: guideAssignedAt,
      status: 'ASSIGNED' as any,
    });
    if (updated) {
      setIsEditingGuide(false);
      setIsAddingGuide(false);
    }
    return updated;
  };

  const handleSendReportingInstruction = async () => {
    if (!selectedStudent) return;

    const saved = await saveGuideAssignment();
    if (!saved) return;

    await appendNotificationHistory(selectedStudent, {
      type: 'reporting_instruction',
      subject: 'Guide Assigned',
      message: `Guide assigned: ${assignScientistInput.trim()}.`,
      sent_at: getHyderabadLocalTimestamp(),
      recipient_email: selectedStudent.email,
      status: 'LOGGED',
    });
  };

  const handleUnderConsideration = async () => {
    if (!selectedStudent) return;

    const updated = await handleUpdateStudent(selectedStudent.id!, {
      status: 'UNDER CONSIDERATION' as any,
    });

    if (!updated) return;

    await appendNotificationHistory(selectedStudent, {
      type: 'under_consideration',
      subject: 'Marked Under Consideration',
      message: `${getStudentName(selectedStudent)} is currently under consideration.`,
      sent_at: getHyderabadLocalTimestamp(),
      recipient_email: selectedStudent.email,
      status: 'LOGGED',
    });
  };

  const handleGuideUnavailable = async () => {
    if (!selectedStudent) return;

    const notice = 'Currently no guides are available. Please apply again after about one month.';
    const updated = await handleUpdateStudent(selectedStudent.id!, {
      status: 'ON HOLD' as any,
      assigned_scientist: '',
      guide_division: '',
      guide_reporting_officer: '',
      guide_email: '',
      dd: '',
      guide_assigned_at: null,
      remark: notice,
    });

    if (!updated) return;

    setIsEditingGuide(true);
    await appendNotificationHistory(selectedStudent, {
      type: 'guide_unavailable',
      subject: 'Marked On Hold',
      message: notice,
      sent_at: getHyderabadLocalTimestamp(),
      recipient_email: selectedStudent.email,
      status: 'LOGGED',
    });
  };
  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
    setIsLoggedIn(false);
    setSelectedStudent(null);
    onLogout();
  };

  const renderLiveApplicationAlert = () => {
    if (!liveApplicationAlert) return null;

    return (
      <div className="fixed bottom-6 right-6 z-[1100] w-[min(92vw,26rem)] rounded-3xl border border-[#dcecff] bg-white/95 p-4 shadow-[0_28px_70px_rgba(35,48,74,0.2)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ff6f91]">New Application</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{liveApplicationAlert.name}</p>
            <p className="mt-1 text-xs text-slate-600">Student ID: {liveApplicationAlert.studentUid}</p>
            {liveApplicationAlert.count > 1 ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">+{liveApplicationAlert.count - 1} more new submissions</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setLiveApplicationAlert(null)}
            className="rounded-full bg-slate-100 p-1 text-slate-500 transition hover:bg-slate-200"
            aria-label="Dismiss notification"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!authReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8fc7ff] border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (selectedStudent) {
    const selectedStatus = String(selectedStudent.status || 'UNDER CONSIDERATION');
    const studentDisplayName = selectedStudent.student_name || getStudentName(selectedStudent) || 'Student';
    const selectedStatusClass =
      selectedStatus === 'ASSIGNED'
        ? 'bg-[#def7ee] text-emerald-700'
        : selectedStatus === 'ON HOLD'
          ? 'bg-[#fff1f4] text-rose-700'
          : 'bg-[#fff4ce] text-amber-700';

    const handlePrintGuideAllotment = async () => {
      setGeneratingLetter(true);
      setDocActionMessage(null);

      try {
        const isServerLocalHost =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '::1';
        const mode = isServerLocalHost ? 'print' : 'download';

        const response = await fetch('/api/letters/generate', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentPayload: buildLetterStudentPayload(selectedStudent), mode }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to generate offer letter';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // ignore JSON parse failures
          }
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setDocActionMessage({ type: 'success', text: data.message || 'Offer letter sent to printer.' });
          return;
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition') || '';
        const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        const fallbackName = `GA_Letter_${studentDisplayName.replace(/\s+/g, '_')}.docx`;
        const fileName = fileNameMatch?.[1] || fallbackName;

        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);

        setDocActionMessage({ type: 'success', text: 'Guide allotment letter downloaded.' });
      } catch (err) {
        setDocActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Offer letter generation failed' });
      } finally {
        setGeneratingLetter(false);
      }
    };

    const handlePrintClosureLetter = async () => {
      setGeneratingClosure(true);
      setDocActionMessage(null);

      try {
        const isServerLocalHost =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '::1';
        const mode = isServerLocalHost ? 'print' : 'download';

        const response = await fetch('/api/letters/closure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentPayload: buildLetterStudentPayload(selectedStudent), mode }),
        });

        if (!response.ok) {
          let errorMessage = 'Failed to generate closure certificate';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // ignore JSON parse failures
          }
          throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setDocActionMessage({ type: 'success', text: data.message || 'Closure certificate sent to printer.' });
          return;
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition') || '';
        const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        const fallbackName = `Closure_Certificate_${studentDisplayName.replace(/\s+/g, '_')}.docx`;
        const fileName = fileNameMatch?.[1] || fallbackName;

        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);

        setDocActionMessage({ type: 'success', text: 'Closure certificate downloaded.' });
      } catch (err) {
        setDocActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Closure certificate generation failed' });
      } finally {
        setGeneratingClosure(false);
      }
    };

    const handlePrintGalLetter = async () => {
      setSendingGal(true);
      setDocActionMessage(null);

      try {
        const response = await fetch('/api/letters/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentPayload: buildLetterStudentPayload(selectedStudent) }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send email');
        }

        setDocActionMessage({ type: 'success', text: data.message || 'Offer letter emailed successfully.' });
      } catch (err) {
        setDocActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Email sending failed' });
      } finally {
        setSendingGal(false);
      }
    };

    const handlePrintApplicationForm = () => {
      setGeneratingCover(true);
      setDocActionMessage(null);

      void (async () => {
        try {
          const isServerLocalHost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '::1';
          const mode = isServerLocalHost ? 'print' : 'download';

          const response = await fetch('/api/letters/cover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentPayload: buildCoverStudentPayload(selectedStudent), mode }),
          });

          if (!response.ok) {
            let errorMessage = 'Failed to generate application cover';
            try {
              const data = await response.json();
              errorMessage = data.error || errorMessage;
            } catch {
              // ignore parse issues and keep fallback
            }
            throw new Error(errorMessage);
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            setDocActionMessage({ type: 'success', text: data.message || 'Application cover sent to printer.' });
            return;
          }

          const blob = await response.blob();
          const contentDisposition = response.headers.get('content-disposition') || '';
          const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
          const fallbackName = `Application_Form_${studentDisplayName.replace(/\s+/g, '_')}.docx`;
          const fileName = fileNameMatch?.[1] || fallbackName;

          const objectUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(objectUrl);

          setDocActionMessage({ type: 'success', text: 'Application cover downloaded.' });
        } catch (err) {
          setDocActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Application cover generation failed' });
        } finally {
          setGeneratingCover(false);
        }
      })();
    };

    return (
      <div className="min-h-screen overscroll-y-contain px-4 py-5 md:px-6">
        <div className="mx-auto max-w-7xl space-y-6 pb-10">
          <header className="rounded-[2rem] border border-[#dcecff] bg-[#f7fbff] px-6 py-5 shadow-[0_22px_60px_rgba(143,199,255,0.12)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedDocument(null);
                    setDetailPanel('documents');
                    router.push('/admin');
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-600 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
                >
                  <ArrowLeft size={16} /> Back to List
                </button>
                <div className="rounded-[1.3rem] bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <img src="/isro_logo_secondary.svg" alt="ISRO" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">Student Record</p>
                  <h1 className="mt-2 text-3xl font-black text-slate-800">
                    {[selectedStudent.salutation || '', getStudentName(selectedStudent)].join(' ').trim()}
                  </h1>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedStudent.email} • {selectedStudent.phone_number}
                  </p>
                </div>
              </div>
              <div className="rounded-[2rem] bg-gradient-to-r from-[#fff2f7] to-[#eef9ff] px-5 py-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-700">Student ID</p>
                <p className="mt-1 text-2xl font-black tracking-[0.18em] text-slate-800">{selectedStudent.student_uid || 'Generating'}</p>
              </div>
            </div>
          </header>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-[#e8edf8] bg-[#fffdfd] p-6 shadow-[0_22px_55px_rgba(255,141,178,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  {selectedStudent.photo_url ? (
                    <img
                      src={selectedStudent.photo_url}
                      alt="Profile"
                      className="h-24 w-24 rounded-[1.5rem] object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#fff0f5] to-[#eef9ff] text-slate-500 shadow-sm">
                      <UserIcon size={34} />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${selectedStatusClass}`}>
                        {selectedStatus}
                      </span>
                      {selectedStudent.assigned_scientist && (
                        <span className="rounded-full bg-[#def7ee] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                          {selectedStudent.assigned_scientist}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-slate-600">Submitted on {formatDisplayDate(selectedStudent.created_at)}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Student ID: {selectedStudent.student_uid || 'Generating'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#f3dde4] bg-[#fff9fb] p-6 shadow-[0_20px_50px_rgba(255,183,178,0.08)]">
              <div className="mb-5 flex items-center gap-3">
                <Shield className="text-[#ff6f91]" size={18} />
                <h3 className="text-lg font-black text-slate-800">Student Form Details</h3>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-[#e8edf8]">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Personal Details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <p><span className="font-black text-slate-900">Student Name:</span> {getStudentName(selectedStudent) || '-'}</p>
                    <p><span className="font-black text-slate-900">Date of Birth:</span> {formatDisplayDate(selectedStudent.date_of_birth)}</p>
                    <p><span className="font-black text-slate-900">Age:</span> {selectedStudent.age || '-'}</p>
                    <p><span className="font-black text-slate-900">Phone:</span> {selectedStudent.phone_number || '-'}</p>
                    <p><span className="font-black text-slate-900">Email:</span> {selectedStudent.email || '-'}</p>
                    <p><span className="font-black text-slate-900">Father's Name:</span> {selectedStudent.fathers_name || '-'}</p>
                    <p><span className="font-black text-slate-900">Mother's Name:</span> {selectedStudent.mothers_name || '-'}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-[#e8edf8]">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Educational Details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <p><span className="font-black text-slate-900">College Name:</span> {selectedStudent.college_name || '-'}</p>
                    <p><span className="font-black text-slate-900">College Phone:</span> {selectedStudent.college_phone_number || '-'}</p>
                    <p><span className="font-black text-slate-900">Qualification:</span> {selectedStudent.qualification || '-'}</p>
                    <p><span className="font-black text-slate-900">University:</span> {selectedStudent.university_name || '-'}</p>
                    <p><span className="font-black text-slate-900">HOD Email:</span> {selectedStudent.hod_email || '-'}</p>
                    <p><span className="font-black text-slate-900">College Address:</span> {selectedStudent.college_address || '-'}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-[#e8edf8]">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Address Details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <p><span className="font-black text-slate-900">Permanent Address:</span> {selectedStudent.permanent_address || '-'}</p>
                    <p><span className="font-black text-slate-900">Present Address:</span> {selectedStudent.present_address || selectedStudent.residential_address || '-'}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-[#e8edf8]">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Internship Details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <p><span className="font-black text-slate-900">Date of Joining:</span> {formatDisplayDate(selectedStudent.present_date || selectedStudent.start_date)}</p>
                    <p><span className="font-black text-slate-900">Date of Ending:</span> {formatDisplayDate(selectedStudent.date_of_ending || selectedStudent.end_date)}</p>
                    <p><span className="font-black text-slate-900">Duration:</span> {getDurationDays(selectedStudent.present_date || selectedStudent.start_date, selectedStudent.date_of_ending || selectedStudent.end_date)}</p>
                    <p><span className="font-black text-slate-900">Guide:</span> {selectedStudent.assigned_scientist || '-'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#dcecff] bg-[#f5faff] p-6 shadow-[0_20px_45px_rgba(143,199,255,0.08)]">
              <h3 className="text-lg font-black text-slate-800">Assign Guide</h3>
              <p className="mt-2 text-sm text-slate-600">Assign or update guide information for this student record.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">Guide Name</label>
                  <input
                    type="text"
                    value={assignScientistInput}
                    onChange={(event) => {
                      setAssignScientistInput(event.target.value);
                      setShowGuideDropdown(true);
                    }}
                    onFocus={() => setShowGuideDropdown(true)}
                    onBlur={() => setTimeout(() => setShowGuideDropdown(false), 150)}
                    placeholder="Search or enter guide"
                    className="mt-2 w-full rounded-2xl border border-[#dcecff] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  />
                  {showGuideDropdown && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#e8edf8] bg-white p-2 shadow-xl">
                      {availableGuides
                        .filter((guide) => guide.name.toLowerCase().includes(assignScientistInput.toLowerCase()))
                        .map((guide) => (
                          <button
                            key={guide.name}
                            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-[#eef6ff]"
                            onMouseDown={() => handleSelectGuide(guide.name)}
                          >
                            {guide.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">Guide Area</label>
                  <input
                    type="text"
                    value={guideAreaInput}
                    onChange={(event) => setGuideAreaInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#dcecff] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">Guide's Reporting Officer</label>
                  <input
                    type="text"
                    value={guideReportingOfficerInput}
                    onChange={(event) => setGuideReportingOfficerInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#dcecff] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">DD</label>
                  <input
                    type="text"
                    value={guideDdInput}
                    onChange={(event) => setGuideDdInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#dcecff] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">Guide Email</label>
                  <input
                    type="email"
                    value={guideEmailInput}
                    onChange={(event) => setGuideEmailInput(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#dcecff] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartAddGuide}
                  className="rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-700 ring-1 ring-slate-300 transition hover:-translate-y-0.5"
                >
                  Add Guide
                </button>
                <button
                  type="button"
                  disabled={savingGuideLibrary}
                  onClick={async () => {
                    const saved = await handleSaveGuideLibrary();
                    if (saved) {
                      setIsAddingGuide(false);
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-[#8fc7ff] to-[#5ea4e8] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingGuideLibrary ? 'Saving...' : (isExistingGuideInLibrary ? 'Update Guide' : 'Save Guide')}
                </button>
                {isAddingGuide ? (
                  <button
                    type="button"
                    onClick={handleCancelAddGuide}
                    className="rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-700 ring-1 ring-slate-300 transition hover:-translate-y-0.5"
                  >
                    Cancel Add
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={async () => {
                    const saved = await saveGuideAssignment();
                    if (saved) {
                      setDocActionMessage({ type: 'success', text: 'Guide assigned successfully.' });
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-[#8ed8c6] to-[#69b58f] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Assign Guide
                </button>
                <button
                  type="button"
                  onClick={handleGuideUnavailable}
                  className="rounded-2xl bg-gradient-to-r from-[#ff9ea7] to-[#ff7f94] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Mark On Hold
                </button>
                <button
                  type="button"
                  onClick={handleUnderConsideration}
                  className="rounded-2xl bg-gradient-to-r from-[#ff8db2] to-[#8fc7ff] px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Mark Under Consideration
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#dcecff] bg-[#f8fbff] p-6 shadow-[0_20px_45px_rgba(143,199,255,0.08)]">
              <h3 className="text-lg font-black text-slate-800">Document Actions</h3>
              <p className="mt-2 text-sm text-slate-600">Use these buttons to generate or print documents from this student record.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  disabled={generatingLetter}
                  onClick={handlePrintGuideAllotment}
                  className="rounded-2xl bg-gradient-to-r from-[#ff8db2] to-[#8fc7ff] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingLetter ? 'Processing...' : 'Guide Allotment Letter'}
                </button>
                <button
                  type="button"
                  disabled={generatingClosure}
                  onClick={handlePrintClosureLetter}
                  className="rounded-2xl bg-gradient-to-r from-[#8ed8c6] to-[#8fc7ff] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingClosure ? 'Printing...' : 'Closure Letter'}
                </button>
                <button
                  type="button"
                  disabled={sendingGal}
                  onClick={handlePrintGalLetter}
                  className="rounded-2xl bg-gradient-to-r from-[#c7b6ff] to-[#8fc7ff] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingGal ? 'Sending...' : 'GAL Letter'}
                </button>
                <button
                  type="button"
                  disabled={generatingCover}
                  onClick={handlePrintApplicationForm}
                  className="rounded-2xl bg-gradient-to-r from-[#ffb7b2] to-[#ff8db2] px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingCover ? 'Printing...' : 'Print Application Form'}
                </button>
              </div>
              {docActionMessage ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                    docActionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  }`}
                >
                  {docActionMessage.text}
                </div>
              ) : null}
            </section>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleDeleteStudent(selectedStudent.id!, selectedStudent.account_id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-red-600 ring-1 ring-red-200 transition hover:-translate-y-0.5"
              >
                <Trash2 size={15} /> Delete Record
              </button>
            </div>

            {renderLiveApplicationAlert()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overscroll-y-contain px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="rounded-[2rem] border border-[#f1dbe4] bg-[#fffafc] px-6 py-5 shadow-[0_22px_60px_rgba(255,141,178,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-[#fff0f5] to-[#eef9ff] p-3 shadow-sm">
                <img src="/isro_logo_secondary.svg" alt="ISRO" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-700">NRSC Internship Database</p>
                <h1 className="mt-2 text-3xl font-black text-slate-800">Admin Control Center</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-600 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
              >
                <Lock size={14} /> Secure Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
          <div className="rounded-[2rem] border border-[#f4dde5] bg-[#fff4f8] p-6 shadow-[0_18px_40px_rgba(255,141,178,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700">Students</p>
            <p className="mt-3 text-4xl font-black text-slate-800">{students.length}</p>
            <p className="mt-2 text-sm text-slate-500">Total student forms in the system</p>
          </div>
          <div className="rounded-[2rem] border border-[#dcecff] bg-[#f2f8ff] p-6 shadow-[0_18px_40px_rgba(143,199,255,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700">Total Active Students</p>
            <p className="mt-3 text-4xl font-black text-slate-800">{totalActiveStudents}</p>
            <p className="mt-2 text-sm text-slate-500">Students currently doing their internship</p>
          </div>
          <div className="rounded-[2rem] border border-[#d8f0e7] bg-[#f0fbf7] p-6 shadow-[0_18px_40px_rgba(142,216,198,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-700">Under Review</p>
            <p className="mt-3 text-4xl font-black text-slate-800">{underReviewCount}</p>
            <p className="mt-2 text-sm text-slate-500">Student records still under consideration</p>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="w-full rounded-[2.25rem] border border-[#e7eef9] bg-[#fffdfd] p-5 shadow-[0_24px_58px_rgba(35,48,74,0.06)] md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-2xl border border-[#e8edf8] bg-[#fbfdff] py-4 pl-12 pr-4 font-medium text-slate-700 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL_TIME">All Time</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <select
                value={degreeFilter}
                onChange={(event) => setDegreeFilter(event.target.value)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL">All Degrees</option>
                {Array.from(new Set([...UNDERGRAD_DEGREE_OPTIONS, ...POSTGRAD_DEGREE_OPTIONS])).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL">All Months</option>
                {[
                  'January','February','March','April','May','June','July','August','September','October','November','December'
                ].map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
              <select
                value={collegeFilter}
                onChange={(event) => setCollegeFilter(event.target.value)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL">All Colleges</option>
                {[...new Set(students.map((student) => student.college_name || student.university_name || '').filter(Boolean))].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL">All States</option>
                {STATES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <select
                value={guideFilter}
                onChange={(event) => setGuideFilter(event.target.value)}
                className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              >
                <option value="ALL">All Guides</option>
                {[...new Set(students.map((student) => student.assigned_scientist || '').filter(Boolean))].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            {timeFilter === 'CUSTOM' && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <select
                  value={customDateField}
                  onChange={(event) => setCustomDateField(event.target.value as CustomDateField)}
                  className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                >
                  <option value="join_date">Join Date</option>
                  <option value="end_date">End Date</option>
                </select>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(event) => setCustomDateFrom(event.target.value)}
                  className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  title="Start Date"
                />
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(event) => setCustomDateTo(event.target.value)}
                  className="rounded-2xl border border-[#e8edf8] bg-[#fbfdff] px-4 py-2.5 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
                  title="End Date"
                />
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2.25rem] border border-[#e8edf8] bg-[#fffdfd] shadow-[0_25px_70px_rgba(35,48,74,0.06)]">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8fc7ff] border-t-transparent" />
              Loading records...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Database className="mx-auto text-slate-300" size={52} />
              <h3 className="mt-4 text-2xl font-black text-slate-800">No records found</h3>
              <p className="mt-2 text-slate-500">Try a different filter or search keyword.</p>
            </div>
          ) : (
            <div className="overflow-x-hidden">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="bg-[#eef3fa]">
                  <tr>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">SL. No.</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Month</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Name</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">College</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Email</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Phone</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Status</th>
                    <th className="px-4 py-4 text-left text-[13px] font-black tracking-[0.06em] text-slate-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const studentStatus = String(student.status || 'UNDER CONSIDERATION');
                    const studentStatusClass =
                      studentStatus === 'ASSIGNED'
                        ? 'bg-[#dcfce7] text-emerald-700'
                        : studentStatus === 'ON HOLD'
                          ? 'bg-[#fee2e2] text-rose-700'
                          : 'bg-[#dbeafe] text-blue-700';
                    const startDate = student.start_date || student.present_date || student.created_at;
                    const endDate = student.end_date || student.date_of_ending;
                    const displayedStatus =
                      studentStatus === 'UNDER CONSIDERATION'
                        ? 'Doing'
                        : studentStatus === 'ASSIGNED'
                          ? 'Done'
                          : 'On Hold';
                    const fullName = getStudentName(student);

                    const monthYear = getMonthLabelFromDate(startDate);
                    const applicationId = student.student_uid || student.id || '-';
                    const collegeName = student.college_name || student.university_name || '-';

                    return (
                      <tr key={student.id} className="border-t border-[#dbe5f3] bg-[#edf3fb] transition hover:bg-[#e7eef8]">
                        <td className="truncate px-4 py-4 text-[15px] font-mono text-slate-900" title={applicationId}>{getShortText(applicationId, 15)}</td>
                        <td className="truncate px-4 py-4 text-[15px] text-slate-800" title={monthYear}>{monthYear}</td>
                        <td className="truncate px-4 py-4 text-[15px] font-medium text-slate-900" title={fullName || '-'}>{getShortText(fullName || '-', 25)}</td>
                        <td className="truncate px-4 py-4 text-[15px] text-slate-800" title={collegeName}>{getShortText(collegeName, 20)}</td>
                        <td className="break-all px-4 py-4 text-[15px] text-slate-800" title={student.email || '-'}>{student.email || '-'}</td>
                        <td className="truncate px-4 py-4 text-[15px] text-slate-800" title={student.phone_number || '-'}>{student.phone_number || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.04em] ${studentStatusClass}`}>
                            {displayedStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => {
                                const targetId = student.student_uid || student.id;
                                if (!targetId) return;
                                router.push(`/admin/${encodeURIComponent(targetId)}`);
                              }}
                              className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#ff8db2] via-[#d2aaf3] to-[#8fc7ff] px-5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_8px_20px_rgba(143,199,255,0.35)] transition hover:-translate-y-0.5"
                            >
                              View Record
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {renderLiveApplicationAlert()}
      </div>
    </div>
  );
}
