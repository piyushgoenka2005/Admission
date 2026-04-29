const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'nrsc_portal';

async function fixDuplicates() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('guides');

    console.log('Finding all guides...');
    const allGuides = await col.find().toArray();
    console.log(`Total guides: ${allGuides.length}`);

    // Show all guides with same name but different normalized names
    const guidesByName = {};
    allGuides.forEach((guide) => {
      const name = guide.name;
      if (!guidesByName[name]) {
        guidesByName[name] = [];
      }
      guidesByName[name].push(guide);
    });

    console.log('\nGuides with duplicates:');
    for (const [name, guides] of Object.entries(guidesByName)) {
      if (guides.length > 1) {
        console.log(`\n  "${name}" has ${guides.length} entries:`);
        guides.forEach((g, idx) => {
          console.log(`    [${idx}] normalized_name: "${g.normalized_name}", updated_at: ${g.updated_at || 'N/A'}`);
        });

        // Keep the one with the most recent updated_at, delete others
        const sorted = guides.sort((a, b) => {
          const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
          const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
          return bTime - aTime;
        });

        console.log(`    Keeping: normalized_name "${sorted[0].normalized_name}" (most recent)`);
        console.log(`    Deleting ${sorted.length - 1} older entries...`);

        for (let i = 1; i < sorted.length; i++) {
          const result = await col.deleteOne({ _id: sorted[i]._id });
          console.log(`      Deleted: normalized_name "${sorted[i].normalized_name}" (${result.deletedCount} deleted)`);
        }
      }
    }

    console.log('\n✓ Cleanup complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixDuplicates();
