import { MongoClient, Db } from "mongodb";

const fallbackUri =
  "mongodb://mosabber16376_db_user:46JKde1tjtpaxhOy@ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017/next_cloud_db?ssl=true&replicaSet=atlas-6zocl1-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Mosabber";

let client: MongoClient | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || fallbackUri;
  const isDirect = uri.includes("directConnection=true");

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      connectTimeoutMS: 15000,
      socketTimeoutMS: 20000,
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 1,
      ...(isDirect ? { directConnection: true } : {}),
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DB || "next_cloud_db";
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}

export default getClientPromise;
