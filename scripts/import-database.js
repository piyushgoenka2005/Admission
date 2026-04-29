const fs = require('fs');
const path = require('path');
const { getMongoDb } = require('../lib/mongodb');

async function importDatabase() {
  try {
    console.log('Starting database import...');
    
    const db = await getMongoDb();
    const exportDir = path.join(__dirname, '../exports');

    // Import applications
    const applicationsPath = path.join(exportDir, 'applications.json');
    if (fs.existsSync(applicationsPath)) {
      console.log('Importing applications...');
      const applications = JSON.parse(fs.readFileSync(applicationsPath, 'utf-8'));
      
      let inserted = 0;
      let updated = 0;
      
      for (const app of applications) {
        const existing = await db.collection('applications').findOne({ _id: app._id });
        if (existing) {
          await db.collection('applications').updateOne(
            { _id: app._id },
            { $set: app }
          );
          updated++;
        } else {
          await db.collection('applications').insertOne(app);
          inserted++;
        }
      }
      
      console.log(`Applications: ${inserted} inserted, ${updated} updated`);
    } else {
      console.log('No applications.json found, skipping...');
    }

    // Import guides
    const guidesPath = path.join(exportDir, 'guides.json');
    if (fs.existsSync(guidesPath)) {
      console.log('Importing guides...');
      const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf-8'));
      
      let inserted = 0;
      let updated = 0;
      
      for (const guide of guides) {
        const existing = await db.collection('guides').findOne({ name: guide.name });
        if (existing) {
          await db.collection('guides').updateOne(
            { name: guide.name },
            { $set: guide }
          );
          updated++;
        } else {
          await db.collection('guides').insertOne(guide);
          inserted++;
        }
      }
      
      console.log(`Guides: ${inserted} inserted, ${updated} updated`);
    } else {
      console.log('No guides.json found, skipping...');
    }

    // Import portal settings
    const portalSettingsPath = path.join(exportDir, 'portal-settings.json');
    if (fs.existsSync(portalSettingsPath)) {
      console.log('Importing portal settings...');
      const portalSettings = JSON.parse(fs.readFileSync(portalSettingsPath, 'utf-8'));
      
      const existing = await db.collection('portal_settings').findOne({});
      if (existing) {
        await db.collection('portal_settings').updateOne(
          {},
          { $set: portalSettings }
        );
        console.log('Portal settings updated');
      } else {
        await db.collection('portal_settings').insertOne(portalSettings);
        console.log('Portal settings inserted');
      }
    } else {
      console.log('No portal-settings.json found, skipping...');
    }

    console.log('\nImport completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importDatabase();
