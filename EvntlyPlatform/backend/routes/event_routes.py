from flask import Blueprint, request, jsonify
import re
from config import events_collection

event_routes = Blueprint('event_routes', __name__)

"""
Event related API endpoints: 
    For fetching and interacting with event data stored in MongoDB.
"""

# == DEBUG ==
# # API endpoint to test if the backend is running  
# @event_routes.route('/api/hello')
# def hello():
#     return jsonify({"message": "Flask backend with MongoDB sync is running!"})

# == EVENTS (GET) ===
# API endpoint to fetch events from MongoDB with optional filtering by city, keyword, and category.
@event_routes.route('/api/events', methods=['GET'])
def get_events():
    try:
        city = request.args.get("city", "Madrid")
        keyword = request.args.get("keyword", "")
        category = request.args.get("category", "") 

        # Build query
        query = {}
        if city:
            query["city"] = re.compile(city, re.IGNORECASE)  # case-insensitive

        if keyword:
            query["$or"] = [
                {"title": re.compile(keyword, re.IGNORECASE)},
                {"description": re.compile(keyword, re.IGNORECASE)}
            ]
        
        # Search by category if provided
        if category:
            query["categories"] = {"$elemMatch": re.compile(category, re.IGNORECASE)}

        # Fetch filtered events from MongoDB
        events_cursor = events_collection.find(query)
        merged_events = [e for e in events_cursor]

        # Ensure _id is string to be JSON serializable
        for e in merged_events:
            e["_id"] = str(e["_id"]) if "_id" in e else None

        return jsonify({"events": merged_events})
    except Exception as e:
        print(f"Error fetching events from MongoDB: {e}")
        return jsonify({"error": str(e)}), 500