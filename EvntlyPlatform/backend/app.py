# Standard library
import os, json

# Third-party
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS

# Local modules
from routes.user_routes import user_routes
from routes.event_routes import event_routes
from routes.review_routes import review_routes

from config import debug_db

# dont remove these despite looking inactive, they are used frequently
from services.events_pipeline import refresh_all_events, refresh_events_by_cities 
from services.madrid_xml_backup import (
    fetch_madrid_events_xml,
    get_madrid_events_only,
    test_madrid_xml_parsing
)

from tests.rawevents_debug import (
    fetch_nyc_events_debug,
    fetch_ticketmaster_debug,
    fetch_seatgeek_debug,
    fetch_madrid_events_debug,
    fetch_madrid_events_xml_debug
)

app = Flask(__name__)
# CORS(app, origins=r"http://localhost:\d+", supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Register user, review, and event related routes from Blueprint 
app.register_blueprint(user_routes)
app.register_blueprint(event_routes)
app.register_blueprint(review_routes)

# DEBUG: Check MongoDB connection and collections  
debug_db() 

if __name__ == '__main__':
    # print("=== Fetching Madrid events ===")
    # events = fetch_madrid_events()
    # for e in events[:5]:  # Print first 5 events
    #     print(e)
    # print("=== Done fetching events ===\n")
    # app.run(debug=True, port = 5000)

    # print("=== Raw json of events  (tests/debug_fetch) ===")
    # fetch_nyc_events_debug(size=15, output_file="nyc_events_debug.json")
    # fetch_ticketmaster_debug(size=15, output_file="tm_debug.json")
    # fetch_seatgeek_debug(size=15, output_file="sg_debug.json")
    # fetch_madrid_events_debug(size=15, output_file="madrid_events_debug.json")
    
    # print("=== Debug Madrid event parsing (JSON can be empty, so XML is used as fallback)===")
    # fetch_madrid_events_xml_debug()
    # test_madrid_xml_parsing()
    # get_madrid_events_only()

    # print("=== Refreshing by city events in the database (services/events_pipeline.py) ===")
    # refresh_events_by_cities(["New York"])

    # Force update the backend after awhile because background scheduker only when server is running at 1 week date
    # refresh_all_events()
#     refresh_events_by_cities([
#     "New York", "Boston", "Washington", "Philadelphia",
#     "Chicago", "Miami", "Los Angeles", "San Francisco",
#     "Seattle", "Las Vegas", "Denver",
#     "Toronto", "Montreal", "Vancouver", "Ottawa",
#     "Amsterdam", "Vienna", "Berlin", "Brussels",
#     "Stockholm", "Oslo", "Barcelona", "Valencia"
# ])
    # refresh_events_by_cities(["New York"])

    app.run(debug=True, host="0.0.0.0", port=5000)
