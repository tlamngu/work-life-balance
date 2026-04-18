import { MongoClient, ServerApiVersion } from 'mongodb';

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const DEFAULT_DB_NAME = 'energy_bar';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? DEFAULT_DB_NAME;

let clientPromise = global.mongoClientPromise;

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    clientPromise = client.connect();

    if (process.env.NODE_ENV !== 'production') {
      global.mongoClientPromise = clientPromise;
    }
  }

  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}
