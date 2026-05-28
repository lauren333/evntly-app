from flask import request, jsonify
import firebase_admin
from firebase_admin import auth

""" 
Authentication:
   - Verifies Firebase ID tokens from frontend requests.
   - Returns decoded user info or a JSON error if invalid/expired.
"""

def get_current_user():
    try:
        # Get Firebase token from frontend
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        id_token = auth_header.replace('Bearer ', '')

        # Verify the token with Firebase
        decoded_token = auth.verify_id_token(id_token)
        firebase_uid = decoded_token['uid']

        # You can return the full decoded token or just UID
        return decoded_token

    except Exception as e:
        # Always return JSON if token is invalid or expired
        return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401