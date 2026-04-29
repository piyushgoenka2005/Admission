import fs from 'fs';
import path from 'path';
import { getMongoDb } from '../lib/mongodb';

async function exportDatabase() {
  try {
    console.log('Starting database export...');
    
    const db = await getMongoDb();
    
    // Create exports directory
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export applications
    console.log('Exporting applications...');
    const applications = await db.collection('applications').find({}).toArray();
    fs.writeFileSync(
      path.join(exportDir, 'applications.json'),
      JSON.stringify(applications, null, 2)
    );
    console.log(`Exported ${applications.length} applications`);

    // Export guides
    console.log('Exporting guides...');
    const guides = await db.collection('guides').find({}).toArray();
    fs.writeFileSync(
      path.join(exportDir, 'guides.json'),
      JSON.stringify(guides, null, 2)
    );
    console.log(`Exported ${guides.length} guides`);

    // Export portal settings if exists
    console.log('Exporting portal settings...');
    const portalSettings = await db.collection('portal_settings').findOne({});
    if (portalSettings) {
      fs.writeFileSync(
        path.join(exportDir, 'portal-settings.json'),
        JSON.stringify(portalSettings, null, 2)
      );
      console.log('Exported portal settings');
    }

    console.log('\nExport completed successfully!');
    console.log('Export files are located in: ' + exportDir);
    
    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportDatabase();
