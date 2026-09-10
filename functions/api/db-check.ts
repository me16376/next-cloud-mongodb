import { MongoClient } from "mongodb";

interface Env {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
}

// Direct standard MongoDB URI without DNS SRV (Cloudflare Workers does not support DNS SRV lookups)
const directUri =
  "mongodb://mosabber16376_db_user:46JKde1tjtpaxhOy@ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017/next_cloud_db?ssl=true&replicaSet=atlas-6zocl1-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Mosabber";

function getCleanUri(envUri?: string): string {
  // If envUri is missing OR if it uses mongodb+srv (which Cloudflare cannot resolve due to lack of DNS SRV support),
  // automatically use the working direct replica set connection string!
  if (!envUri || envUri.startsWith("mongodb+srv://")) {
    return directUri;
  }
  return envUri;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const uri = getCleanUri(context.env.MONGODB_URI);
  const dbName = context.env.MONGODB_DB || "next_cloud_db";

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 1,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const pingResult = await db.command({ ping: 1 });
    const latency = Date.now() - startTime;
    const collections = await db.listCollections().toArray();

    return new Response(
      JSON.stringify({
        success: true,
        message: "MongoDB connected successfully via Cloudflare Pages Function!",
        ping: pingResult,
        latencyMs: latency,
        database: db.databaseName,
        collections: collections.map((c) => c.name),
        connectionType: uri.includes("+srv") ? "SRV" : "Direct ReplicaSet",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to connect to MongoDB",
        error: error.message || String(error),
        latencyMs: latency,
        rawEnvHadSrv: Boolean(context.env.MONGODB_URI?.startsWith("mongodb+srv://")),
        tip: "Ensure MongoDB Atlas Network Access has 0.0.0.0/0 whitelisted.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } finally {
    context.waitUntil(client.close().catch(() => {}));
  }
};
