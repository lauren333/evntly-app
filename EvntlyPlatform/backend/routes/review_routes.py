from flask import Blueprint, request, jsonify
from datetime import datetime
from config import reviews_collection, users_collection, events_collection
from utils.auth import get_current_user
from bson import ObjectId
from bson.errors import InvalidId
import re

review_routes = Blueprint('review_routes', __name__)

"""
Review-related API routes:  
    create, update, delete, and access user/event reviews.
    Uses Firebase UID strings instead of ObjectId for user references.
"""

# === CREATE REVIEW ===
@review_routes.route('/api/reviews', methods=['POST'])
def create_review():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']
        data = request.get_json()
        event_id = data.get('event_id')
        source = data.get('source')
        rating = data.get('rating')
        comment = (data.get('comment') or "").strip()
        title = data.get('title') or ""
        city = data.get("city")  
        username = data.get("username")
        event_name = data.get("event_name")  

        if not event_id or not comment:
            return jsonify({"error": "Missing event_id or comment"}), 400

        review = {
            "user_id": firebase_uid,
            "username": username,
            "event_id": event_id,
            "source": source,
            "rating": rating,
            "comment": comment,
            "title": title,
            "city": city,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "event_name": event_name,
            # "datetime_local": data.get("datetime_local"),  # <- pass it from frontend
            # "venue_name": data.get("venue_name"),          # optional
        }

        result = reviews_collection.insert_one(review)
        review['_id'] = str(result.inserted_id)
        return jsonify({"message": "Review created", "review": review})
    
    except Exception as e:
        print(f"Error creating review: {e}")
        return jsonify({"error": str(e)}), 500

# === GET REVIEWS FOR AN EVENT ===
@review_routes.route('/api/reviews/event/<event_id>', methods=['GET'])
def get_reviews_by_event(event_id):
    try:
        source = request.args.get("source")
        city = request.args.get("city")
        query = {"event_id": event_id}
        if source:
            query["source"] = source
        if city:
            # case-insensitive match on city field
            query["venue.city"] = re.compile(city, re.IGNORECASE)

        reviews = list(reviews_collection.find(query))

        for r in reviews:
          r['_id'] = str(r['_id'])
          if not r.get('username'):
            user = users_collection.find_one({"uid": r.get('user_id')})
            r['username'] = user.get('name') if user and 'name' in user else "Anonymous"
                
        return jsonify({"reviews": reviews})
    except Exception as e:
        print(f"Error fetching event reviews: {e}")
        return jsonify({"error": str(e)}), 500

# === GET REVIEWS BY USER ===
@review_routes.route('/api/reviews/user', methods=['GET'])
def get_reviews_by_user():
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']
        reviews = list(reviews_collection.find({"user_id": firebase_uid}))
        for r in reviews:
            r['_id'] = str(r['_id'])
        return jsonify({"reviews": reviews})
    except Exception as e:
        print(f"Error fetching user reviews: {e}")
        return jsonify({"error": str(e)}), 500

# === UPDATE REVIEW ===
@review_routes.route('/api/reviews/<review_id>', methods=['PATCH'])
def update_review(review_id):
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']
        data = request.get_json()
        update_data = {}

        if 'comment' in data:
            update_data['comment'] = (data['comment'] or "").strip()
        if 'rating' in data:
            update_data['rating'] = data['rating']
        if 'title' in data:
            update_data['title'] = data['title']
        if 'username' in data:
          update_data['username'] = data['username']    
              
        update_data['updated_at'] = datetime.utcnow()

        result = reviews_collection.update_one(
          {"_id": ObjectId(review_id), "user_id": firebase_uid},
          {"$set": update_data}
        )

        if result.matched_count:
          updated_review = reviews_collection.find_one({"_id": ObjectId(review_id)})
          updated_review['_id'] = str(updated_review['_id'])
          return jsonify({
              "message": "Review updated successfully",
              "review": updated_review
          })
        # if result.matched_count:
        #     return jsonify({"message": "Review updated successfully"})
        return jsonify({"error": "Review not found or unauthorized"}), 404
    except Exception as e:
        print(f"Error updating review: {e}")
        return jsonify({"error": str(e)}), 500

# === DELETE REVIEW ===
@review_routes.route('/api/reviews/<review_id>', methods=['DELETE'])
def delete_review(review_id):
    try:
        decoded_token = get_current_user()
        firebase_uid = decoded_token['uid']

        # Convert string to ObjectId
        result = reviews_collection.delete_one({
            "_id": ObjectId(review_id),
            "user_id": firebase_uid
        })

        if result.deleted_count:
            return jsonify({"message": "Review deleted successfully"})
        return jsonify({"error": "Review not found or unauthorized"}), 404
    except Exception as e:
        print(f"Error deleting review: {e}")
        return jsonify({"error": str(e)}), 500
    
# === GET EVENT ===
@review_routes.route('/api/events/<event_id>', methods=['GET'])
def get_event_by_id(event_id):
    try:
        # Try as ObjectId first
        try:
            obj_id = ObjectId(event_id)
            event = events_collection.find_one({"_id": obj_id})
        except InvalidId:
            event = events_collection.find_one({"id": event_id})  # fallback for string IDs

        if not event:
            # Gracefully "pass" by returning empty JSON instead of 404
            return jsonify({"event": None})

        event["_id"] = str(event["_id"])
        return jsonify({"event": event})

    except Exception as e:
        print(f"Error fetching event: {e}")
        # Return empty event to avoid breaking frontend
        return jsonify({"event": None})