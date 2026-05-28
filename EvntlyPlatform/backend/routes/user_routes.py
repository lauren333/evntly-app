from flask import Blueprint, request, jsonify
from datetime import datetime
from config import users_collection, events_collection
from utils.auth import get_current_user

"""
User-related API routes: 
    sync, preferences, location, accessibility filters, and saved events
    Frontend HTTP request (client) → Flask route **GET/POST** (Server) → MongoDB query (Database) → Flask returns JSON response back to client 
"""

user_routes = Blueprint('user_routes', __name__)

# === USER SYNC (POST) ===
# This endpoint is called by the frontend after Firebase authentication to sync user data with MongoDB. 
# The endpoint also handles CORS preflight requests with an OPTIONS method.
@user_routes.route('/api/sync-user', methods=['OPTIONS'])
def options_sync_user():
    return '', 200

@user_routes.route('/api/sync-user', methods=['POST'])
def sync_user():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        # Parse incoming JSON (fallback to form data) so `data` is defined
        data = request.get_json(silent=True) or {}
        if not data and request.form:
            data = request.form.to_dict()

        # Fetch user data from Firebase
        user_data = {
            "uid": firebase_uid,
            "email": decoded_token.get('email'),
            "name": data.get('name') or decoded_token.get('name'),
            "picture": decoded_token.get('picture'),
            "auth_provider": decoded_token.get('firebase', {}).get('sign_in_provider', 'password')
        }

        # Check if user exists in MongoDB
        existing_user = users_collection.find_one({"uid": firebase_uid})

        if existing_user:  
            # Update existing user
            users_collection.update_one(
                {"uid": firebase_uid},
                {"$set": {
                    "email": user_data["email"],
                    "name": user_data["name"],
                    "picture": user_data["picture"],
                    "auth_provider": user_data["auth_provider"],
                    }
                }
            )
            existing_user['_id'] = str(existing_user['_id'])
            return jsonify({
                "message": "User synchronized successfully", 
                "user": existing_user,
                "action": "updated"
            })
        else:
            # Create new user
            new_user = {
                **user_data,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile_complete": False,                
                "preferences": [],                      # empty array initially
                "location": [],                         # empty array initially
                "saved_events": [],                      # empty array initially
                "accessibility_filters": [],            # empty array initially
            }

            result = users_collection.insert_one(new_user)
            new_user['_id'] = str(result.inserted_id)

            return jsonify({
                "message": "User synchronized successfully", 
                "user": new_user,
                "action": "created"
            })
    except Exception as e:
        print(f"MongoDB sync error: {e}")
        return jsonify({"error": "Failed to synchronize user", "details": str(e)}), 500


# === USER PREFERENCES OF EVENT CATEGORIES (GET/POST) ===
@user_routes.route('/api/user/preferences', methods=['POST'])
def save_preferences():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        data = request.json
        preferences = request.json.get('preferences', [])
        if not preferences:
            return jsonify({"error": "No preferences provided"}), 400
        
       # Update user preferences in MongoDB
        result = users_collection.update_one(
            {"uid": firebase_uid},
            {"$set": {
                "preferences": preferences,
                "profile_complete": True,
                "updated_at": datetime.utcnow()
                }
            }
        )
        if result.modified_count:
            return jsonify({"message": "Preferences saved successfully"})
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        # Handle any errors that occur during the process
        print(f"Error saving preferences: {e}")
        return jsonify({"error": str(e)}), 500
    
@user_routes.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        # Fetch user preferences from MongoDB
        user = users_collection.find_one({"uid": firebase_uid}, {"_id": 0, "preferences": 1})
        if user:
            return jsonify({
                "preferences": user.get("preferences", []),
                "profile_complete": user.get("profile_complete", False),
                })
        else:
            return jsonify({"error": "User not found"}), 404
        
    except Exception as e:
        print(f"Error fetching preferences: {e}")
        return jsonify({"error": str(e)}), 500


# === USER LOCATION (GET/POST)===
@user_routes.route('/api/user/location', methods=['POST'])
def save_user_location():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        data = request.json
        location = request.json.get('location', [])
        if not location:
            return jsonify({"error": "No location provided"}), 400
        
       # Update user preferences in MongoDB
        result = users_collection.update_one(
            {"uid": firebase_uid},
            {"$set": {
                "location": location,
                "profile_complete": True,
                "updated_at": datetime.utcnow()
                }
            }
        )
        if result.modified_count:
            return jsonify({"message": "Location saved successfully"})
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        # Handle any errors that occur during the process
        print(f"Error saving location: {e}")
        return jsonify({"error": str(e)}), 500

