const XLSX = require('xlsx');
const wb = XLSX.readFile('Database_Student.xlsx', { cellDates: false });
const ws = wb.Sheets["Student's list-2026"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
for (let i = 128; i <= 160 && i < rows.length; i++) {
  const r = rows[i] || [];
  const nonEmpty = [];
  for (let c = 0; c < r.length; c++) {
    if (String(r[c]).trim() !== '') nonEmpty.push(c);
  }
  console.log(i, 'name=', JSON.stringify(r[6] ?? ''), 'course=', JSON.stringify(r[7] ?? ''), 'email=', JSON.stringify(r[20] ?? ''), 'location=', JSON.stringify(r[24] ?? ''), 'nonEmpty=', nonEmpty.join(','));
}
