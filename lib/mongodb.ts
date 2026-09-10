import { MongoClient, Db } from "mongodb";

// Shard hosts in priority order (shard-00-02 is currently the primary)
const SHARD_HOSTS = [
  "ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017",
  "ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017",
  "ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017",
];

const DEFAULT_AUTH = "mosabber16376_db_user:46JKde1tjtpaxhOy";
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
  const uri = `mongodb://${auth}@${host}/${dbName}?authSource=admin&retryWrites=true&w=majority&appName=Mosabber`;

  const client = new MongoClient(uri, {
    directConnection: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    family: 4,
    maxPoolSize: 1,
    minPoolSize: 0,
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 8000,
  });

  await client.connect();
  return client;
}

export async function getClientPromise(): Promise<MongoClient> {
  // If we already have an active client, verify it's still alive
  if (global._mongoClientInstance) {
    try {
      await global._mongoClientInstance.db("admin").command({ ping: 1 });
      return global._mongoClientInstance;
    } catch {
      // Stale or closed socket from previous serverless invocation
      try {
        await global._mongoClientInstance.close();
      } catch {
        // ignore
      }
      global._mongoClientInstance = null;
    }
  }

  const envUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;

  // 1. If user set an explicit URI in env (e.g. mongodb+srv://), try connecting with it directly first!
  if (envUri) {
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
      console.warn("⚠️ Direct URI (SRV) attempt failed, trying direct shard failover:", err.message || err);
    }
  }

  let auth = DEFAULT_AUTH;
  if (envUri) {
    const match = envUri.match(/mongodb(?:\+srv)?:\/\/([^@]+)@/);
    if (match && match[1]) {
      auth = match[1];
    }
  }

  // Try hosts in priority order with failover
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

  throw lastError || new Error("Failed to connect to any MongoDB Atlas shard host");
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DB || DEFAULT_DB;
  const client = await getClientPromise();
  return client.db(dbName);
}

export default getClientPromise;
