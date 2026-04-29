import fs from 'fs';
import { getMongoDb } from '../lib/mongodb';

interface CSVRow {
  Month: string;
  'Sl. No.': string;
  'Guide_AllotmentLetter_IssuedDate': string;
  'Name_College Dean/HOD': string;
  'Name_College': string;
  Salute: string;
  'Name_Student': string;
  Course: string;
  'From_Date': string;
  'To_Date': string;
  'Name_Guide': string;
  'Guide_Allocation Date': string;
  'Signed Application received Date': string;
  'Sent for Biometric/VM login creation': string;
  'Guide_Area': string;
  'Guide Reporting Officer': string;
  DD: string;
  District: string;
  State: string;
  'Guide_mail': string;
  'Student_mail': string;
  Phone: string;
  'HOD mail_ID': string;
  'Mode of Work': string;
  Number: string;
  'Project/Internship': string;
  'Project Title': string;
  Specialization: string;
  Remarks: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('"') && line.includes('SAT & SUN')) continue; // Skip holiday rows
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row as CSVRow);
    }
  }

  return rows;
}

function mapCSVToApplication(row: CSVRow) {
  return {
    student: {
      name: row['Name_Student']?.trim() || '',
      salutation: row['Salute']?.trim() || '',
      college_name: row['Name_College']?.trim() || '',
      university_name: row['Name_College']?.trim() || '',
      qualification: row['Course']?.trim() || '',
      hod_name: row['Name_College Dean/HOD']?.trim() || '',
      hod_email: row['HOD mail_ID']?.trim() || '',
      start_date: row['From_Date']?.trim() || '',
      end_date: row['To_Date']?.trim() || '',
      dd: row['DD']?.trim() || '',
      reporting_division: row['Guide_Area']?.trim() || '',
      assigned_scientist: row['Name_Guide']?.trim() || '',
      guide_division: row['Guide_Area']?.trim() || '',
      guide_reporting_officer: row['Guide Reporting Officer']?.trim() || '',
      guide_email: row['Guide_mail']?.trim() || '',
      student_uid: row['Sl. No.']?.trim() || '',
      phone: row['Phone']?.trim() || '',
      email: row['Student_mail']?.trim() || '',
      city: row['District']?.trim() || '',
      state: row['State']?.trim() || '',
      project_name: row['Project Title']?.trim() || '',
      specialization: row['Specialization']?.trim() || '',
      guide_assigned_at: row['Guide_Allocation Date']?.trim() || '',
      reported_at: row['Signed Application received Date']?.trim() || '',
      present_date: row['Sent for Biometric/VM login creation']?.trim() || '',
    },
    created_at: row['Guide_AllotmentLetter_IssuedDate']?.trim() || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function importCSVToDatabase() {
  try {
    console.log('Starting CSV import...');
    
    const csvPath = './Data_All_letters_Updated-latest_20Apr26_Major.csv';
    const rows = parseCSV(csvPath);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const db = await getMongoDb();
    const applications = db.collection('applications');

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const studentUid = row['Sl. No.']?.trim();
        if (!studentUid) {
          skipped++;
          continue;
        }

        // Check if student already exists
        const existing = await applications.findOne({ 'student.student_uid': studentUid });
        
        if (existing) {
          console.log(`Skipping existing student: ${studentUid} - ${row['Name_Student']}`);
          skipped++;
          continue;
        }

        const application = mapCSVToApplication(row);
        await applications.insertOne(application);
        inserted++;
        console.log(`Inserted: ${studentUid} - ${row['Name_Student']}`);
      } catch (err) {
        console.error(`Error inserting row for ${row['Name_Student']}:`, err);
        errors++;
      }
    }

    console.log('\nImport Summary:');
    console.log(`Total rows: ${rows.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (existing): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importCSVToDatabase();
