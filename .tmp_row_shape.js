const XLSX = require('xlsx');
const wb = XLSX.readFile('Database_Student.xlsx', { cellDates: false });
const ws = wb.Sheets["Student's list-2026"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
for (const i of [137, 138, 139, 145]) {
  const r = rows[i] ? rows[i] : [];
  console.log('ROW', i);
  for (let c = 0; c < 20; c++) {
    if (String(r[c] ?? '').trim() !== '') {
      console.log(c, JSON.stringify(r[c]));
    }
  }
}
