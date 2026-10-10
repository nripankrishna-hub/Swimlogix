import os
import sys
try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo is required. Please install it using: pip install pymongo")
    sys.exit(1)

# Configuration
MONGO_URI = "mongodb://127.0.0.1:27017/swimlogix"
DB_NAME = "swimlogix"

def wipe_database():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    print(f"Connected to database: {DB_NAME}")
    
    # 1. Clear all data from other collections completely
    collections_to_drop = [
        "institutions",
        "batches",
        "attendances",
        "swimtests",
        "studentprofiles",
        "notifications",
        "otps"
    ]
    
    for coll in collections_to_drop:
        if coll in db.list_collection_names():
            result = db[coll].delete_many({})
            print(f"Cleared {result.deleted_count} documents from '{coll}'.")
        else:
            print(f"Collection '{coll}' does not exist (skipping).")
            
    # 2. Clear Users, but keep superadmin
    if "users" in db.list_collection_names():
        result = db["users"].delete_many({"role": {"$ne": "superadmin"}})
        print(f"Cleared {result.deleted_count} non-superadmin documents from 'users'.")
        
        superadmins = db["users"].count_documents({"role": "superadmin"})
        print(f"Kept {superadmins} superadmin(s) in 'users'.")

    print("\nDatabase wipe complete! Clean state ready.")
    client.close()

if __name__ == "__main__":
    confirm = input("WARNING: This will delete ALL data except superadmins. Type 'YES' to confirm: ")
    if confirm == "YES":
        wipe_database()
    else:
        print("Operation cancelled.")
