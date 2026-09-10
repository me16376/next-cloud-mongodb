import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    const db = await getDatabase();
    const pingResult = await db.command({ ping: 1 });
    const latency = Date.now() - startTime;
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully via Vinext on Cloudflare Workers!",
      ping: pingResult,
      latencyMs: latency,
      database: db.databaseName,
      collections: collections.map((c) => c.name),
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
      },
      { status: 500 }
    );
  }
}
