import { MongoClient } from "mongodb";

interface Env {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
}

const fallbackUri =
  "mongodb+srv://mosabber16376_db_user:46JKde1tjtpaxhOy@mosabber.8onjvem.mongodb.net/next_cloud_db?retryWrites=true&w=majority&appName=Mosabber";

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
