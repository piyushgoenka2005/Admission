const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'Database_Student.xlsx');
const wb = XLSX.read(fs.readFileSync(filePath), { cellDates: false });
const ws = wb.Sheets["Student's list-2026"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
for (let i = 128; i <= 158; i++) {
  const r = rows[i] || [];
  const nz = [];
  for (let c = 0; c < r.length; c++) {
    if (String(r[c] ?? '').trim() !== '') nz.push(`${c}:${String(r[c]).trim()}`);
  }
  console.log(`ROW ${i}: ${nz.join(' | ')}`);
}
