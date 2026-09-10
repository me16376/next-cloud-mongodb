import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    const db = await getDatabase();
    // Ping database
    const pingResult = await db.command({ ping: 1 });
    const latency = Date.now() - startTime;

    // Get collection stats or list collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully via Cloudflare Function edge runtime!",
      ping: pingResult,
      latencyMs: latency,
      database: db.databaseName,
      collections: collectionNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to MongoDB",
        error: error.message || String(error),
        latencyMs: latency,
        tip: "Ensure MongoDB Atlas Network Access has 0.0.0.0/0 whitelisted and MONGODB_URI is set correctly.",
      },
      { status: 500 }
    );
  }
}
