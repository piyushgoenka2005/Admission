import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Excel-backed data layer — reads from Student_DB_*.xlsx                   */
/* ────────────────────────────────────────────────────────────────────────── */

const EXCEL_FILENAME = 'Database_Student.xlsx';

function resolveExcelPath(): string {
  const configured =
    process.env.MASTER_DB_PATH?.trim() ||
    process.env.EXCEL_DB_PATH?.trim() ||
    '';

  const candidates: string[] = [];

  if (configured) {
    const absoluteConfigured = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);

    if (path.extname(absoluteConfigured)) {
      candidates.push(absoluteConfigured);
    } else {
      candidates.push(path.join(absoluteConfigured, EXCEL_FILENAME));
    }
  }

  candidates.push(path.join(process.cwd(), EXCEL_FILENAME));

  const existingPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (existingPath) return existingPath;

  throw new Error(
    `Excel database file not found. Checked: ${candidates.join(' | ')}. Set MASTER_DB_PATH or EXCEL_DB_PATH to an Excel file path or folder.`
  );
}

export interface Intern {
  id: string;
  sl_no: number;
  month: string;
  name: string;
  salute: string;
  email: string;
  phone: string;
  course: string;
  college: string;
  college_dean_hod: string;
  district: string;
  state: string;
  specialization: string;
  guide_name: string;
  guide_area: string;
  guide_mail: string;
  guide_reporting_officer: string;
  dd: string;
  start_date: string;
  end_date: string;
  allotment_date: string;
  guide_allocation_date: string;
  signed_application_date: string;
  biometric_date: string;
  hod_mail: string;
  mode_of_work: string;
  location: string;
  project_or_internship: string;
  project_title: string;
  remarks: string;
  submitted_at: string;
}

function formatExcelDate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      const mm = String(d.m).padStart(2, '0');
      const dd = String(d.d).padStart(2, '0');
      return `${d.y}-${mm}-${dd}`;
    }
  }
  return String(value).trim();
}

function str(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isCompletelyEmptyRow(row: unknown[]): boolean {
  if (!row || row.length === 0) return true;
  return row.every((cell) => str(cell) === '');
}

const MONTH_MAP: Record<string, string> = {
  jan: 'January', january: 'January',
  feb: 'February', february: 'February',
  mar: 'March', march: 'March',
  apr: 'April', april: 'April',
  may: 'May',
  jun: 'June', june: 'June',
  jul: 'July', july: 'July',
  aug: 'August', august: 'August',
  sep: 'September', september: 'September',
  oct: 'October', october: 'October',
  nov: 'November', november: 'November',
  dec: 'December', december: 'December',
};

function normalizeMonth(value: unknown): string {
  if (!value) return '';
  const raw = String(value).trim();
  // If it looks like a date string or Date object, extract month from it
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime()) && raw.length > 12) {
    return d.toLocaleString('en-GB', { month: 'long' });
  }
  return MONTH_MAP[raw.toLowerCase()] || raw;
}

