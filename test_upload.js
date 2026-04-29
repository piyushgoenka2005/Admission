/* Simple MongoDB connectivity test */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'nrsc_portal';

async function run() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Connected to MongoDB. Collections:', collections.map((c) => c.name));
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
