/* One-time seeding script to push bundled guides into MongoDB */
const { MongoClient } = require('mongodb');

// Bundled guide profiles (from lib/guideDetails.ts)
const rawGuideProfiles = [
  { name: 'Dr Jaya Saxena', division: 'SPID/TEOG/MSA', reportingOfficer: 'GD, TEOG', email: 'jayasaxena@nrsc.gov.in', dd: 'DD MSA' },
  { name: 'Smt Jaya Bharathi', division: 'MPAD/SDPEG/DPA', reportingOfficer: 'Head, MPAD - Smt Sri Sudha S', email: 'jaya_bh@nrsc.gov.in', dd: 'DD DPA' },
  { name: 'Dr I C Das', division: 'HYDROGEO/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'ic@nrsc.gov.in', dd: 'DD RSA' },
  { name: 'Shri Shashank Kumar Mishra', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Shri Rajesh Sikhakolli', email: 'shashank_m@nrsc.gov.in', dd: 'DD ECSA' },
  { name: 'Dr Srinivas R', division: 'SPOD/TEOG/MSA', reportingOfficer: 'GD, TEOG', email: 'srinivasr@nrsc.gov.in', dd: 'DD MSA' },
  { name: 'Shri Satya Soma Shekar K', division: 'CR-DPD/ODPG/DPA', reportingOfficer: 'GH, ODPG', email: 'satya.singh@nrsc.gov.in', dd: 'DD DPA' },
  { name: 'Shri Anil Yadav', division: 'AS&CID/AA&CIG/RSA', reportingOfficer: 'Head, AS&CID - Dr Rama Mohana Rao K', email: 'anil_y@nrsc.gov.in', dd: 'DD RSA' },
  { name: 'Shri Venkata Raghavendra K', division: 'ITID/SISG/MSA', reportingOfficer: 'GH, SISG - Shri Krishna Kishore SVSR', email: 'raghavendra_kv@nrsc.gov.in', dd: 'DD MSA' },
  { name: 'Shri Pavan Kumar Bairavarasu', division: 'ISD/SISG/MSA', reportingOfficer: 'GH, SISG - Shri Krishna Kishore SVSR', email: 'pavankumar_b@nrsc.gov.in', dd: 'DD MSA' },
];

const normalizeGuideName = (name) => {
  return name
    .toLowerCase()
    .replace(/\b(dr|drs|shri|shris|smt|smts)\b\s+/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'nrsc_portal';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('guides');

    for (const guide of rawGuideProfiles) {
      const normalized = normalizeGuideName(guide.name);
      await col.updateOne(
        { normalized_name: normalized },
        {
          $set: {
            name: guide.name,
            division: guide.division,
            reporting_officer: guide.reportingOfficer,
            email: guide.email,
            dd: guide.dd || '',
          },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true }
      );
      console.log('✓ Upserted:', guide.name);
    }

    console.log('\n✓ Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