function loadExcel(): Intern[] {
  const filePath = resolveExcelPath();
  const buffer = fs.readFileSync(filePath);
  // Keep Excel dates as serial numbers to avoid timezone shifts.
  const workbook = XLSX.read(buffer, { cellDates: false });

  const interns: Intern[] = [];

  // ── Helper: parse a sheet row array using the 2026 column layout ──────────
  // col 0:Month  1:Sl.No  2:AllotmentDate  3:Dean/HOD  4:College  5:Salute
  // col 6:Name   7:Course  8:From_Date  9:To_Date  10:Guide  11:GuideAllocDate
  // col 12:SignedAppDate  13:BiometricDate  14:GuideArea  15:GuideReportingOfficer
  // col 16:DD  17:District  18:State  19:GuideMail  20:StudentMail  21:Phone
  // col 22:HODMail  23:ModeOfWork  24:Location  25:Project/Internship
  // col 26:ProjectTitle  27:Specialization  28:Remarks
  function parseRow2026(r: unknown[], rowIndex: number, prefix: string): Intern {
    const compact2026 = !str(r[20]) && !str(r[21]) && str(r[10]).includes('@');

    if (compact2026) {
      return {
        id: `${prefix}-${rowIndex}`,
        sl_no: rowIndex,
        month: normalizeMonth(r[0]),
        name: str(r[6]),
        salute: str(r[5]),
        email: str(r[10]),
        phone: str(r[11]),
        course: str(r[7]),
        college: str(r[2]),
        college_dean_hod: str(r[1]),
        district: str(r[4]),
        state: str(r[3]),
        specialization: str(r[13]),
        guide_name: '',
        guide_area: '',
        guide_mail: '',
        guide_reporting_officer: '',
        dd: '',
        start_date: formatExcelDate(r[8]),
        end_date: formatExcelDate(r[9]),
        allotment_date: '',
        guide_allocation_date: '',
        signed_application_date: '',
        biometric_date: '',
        hod_mail: str(r[12]),
        mode_of_work: '',
        location: str(r[4]),
        project_or_internship: '',
        project_title: '',
        remarks: '',
        submitted_at: formatExcelDate(r[8]) || formatExcelDate(r[9]),
      };
    }

    return {
      id: `${prefix}-${rowIndex}`,
      sl_no: typeof r[1] === 'number' ? Number(r[1]) : rowIndex,
      month: normalizeMonth(r[0]),
      name: str(r[6]),
      salute: str(r[5]),
      email: str(r[20]),
      phone: str(r[21]),
      course: str(r[7]),
      college: str(r[4]),
      college_dean_hod: str(r[3]),
      district: str(r[17]),
      state: str(r[18]),
      specialization: str(r[27]),
      guide_name: str(r[10]),
      guide_area: str(r[14]),
      guide_mail: str(r[19]),
      guide_reporting_officer: str(r[15]),
      dd: str(r[16]),
      start_date: formatExcelDate(r[8]),
      end_date: formatExcelDate(r[9]),
      allotment_date: formatExcelDate(r[2]),
      guide_allocation_date: formatExcelDate(r[11]),
      signed_application_date: formatExcelDate(r[12]),
      biometric_date: formatExcelDate(r[13]),
      hod_mail: str(r[22]),
      mode_of_work: str(r[23]),
      location: str(r[24]),
      project_or_internship: str(r[25]),
      project_title: str(r[26]),
      remarks: str(r[28]),
      submitted_at: formatExcelDate(r[12]) || formatExcelDate(r[2]),
    };
  }

  // ── Helper: parse a sheet row array using the 2025 column layout ──────────
  // col 0:Month  1:Sl.No  2:AllotmentDate  3:Dean/HOD  4:College  5:Salute
  // col 6:Name   7:Course  8:From_Date  9:To_Date  10:Guide  11:GuideArea
  // col 12:GuideReportingOfficer  13:DD  14:District  15:State  16:GuideMail
  // col 17:StudentMail  18:Phone  19:HODMail  20:ModeOfWork  21:Location
  // col 22:Project/Internship  23:ProjectTitle  24:Specialization  25:Remarks
  function parseRow2025(r: unknown[], rowIndex: number, prefix: string): Intern {
    return {
      id: `${prefix}-${rowIndex}`,
      sl_no: typeof r[1] === 'number' ? Number(r[1]) : rowIndex,
      month: normalizeMonth(r[0]),
      name: str(r[6]),
      salute: str(r[5]),
      email: str(r[17]),
      phone: str(r[18]),
      course: str(r[7]),
      college: str(r[4]),
      college_dean_hod: str(r[3]),
      district: str(r[14]),
      state: str(r[15]),
      specialization: str(r[24]),
      guide_name: str(r[10]),
      guide_area: str(r[11]),
      guide_mail: str(r[16]),
      guide_reporting_officer: str(r[12]),
      dd: str(r[13]),
      start_date: formatExcelDate(r[8]),
      end_date: formatExcelDate(r[9]),
      allotment_date: formatExcelDate(r[2]),
      guide_allocation_date: '',
      signed_application_date: '',
      biometric_date: '',
      hod_mail: str(r[19]),
      mode_of_work: str(r[20]),
      location: str(r[21]),
      project_or_internship: str(r[22]),
      project_title: str(r[23]),
      remarks: str(r[25]),
      submitted_at: formatExcelDate(r[2]),
    };
  }

  function readSheet(sheetName: string, parser: (r: unknown[], i: number) => Intern) {
    if (!workbook.SheetNames.includes(sheetName)) return;
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: true,
    });
    const EMPTY_ROW_STOP_COUNT = 5;
    let consecutiveEmptyRows = 0;
    const dataRows: Array<{ row: unknown[]; index: number }> = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (isCompletelyEmptyRow(r)) {
        consecutiveEmptyRows += 1;
        if (consecutiveEmptyRows >= EMPTY_ROW_STOP_COUNT) {
          break;
        }
        continue;
      }

      // Reset streak when the row is not fully empty.
      consecutiveEmptyRows = 0;

      // Rows without name are non-data separators/notes; ignore but keep scanning.
      if (!str(r[6])) continue;

      dataRows.push({ row: r, index: i });
    }

    for (let i = dataRows.length - 1; i >= 0; i--) {
      const current = dataRows[i];
      const parsed = parser(current.row, current.index);
      const startOk = !Number.isNaN(new Date(parsed.start_date).getTime());
      const endOk = !Number.isNaN(new Date(parsed.end_date).getTime());
      if (!startOk && !endOk) continue; // skip stray/non-data rows

      interns.push(parsed);
    }
  }

  // 2026 data first, then 2025
  readSheet("Student's list-2026", (r, i) => parseRow2026(r, i, '2026'));
  readSheet("Student's list-2025", (r, i) => parseRow2025(r, i, '2025'));

  return interns;
}

/* ─── Cache (refreshed every 30 seconds) ─────────────────────────────────── */

let cachedInterns: Intern[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

function getInterns(): Intern[] {
  const now = Date.now();
  if (!cachedInterns || now - cacheTimestamp > CACHE_TTL) {
    cachedInterns = loadExcel();
    cacheTimestamp = now;
  }
  return cachedInterns;
}

export function invalidateCache() {
  cachedInterns = null;
  cacheTimestamp = 0;
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

export async function getAllInterns(): Promise<Intern[]> {
  return getInterns();
}

export async function getInternById(id: string): Promise<Intern | null> {
  const all = getInterns();
  return all.find((intern) => intern.id === id) || null;
}
