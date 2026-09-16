import sys
import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Load variables from .env.local if present
load_dotenv(".env.local")

uri = os.getenv("MONGODB_URI")
if not uri:
    print("❌ [ERROR] MONGODB_URI environment variable is not set! Please set it in .env.local")
    sys.exit(1)
db_name = os.getenv("MONGODB_DB", "next_cloud_db")

print(f"Connecting to MongoDB Atlas ({db_name})...")

client = MongoClient(
    uri,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=8000
)

try:
    # 1. Ping the database
    ping = client.admin.command("ping")
    print(f"[OK] Connection Successful! Ping: {ping}")

    # 2. Access database & collection
    db = client[db_name]
    items_collection = db["items"]
    
    # 3. Read documents
    count = items_collection.count_documents({})
    print(f"[INFO] Total documents in 'items': {count}")
    
    # 4. Fetch recent documents
    print("\nRecent Documents:")
    for item in items_collection.find().sort("createdAt", -1).limit(5):
        print(f" - [{item.get('category', 'General')}] {item.get('title')}: {item.get('description', '')}")

except Exception as e:
    print(f"[ERROR] Connection Error: {e}")
finally:
    client.close()
    print("\nConnection closed.")
