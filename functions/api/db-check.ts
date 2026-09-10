import { MongoClient } from "mongodb";

interface Env {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
}

// Direct standard MongoDB URI without DNS SRV (Cloudflare Workers does not support DNS SRV lookups)
const fallbackUri =
  "mongodb://mosabber16376_db_user:46JKde1tjtpaxhOy@ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017/next_cloud_db?ssl=true&replicaSet=atlas-6zocl1-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Mosabber";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const startTime = Date.now();
  const uri = context.env.MONGODB_URI || fallbackUri;
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
        tip: "Ensure MongoDB Atlas Network Access has 0.0.0.0/0 whitelisted and direct replica set hosts are reachable.",
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
