import os
from dotenv import load_dotenv
from pymongo import MongoClient
import firebase_admin
from firebase_admin import credentials
# Configuration for the backend application, including Firebase and MongoDB setup, setting global resources. 

# Load environment variables from .env file
load_dotenv()

# ===== FIREBASE =====
# authenticate and manage user sessions 
cred = credentials.Certificate(os.getenv("FIREBASE_KEY_PATH", "popup-58392-firebase-adminsdk-fbsvc-ce1dadf2dc.json"))
firebase_admin.initialize_app(cred)

# ===== MONGODB =====
mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017/')
client = MongoClient(mongodb_uri, tlsAllowInvalidCertificates=True)
db = client.popup_db
users_collection = db.users
events_collection = db.events
reviews_collection = db.reviews

# ===== SUPPORTED CITIES =====
CITIES = ["New York", "Boston", "Washington", "Philadelphia", "Chicago", "Miami",
          "Los Angeles", "San Francisco", "Seattle", "Las Vegas", "Denver", "Toronto",
          "Montreal", "Vancouver", "Ottawa", "Amsterdam", "Vienna", "Berlin", "Brussels",
          "Stockholm", "Oslo", "Barcelona", "Madrid", "Valencia"]

def debug_db():
    print("=== MongoDB Connection Info ===")
    print(f"Connection URI: {mongodb_uri}")
    print(f"Database name: {db.name}")
    try:
        collections = db.list_collection_names()
        print(f"Collections: {collections}")
        user_count = users_collection.count_documents({})
        print(f"Total users: {user_count}")
        print("=== MongoDB Connection Successful ===")
        event_count = events_collection.count_documents({})
        print(f"Total events: {event_count}")
    except Exception as e:
        print(f"Error: {e}")
        print("=== MongoDB Connection Failed ===")