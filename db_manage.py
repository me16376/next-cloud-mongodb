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

load_dotenv(".env.local")

fallback_uri = (
    "mongodb+srv://mosabber16376_db_user:46JKde1tjtpaxhOy@mosabber.8onjvem.mongodb.net/"
    "next_cloud_db?retryWrites=true&w=majority&appName=Mosabber"
)
uri = os.getenv("MONGODB_URI", fallback_uri)
db_name = os.getenv("MONGODB_DB", "next_cloud_db")

def get_db():
    client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=8000)
    return client, client[db_name]

def ping():
    client, db = get_db()
    try:
        res = client.admin.command("ping")
        print(f"✅ MongoDB Atlas Connected! Ping: {res}")
    finally:
        client.close()

def list_items():
    client, db = get_db()
    try:
        items = list(db["items"].find().sort("createdAt", -1).limit(10))
        print(f"\n📦 Found {len(items)} items:")
        for item in items:
            print(f" - ID: {item.get('_id')} | [{item.get('category', 'General')}] {item.get('title')}: {item.get('description')}")
    finally:
        client.close()

def add_item(title: str, description: str, category: str = "Python"):
    from datetime import datetime
    client, db = get_db()
    try:
        doc = {
            "title": title,
            "description": description,
            "category": category,
            "createdAt": datetime.utcnow().isoformat()
        }
        res = db["items"].insert_one(doc)
        print(f"✅ Successfully inserted document with ID: {res.inserted_id}")
    finally:
        client.close()

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] == "ping":
        ping()
    elif args[0] == "list":
        list_items()
    elif args[0] == "add" and len(args) >= 3:
        add_item(args[1], args[2], args[3] if len(args) > 3 else "Python")
    else:
        print("Usage:")
        print("  python db_manage.py ping")
        print("  python db_manage.py list")
        print("  python db_manage.py add \"Title\" \"Description\" [Category]")
