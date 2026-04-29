import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB_NAME || 'nrsc_portal';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(mongoUri);
const clientPromise = global.__mongoClientPromise || client.connect();

if (!global.__mongoClientPromise) {
  global.__mongoClientPromise = clientPromise;
}

export const getMongoDb = async () => {
  const resolvedClient = await clientPromise;
  return resolvedClient.db(mongoDbName);
};