@user_routes.route('/api/user/location', methods=['GET'])
def get_user_location():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        # Fetch user preferences from MongoDB
        user = users_collection.find_one({"uid": firebase_uid}, {"_id": 0, "location": 1})
        if user:
            return jsonify({
                "location": user.get("location", []),
                "profile_complete": user.get("profile_complete", False),
                })
        else:
            return jsonify({"error": "User not found"}), 404
        
    except Exception as e:
        print(f"Error fetching location: {e}")
        return jsonify({"error": str(e)}), 500
    

# === USER ACCESSIBILITY FILTERS (GET/POST)===
@user_routes.route('/api/user/accessibility-filters', methods=['POST'])
def save_accessibility_filters():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        data = request.json
        filters = data.get('filters', [])
        if not isinstance(filters, list):
            return jsonify({"error": "Filters must be a list"}), 400

        result = users_collection.update_one(
            {"uid": firebase_uid},
            {"$set": {
                "accessibility_filters": filters,
                "updated_at": datetime.utcnow()
            }}
        )

        if result.matched_count:
            return jsonify({"message": "Accessibility filters saved successfully"})
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error saving accessibility filters: {e}")
        return jsonify({"error": str(e)}), 500

@user_routes.route('/api/user/accessibility-filters', methods=['GET'])
def get_accessibility_filters():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        user = users_collection.find_one(
            {"uid": firebase_uid}, {"_id": 0, "accessibility_filters": 1}
        )

        if user is not None:
            return jsonify({"filters": user.get("accessibility_filters", [])})
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error fetching accessibility filters: {e}")
        return jsonify({"error": str(e)}), 500


# === USERS SAVED EVENTS (GET/POST)===
@user_routes.route('/api/user/saved-events', methods=['POST'])
def save_event():
    decoded_token = get_current_user()
    firebase_uid = decoded_token['uid']

    data = request.json
    event_id = data.get("id")
    source = data.get("source")
    action = data.get("action", "add")  # "add" or "remove"

    if not event_id or not source:
        return jsonify({"error": "Missing event id or source"}), 400

    # Ensure the user exists
    user = users_collection.find_one({"uid": firebase_uid})
    if not user:
        user = {
            "uid": firebase_uid,
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "auth_provider": decoded_token.get('firebase', {}).get('sign_in_provider', 'password'),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "saved_events": [],
        }
        users_collection.insert_one(user)

    saved_events = user.get("saved_events", [])

    if action == "add":
        if not any(e["id"] == event_id and e["source"] == source for e in saved_events):
            saved_events.append({"id": event_id, "source": source, "saved_at": datetime.utcnow()})
    elif action == "remove":
        saved_events = [e for e in saved_events if not (e["id"] == event_id and e["source"] == source)]

    users_collection.update_one({"uid": firebase_uid}, {"$set": {"saved_events": saved_events}})
    return jsonify({"saved_events": saved_events})

@user_routes.route('/api/user/saved-events', methods=['GET'])
def get_saved_events():
    from services.events_pipeline import normalize_event
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        # Fetch the user from MongoDB
        user = users_collection.find_one({"uid": firebase_uid})
        if not user or not user.get("saved_events"):
            return jsonify({"saved_events": []})

        saved_events_refs = user.get("saved_events", [])

        # Build a query to fetch all saved events from MongoDB at once
        query = {
            "$or": [
                {"source": ref["source"], "id": ref["id"]} 
                for ref in saved_events_refs
            ]
        }

        if not query["$or"]:
            return jsonify({"saved_events": []})

        events_cursor = events_collection.find(query)
        events_map = { (e["source"], e["id"]) : e for e in events_cursor }

        # Reattach saved_at timestamps from user's saved_events list
        full_saved_events = []
        for ref in saved_events_refs:
            key = (ref["source"], ref["id"])
            event = events_map.get(key)
            if event:
                event["_id"] = str(event["_id"]) if "_id" in event else None
                event["saved_at"] = ref.get("saved_at")
                full_saved_events.append(normalize_event(event))

        # Sort by saved_at descending (most recent first)
        full_saved_events.sort(key=lambda e: e.get("saved_at") or datetime.min, reverse=True)

        return jsonify({"saved_events": full_saved_events})

    except Exception as e:
        print(f"Error fetching saved events: {e}")
        return jsonify({"error": str(e)}), 500    