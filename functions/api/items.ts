import { MongoClient, ObjectId } from "mongodb";

interface Env {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
}

const directUri =
  "mongodb://mosabber16376_db_user:46JKde1tjtpaxhOy@ac-odtentf-shard-00-00.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-01.8onjvem.mongodb.net:27017,ac-odtentf-shard-00-02.8onjvem.mongodb.net:27017/next_cloud_db?ssl=true&replicaSet=atlas-6zocl1-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Mosabber";

function getCleanUri(envUri?: string): string {
  if (!envUri || envUri.startsWith("mongodb+srv://")) {
    return directUri;
  }
  return envUri;
}

function createClient(env: Env): { client: MongoClient; dbName: string } {
  const uri = getCleanUri(env.MONGODB_URI);
  const dbName = env.MONGODB_DB || "next_cloud_db";
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 1,
  });
  return { client, dbName };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { client, dbName } = createClient(context.env);
  try {
    await client.connect();
    const db = client.db(dbName);
    const items = await db
      .collection("items")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        data: items,
        count: items.length,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch items",
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { client, dbName } = createClient(context.env);
  try {
    const body: any = await context.request.json();
    const { title, description, category } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Title is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    await client.connect();
    const db = client.db(dbName);
    const newItem = {
      title: title.trim(),
      description: (description || "").trim(),
      category: (category || "General").trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("items").insertOne(newItem);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Item created successfully in MongoDB via Cloudflare Function!",
        insertedId: result.insertedId,
        data: {
          _id: result.insertedId,
          ...newItem,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to insert item",
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { client, dbName } = createClient(context.env);
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Item ID is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection("items").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Item not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Item deleted successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to delete item",
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
