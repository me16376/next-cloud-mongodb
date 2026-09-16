import { MongoClient, Db } from "mongodb";

// Shard hosts in priority order (used if DNS SRV resolution is not available on serverless edge)
const SHARD_HOSTS = [
  "ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017",
  "ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017",
  "ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017",
];

const DEFAULT_DB = "next_cloud_db";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientInstance: MongoClient | null | undefined;
}

/**
 * Creates and connects a MongoClient using direct connection to a specific shard.
 * Direct connection bypasses serverless replica set discovery multi-socket timeouts on Cloudflare.
 */
async function connectToShard(host: string, auth: string, dbName: string): Promise<MongoClient> {
  const uri = `mongodb://${auth}@${host}/${dbName}?tls=true&directConnection=true&authSource=admin&retryWrites=true&w=majority&appName=Mosabber`;

  const client = new MongoClient(uri, {
    directConnection: true,
    tls: true,
    family: 4,
    maxPoolSize: 1,
    minPoolSize: 0,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 15000,
  });

  await client.connect();
  return client;
}

export async function getClientPromise(): Promise<MongoClient> {
  const envUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;

  if (!envUri) {
    throw new Error(
      "❌ MONGODB_URI environment variable is missing! Please configure MONGODB_URI in Cloudflare Pages Settings > Variables and secrets (or .env.local locally)."
    );
  }

  // 1. If user set an explicit URI in env (e.g. direct replica set or srv), try connecting with it directly first!
  try {
    const directClient = new MongoClient(envUri, {
      tls: true,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 1,
      minPoolSize: 0,
    });
    await directClient.connect();
    global._mongoClientInstance = directClient;
    return directClient;
  } catch (err: any) {
    console.warn("⚠️ Direct URI attempt failed, trying direct shard failover with credentials from MONGODB_URI:", err.message || err);
  }

  // 2. Extract auth credentials strictly from the environment variable MONGODB_URI
  const match = envUri.match(/mongodb(?:\+srv)?:\/\/([^@]+)@/);
  if (!match || !match[1]) {
    throw new Error("❌ Invalid MONGODB_URI: Unable to extract authentication credentials from the URI.");
  }
  const auth = match[1];

  // Try hosts in priority order with failover using credentials extracted from MONGODB_URI
  let lastError: any = null;
  for (const host of SHARD_HOSTS) {
    try {
      const client = await connectToShard(host, auth, dbName);
      global._mongoClientInstance = client;
      return client;
    } catch (err: any) {
      lastError = err;
      console.warn(`Failed connecting to ${host}:`, err.message || err);
    }
  }

  throw lastError || new Error("Failed to connect to any MongoDB Atlas shard host with provided credentials.");
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;
  const client = await getClientPromise();
  return client.db(dbName);
}

export default getClientPromise;
