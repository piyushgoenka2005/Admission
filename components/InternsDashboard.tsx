'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Intern } from '@/lib/db';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);

type SortBy = 'excel' | 'name' | 'email' | 'date' | 'college';
type InternshipStatus = 'completed' | 'ongoing' | 'upcoming';
type BreakdownKey =
  | 'month'
  | 'course'
  | 'specialization'
  | 'district'
  | 'state'
  | 'college'
  | 'salute'
  | 'guide_name';

type Filters = {
  year: string;
  month: string;
  status: string;
  custom_date_field: 'start_date' | 'end_date';
  start_date_from: string;
  start_date_to: string;
  course: string;
  specialization: string;
  district: string;
  state: string;
  college: string;
  salute: string;
  guide_name: string;
  location: string;
};

const defaultFilters: Filters = {
  year: '',
  month: '',
  status: '',
  custom_date_field: 'start_date',
  start_date_from: '',
  start_date_to: '',
  course: '',
  specialization: '',
  district: '',
  state: '',
  college: '',
  salute: '',
  guide_name: '',
  location: '',
};

const palette = [
  '#2563eb',
  '#9333ea',
  '#059669',
  '#ea580c',
  '#db2777',
  '#0891b2',
  '#4f46e5',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
];

function getInternshipStatus(intern: Intern): InternshipStatus {
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = new Date(intern.start_date).getTime();
  const end = new Date(intern.end_date).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 'upcoming';
  }

  const startDay = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), new Date(start).getDate()).getTime();
  const endDay = new Date(new Date(end).getFullYear(), new Date(end).getMonth(), new Date(end).getDate()).getTime();

  if (endDay < nowDay) {
    return 'completed';
  }

  if (startDay <= nowDay && endDay >= nowDay) {
    return 'ongoing';
  }

  return 'upcoming';
}

function getStatusStyles(status: InternshipStatus): { row: string; badge: string; label: string } {
  if (status === 'completed') {
    return {
      row: 'bg-green-50/60 hover:bg-green-100/60',
      badge: 'bg-green-100 text-green-700',
      label: 'Done',
    };
  }

  if (status === 'ongoing') {
    return {
      row: 'bg-blue-50/60 hover:bg-blue-100/60',
      badge: 'bg-blue-100 text-blue-700',
      label: 'Doing',
    };
  }

  return {
    row: 'bg-amber-50/60 hover:bg-amber-100/60',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Upcoming',
  };
}

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

function formatCompactDate(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

function getRoundedDurationMonths(startDate: string, endDate: string): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return '-';
  }

  const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44));
  const safeMonths = Math.max(months, 1);
  return `${safeMonths} month${safeMonths === 1 ? '' : 's'}`;
}

function toDateOnlyTimestamp(value: string): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getExcelRowRank(id: string): number {
  const [sheetPrefix, rowPart] = id.split('-');
  const sheetRank = Number(sheetPrefix) || 0;
  const rowRank = Number(rowPart) || 0;
  return sheetRank * 1_000_000 + rowRank;
}

