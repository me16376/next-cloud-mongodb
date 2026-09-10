import { MongoClient, Db, ObjectId } from "mongodb";

interface Env {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
}

const fallbackUri =
  "mongodb+srv://mosabber16376_db_user:46JKde1tjtpaxhOy@mosabber.8onjvem.mongodb.net/next_cloud_db?retryWrites=true&w=majority&appName=Mosabber";

let client: MongoClient | null = null;

async function getDatabase(env: Env): Promise<Db> {
  const uri = env.MONGODB_URI || fallbackUri;
  const dbName = env.MONGODB_DB || "next_cloud_db";

  if (!client) {
    client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    await client.connect();
  }
  return client.db(dbName);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = await getDatabase(context.env);
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
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    const db = await getDatabase(context.env);
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
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
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

    const db = await getDatabase(context.env);
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
  }
};