export function InternsDashboard() {
  const router = useRouter();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('excel');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [breakdownBy, setBreakdownBy] = useState<BreakdownKey>('course');
  const [generatingLetterFor, setGeneratingLetterFor] = useState<string | null>(null);
  const [generatingClosureFor, setGeneratingClosureFor] = useState<string | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  const [entryMessages, setEntryMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});
  const pieCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<Chart<'pie'> | null>(null);

  // ID Card Data Sheet state
  const [idCardSearch, setIdCardSearch] = useState('');
  const [selectedForIdCard, setSelectedForIdCard] = useState<Set<string>>(new Set());
  const [printingIdSheet, setPrintingIdSheet] = useState(false);
  const [idSheetMessage, setIdSheetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showIdCardDialog, setShowIdCardDialog] = useState(false);
  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interns/list?force=1');

      if (!response.ok) {
        throw new Error('Failed to fetch interns');
      }

      const data = await response.json();
      setInterns(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading interns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const uniqueValues = useMemo(() => {
    const collect = (key: keyof Intern) =>
      [...new Set(interns.map((intern) => String(intern[key] ?? '').trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      );

    // Collect unique years from start_date
    const years = [...new Set(interns.map((i) => {
      const d = new Date(i.start_date);
      return Number.isNaN(d.getTime()) ? '' : String(d.getFullYear());
    }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

    const locations = [...new Set(interns.map((intern) => String(intern.location ?? '').trim() || 'jeedimitla'))].sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      year: years,
      month: collect('month'),
      status: ['ongoing', 'completed', 'upcoming'],
      course: collect('course'),
      specialization: collect('specialization'),
      district: collect('district'),
      state: collect('state'),
      college: collect('college'),
      salute: collect('salute'),
      guide_name: collect('guide_name'),
      location: locations,
    };
  }, [interns]);

  const displayedInterns = useMemo(() => {
    let filtered = interns.filter((intern) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        intern.name.toLowerCase().includes(query) ||
        intern.email.toLowerCase().includes(query) ||
        intern.phone.toLowerCase().includes(query) ||
        intern.college.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filters.year) {
        const d = new Date(intern.start_date);
        if (Number.isNaN(d.getTime()) || String(d.getFullYear()) !== filters.year) return false;
      }
      if (filters.month && intern.month !== filters.month) return false;
      if (filters.status && getInternshipStatus(intern) !== filters.status) return false;

      const dateFieldValue = filters.custom_date_field === 'end_date' ? intern.end_date : intern.start_date;

      if (filters.start_date_from) {
        const startAt = toDateOnlyTimestamp(dateFieldValue);
        const fromAt = toDateOnlyTimestamp(filters.start_date_from);
        if (startAt === null || fromAt === null || startAt < fromAt) return false;
      }
      if (filters.start_date_to) {
        const startAt = toDateOnlyTimestamp(dateFieldValue);
        const toAt = toDateOnlyTimestamp(filters.start_date_to);
        if (startAt === null || toAt === null || startAt > toAt) return false;
      }
      if (filters.course && intern.course !== filters.course) return false;
      if (filters.specialization && intern.specialization !== filters.specialization) return false;
      if (filters.district && intern.district !== filters.district) return false;
      if (filters.state && intern.state !== filters.state) return false;
      if (filters.college && intern.college !== filters.college) return false;
      if (filters.salute && intern.salute !== filters.salute) return false;
      if (filters.guide_name && intern.guide_name !== filters.guide_name) return false;
      if (filters.location && (String(intern.location ?? '').trim() || 'jeedimitla') !== filters.location) return false;

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'excel':
          return getExcelRowRank(b.id) - getExcelRowRank(a.id);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'college':
          return a.college.localeCompare(b.college);
        case 'date':
        default:
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
    });

    return filtered;
  }, [filters, interns, searchTerm, sortBy]);

  const customDateRangeCount = useMemo(() => {
    const fromAt = toDateOnlyTimestamp(filters.start_date_from);
    const toAt = toDateOnlyTimestamp(filters.start_date_to);

    if (fromAt === null && toAt === null) return interns.length;

    return interns.filter((intern) => {
      const dateFieldValue = filters.custom_date_field === 'end_date' ? intern.end_date : intern.start_date;
      const startAt = toDateOnlyTimestamp(dateFieldValue);
      if (startAt === null) return false;
      if (fromAt !== null && startAt < fromAt) return false;
      if (toAt !== null && startAt > toAt) return false;
      return true;
    }).length;
  }, [interns, filters.custom_date_field, filters.start_date_from, filters.start_date_to]);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const intern of displayedInterns) {
      const value = String(intern[breakdownBy] ?? '').trim() || 'Unknown';
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const labels = [...counts.keys()];
    const values = labels.map((label) => counts.get(label) || 0);

    return { labels, values };
  }, [breakdownBy, displayedInterns]);

  useEffect(() => {
    if (!pieCanvasRef.current) return;

    if (pieChartRef.current) {
      pieChartRef.current.destroy();
      pieChartRef.current = null;
    }

    if (!chartData.labels.length) return;

    pieChartRef.current = new Chart(pieCanvasRef.current, {
      type: 'pie',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.values,
            backgroundColor: chartData.labels.map((_, index) => palette[index % palette.length]),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });

    return () => {
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
      }
    };
  }, [chartData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortBy('excel');
    setFilters(defaultFilters);
  };

  const handleGenerateOfferLetter = async (intern: Intern) => {
    setGeneratingLetterFor(intern.id);
    setEntryMessages((prev) => {
      const next = { ...prev };
      delete next[intern.id];
      return next;
    });

    try {
      const response = await fetch('/api/letters/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to print offer letter');
      }

      setEntryMessages((prev) => ({
        ...prev,
        [intern.id]: { type: 'success', text: 'Offer letter sent to printer.' },
      }));
    } catch (err) {
      setEntryMessages((prev) => ({
        ...prev,
        [intern.id]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Offer letter printing failed',
        },
      }));
    } finally {
      setGeneratingLetterFor(null);
    }
  };

  const handleGenerateClosureCertificate = async (intern: Intern) => {
    setGeneratingClosureFor(intern.id);
    setEntryMessages((prev) => {
      const next = { ...prev };
      delete next[`closure_${intern.id}`];
      return next;
    });

    try {
      const response = await fetch('/api/letters/closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to print closure certificate');
      }

      setEntryMessages((prev) => ({
        ...prev,
        [`closure_${intern.id}`]: { type: 'success', text: 'Closure certificate sent to printer.' },
      }));
    } catch (err) {
      setEntryMessages((prev) => ({
        ...prev,
        [`closure_${intern.id}`]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Closure certificate printing failed',
        },
      }));
    } finally {
      setGeneratingClosureFor(null);
    }
  };

  const handleSendEmail = async (intern: Intern) => {
    setSendingEmailFor(intern.id);
    setEntryMessages((prev) => {
      const next = { ...prev };
      delete next[`email_${intern.id}`];
      return next;
    });

    try {
      const response = await fetch('/api/letters/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId: intern.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setEntryMessages((prev) => ({
        ...prev,
        [`email_${intern.id}`]: { type: 'success', text: data.message || 'Offer letter emailed successfully.' },
      }));
    } catch (err) {
      setEntryMessages((prev) => ({
        ...prev,
        [`email_${intern.id}`]: {
          type: 'error',
          text: err instanceof Error ? err.message : 'Email sending failed',
        },
      }));
    } finally {
      setSendingEmailFor(null);
    }
  };

  // ID Card Data Sheet
  const idCardFilteredInterns = useMemo(() => {
    const q = idCardSearch.trim().toLowerCase();
    const filtered = q
      ? displayedInterns.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.email.toLowerCase().includes(q) ||
            i.phone.toLowerCase().includes(q) ||
            i.college.toLowerCase().includes(q) ||
            i.course.toLowerCase().includes(q)
        )
      : [...displayedInterns];

    return filtered;
  }, [displayedInterns, idCardSearch]);

  const toggleIdCardSelection = (id: string) => {
    setSelectedForIdCard((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllIdCard = () => {
    const allVisibleIds = idCardFilteredInterns.map((i) => i.id);
    const allSelected = allVisibleIds.every((id) => selectedForIdCard.has(id));
    if (allSelected) {
      setSelectedForIdCard((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedForIdCard((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handlePrintIdCardSheet = async () => {
    if (selectedForIdCard.size === 0) return;
    setPrintingIdSheet(true);
    setIdSheetMessage(null);
    try {
      const response = await fetch('/api/letters/idcard-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internIds: [...selectedForIdCard] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to print ID card data sheet');
      setIdSheetMessage({ type: 'success', text: `Memo for ${selectedForIdCard.size} student(s) sent to printer.` });
      setSelectedForIdCard(new Set());
    } catch (err) {
      setIdSheetMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to print' });
    } finally {
      setPrintingIdSheet(false);
    }
  };

  const goToInternDetails = (intern: Intern) => {
    router.push(`/intern/${intern.sl_no}`, { scroll: true });
  };

  if (loading) {
    return (
      <Card className="p-8">
        <p className="text-center text-slate-600">Loading applications...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-red-600 text-center">{error}</div>
        <Button onClick={fetchInterns} className="mt-4 mx-auto">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-2">Total Students</p>
          <p className="text-3xl font-bold text-slate-900">{interns.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-2">Joined This Month</p>
          <p className="text-3xl font-bold text-green-700">
            {interns.filter((i) => {
              const now = new Date();
              const currentMonth = now.toLocaleString('en-GB', { month: 'long' }).toLowerCase();
              if (i.start_date) {
                const d = new Date(i.start_date);
                return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }
              // fallback: match on month text field (no year check possible)
              return i.month.toLowerCase() === currentMonth;
            }).length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-2">Leaving This Month</p>
          <p className="text-3xl font-bold text-red-700">
            {interns.filter((i) => {
              const d = new Date(i.end_date);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-2">Currently Active</p>
          <p className="text-3xl font-bold text-blue-700">
            {interns.filter((i) => getInternshipStatus(i) === 'ongoing').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-slate-600 text-sm font-medium mb-2">Filtered Results</p>
          <p className="text-3xl font-bold text-slate-900">{displayedInterns.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone, or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="excel">Sort by Excel Order</option>
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="college">Sort by College</option>
            </select>
            <Button onClick={fetchInterns}>Refresh</Button>
            <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Years</option>
              {uniqueValues.year.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Months</option>
              {uniqueValues.month.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Status</option>
              {uniqueValues.status.map((value) => (
                <option key={value} value={value}>
                  {value === 'ongoing' ? 'Doing' : value === 'completed' ? 'Completed' : 'Upcoming'}
                </option>
              ))}
            </select>
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange('course', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Courses</option>
              {uniqueValues.course.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.custom_date_field}
              onChange={(e) => handleFilterChange('custom_date_field', e.target.value as Filters['custom_date_field'])}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="start_date">Join Date</option>
              <option value="end_date">End Date</option>
            </select>
            <input
              type="date"
              value={filters.start_date_from}
              onChange={(e) => handleFilterChange('start_date_from', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
              title={filters.custom_date_field === 'end_date' ? 'End Date From' : 'Join Date From'}
            />
            <input
              type="date"
              value={filters.start_date_to}
              onChange={(e) => handleFilterChange('start_date_to', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
              title={filters.custom_date_field === 'end_date' ? 'End Date To' : 'Join Date To'}
            />
            <select
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Specializations</option>
              {uniqueValues.specialization.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Districts</option>
              {uniqueValues.district.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All States</option>
              {uniqueValues.state.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.college}
              onChange={(e) => handleFilterChange('college', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Colleges</option>
              {uniqueValues.college.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.guide_name}
              onChange={(e) => handleFilterChange('guide_name', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Guide Names</option>
              {uniqueValues.guide_name.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Assigned Areas</option>
              {uniqueValues.location.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-600">
            Showing {displayedInterns.length} of {interns.length} applications
          </p>
        </div>
      </Card>

      {/* Pie Chart */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Applications Pie Chart</h3>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowIdCardDialog(true)}>
              ACS Biometric Memo
            </Button>
          <select
            value={breakdownBy}
            onChange={(e) => setBreakdownBy(e.target.value as BreakdownKey)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="month">By Month</option>
            <option value="course">By Course</option>
            <option value="specialization">By Specialization</option>
            <option value="district">By District</option>
            <option value="state">By State</option>
            <option value="college">By College</option>
            <option value="salute">By Salutation</option>
            <option value="guide_name">By Guide Name</option>
          </select>
          </div>
        </div>

        {chartData.labels.length > 0 ? (
          <div className="max-w-xl mx-auto">
            <canvas ref={pieCanvasRef} />
          </div>
        ) : (
          <p className="text-sm text-slate-600">No data available for the selected filters.</p>
        )}
      </Card>

      {/* Interns List */}
      <Card className="p-6">
        {displayedInterns.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-fixed text-base">
              <colgroup>
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[6%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[8%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Name</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">College</th>
                  <th className="px-1.5 py-2 text-left text-base font-semibold text-slate-700">Course</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Email</th>
                  <th className="px-2 py-2 text-left text-base font-semibold text-slate-700">Phone</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Start</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">End</th>
                  <th className="px-1.5 py-2 text-left text-base font-semibold text-slate-700">Duration</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Status</th>
                  <th className="px-3 py-2 text-left text-base font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedInterns.map((intern) => {
                  const status = getInternshipStatus(intern);
                  const styles = getStatusStyles(status);

                  return (
                    <tr
                      key={intern.id}
                      className={`border-t border-slate-200 align-top ${styles.row}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => goToInternDetails(intern)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          goToInternDetails(intern);
                        }
                      }}
                    >
                      <td className="px-2 py-2.5 font-medium text-slate-900 truncate">{intern.salute} {intern.name}</td>
                      <td className="px-2 py-2.5 text-slate-700 truncate">{intern.college || '-'}</td>
                      <td className="px-1.5 py-2.5 text-sm text-slate-700 whitespace-nowrap">{intern.course || '-'}</td>
                      <td className="px-2 py-2.5 text-sm text-slate-700 truncate">{intern.email || '-'}</td>
                      <td className="px-1.5 py-2.5 text-sm text-slate-700 whitespace-nowrap">{intern.phone || '-'}</td>
                      <td className="px-2 py-2.5 text-slate-700 whitespace-nowrap">{formatCompactDate(intern.start_date)}</td>
                      <td className="px-2 py-2.5 text-slate-700 whitespace-nowrap">{formatCompactDate(intern.end_date)}</td>
                      <td className="px-1.5 py-2.5 text-slate-700 whitespace-nowrap">{getRoundedDurationMonths(intern.start_date, intern.end_date)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
                          {styles.label}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={() => handleGenerateOfferLetter(intern)}
                            disabled={generatingLetterFor === intern.id}
                            className="h-auto px-3 py-1.5 text-sm leading-tight whitespace-nowrap"
                          >
                            {generatingLetterFor === intern.id ? 'Printing...' : 'Guide Allotment Letter'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateClosureCertificate(intern)}
                            disabled={generatingClosureFor === intern.id}
                            className="h-auto px-3 py-1.5 text-sm leading-tight whitespace-nowrap"
                          >
                            {generatingClosureFor === intern.id ? 'Printing...' : 'Closure Letter'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendEmail(intern)}
                            disabled={sendingEmailFor === intern.id}
                            className="h-auto px-3 py-1.5 text-sm leading-tight whitespace-nowrap"
                          >
                            {sendingEmailFor === intern.id ? 'Sending...' : 'GAL Email'}
                          </Button>
                        </div>
                        {entryMessages[intern.id] && (
                          <p
                            className={`mt-2 text-xs ${
                              entryMessages[intern.id].type === 'success' ? 'text-green-700' : 'text-red-600'
                            }`}
                          >
                            {entryMessages[intern.id].text}
                          </p>
                        )}
                        {entryMessages[`closure_${intern.id}`] && (
                          <p
                            className={`mt-1 text-xs ${
                              entryMessages[`closure_${intern.id}`].type === 'success' ? 'text-green-700' : 'text-red-600'
                            }`}
                          >
                            {entryMessages[`closure_${intern.id}`].text}
                          </p>
                        )}
                        {entryMessages[`email_${intern.id}`] && (
                          <p
                            className={`mt-1 text-xs ${
                              entryMessages[`email_${intern.id}`].type === 'success' ? 'text-green-700' : 'text-red-600'
                            }`}
                          >
                            {entryMessages[`email_${intern.id}`].text}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-600 py-8">No applications found</p>
        )}
      </Card>

      {/* ACS Biometric Memo Dialog */}
      {showIdCardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowIdCardDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ACS Biometric & VM Login Request</h3>
              <button onClick={() => setShowIdCardDialog(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by name, email, phone, college, or course..."
                value={idCardSearch}
                onChange={(e) => setIdCardSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handlePrintIdCardSheet}
                disabled={printingIdSheet || selectedForIdCard.size === 0}
              >
                {printingIdSheet ? 'Printing...' : `Print Memo (${selectedForIdCard.size} selected)`}
              </Button>
            </div>

            {idSheetMessage && (
              <p className={`px-5 pb-2 text-sm ${idSheetMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {idSheetMessage.text}
              </p>
            )}

            <div className="flex-1 overflow-y-auto px-5 pb-2">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={idCardFilteredInterns.length > 0 && idCardFilteredInterns.every((i) => selectedForIdCard.has(i.id))}
                        onChange={toggleSelectAllIdCard}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Salute</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">Student Name</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">From</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-700">To</th>
                  </tr>
                </thead>
                <tbody>
                  {idCardFilteredInterns.map((intern) => (
                    <tr
                      key={intern.id}
                      className={`border-t border-slate-100 cursor-pointer hover:bg-blue-50 ${
                        selectedForIdCard.has(intern.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleIdCardSelection(intern.id)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedForIdCard.has(intern.id)}
                          onChange={() => toggleIdCardSelection(intern.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2">{intern.salute}</td>
                      <td className="px-3 py-2">{intern.name}</td>
                      <td className="px-3 py-2">{formatPrettyDate(intern.start_date)}</td>
                      <td className="px-3 py-2">{formatPrettyDate(intern.end_date)}</td>
                    </tr>
                  ))}
                  {idCardFilteredInterns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
              Showing {idCardFilteredInterns.length} students — {selectedForIdCard.size} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
