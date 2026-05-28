import os, re, json, html
from datetime import datetime, timedelta
import requests
from config import events_collection
from services.madrid_xml_backup import fetch_madrid_events_xml
from services.event_classifier_ml.event_classifier import classify_events, SPANISH_CITIES
from utils.helpers import load_ignore_keywords
from utils.helpers import clean_html_description
# import csv
# import requests
# from io import StringIO
# from datetime import datetime
import xmltodict
import requests
from datetime import datetime
IGNORE_KEYWORDS = load_ignore_keywords()
CITIES = [ "New York","Boston","Washington","Philadelphia","Chicago","Miami","Los Angeles","San Francisco","Seattle","Las Vegas","Denver","Toronto","Montreal","Vancouver","Ottawa","Amsterdam","Vienna","Berlin","Brussels","Stockholm","Oslo","Barcelona","Madrid","Valencia"]

"""
Fetches and processes events from multiple sources (Madrid, NYC, Ticketmaster, SeatGeek),
normalizes and filters them, classifies with Naive Bayes, and stores them in MongoDB.
"""

# ------------------- Utility functions -------------------
def normalize_event(event):
    # Ensure description is always a string
    event["description"] = event.get("description") or ""

    # Ensure accessibility is always a list
    acc = event.get("accessibility")
    if isinstance(acc, list):
        # Filter out numbers (or numeric strings)
        event["accessibility"] = [str(a) for a in acc if not str(a).isdigit()]
    else:
        acc_str = str(acc) if acc is not None else ""
        # If it's comma-separated codes like "1,6", split and filter
        parts = [part.strip() for part in acc_str.split(",")] if "," in acc_str else [acc_str]
        event["accessibility"] = [p for p in parts if p and not p.isdigit()]
        
    # Ensure performers is always a list
    if "performers" not in event or not event["performers"]:
        event["performers"] = []

    # Ensure datetime_local is a string
    event["datetime_local"] = event.get("datetime_local") or ""

    # Ensure venue keys exist
    event["venue"] = event.get("venue") or {}
    for k in ["name", "city", "street_address"]:
        event["venue"][k] = event["venue"].get(k) or ""

    event["time"] = event.get("time") or ""
    if event["time"]:
        try:
            dt = datetime.strptime(event["time"].split(".")[0], "%H:%M:%S")
            event["time"] = dt.strftime("%H:%M")
        except ValueError:
            pass
    if event["time"] == "00:00":
        event["time"] = ""
     
    return event

def filter_events(events):
    filtered = []
    seen_events = []

    for e in events:
        title = (e.get("title") or "").lower().strip()
        venue_name = (e.get("venue", {}).get("name") or "").lower().strip()
        if not title:
            continue

        if any(kw in title for kw in IGNORE_KEYWORDS):
            continue

        if "vip" in title:
            continue

        if "comfort" in title:
            continue

        skip = False
        words = set(title.split())
        for seen in seen_events:
            seen_title_words = set(seen["title"].split())
            seen_venue = seen["venue"]
            if venue_name != seen_venue:
                continue
            if not words or not seen_title_words:
                continue
            overlap_ratio = len(words & seen_title_words) / min(len(words), len(seen_title_words))
            if overlap_ratio > 0.5:
                skip = True
                break
        if skip:
            continue

        seen_events.append({"title": title, "venue": venue_name})
        filtered.append(e)

    return filtered

# ------------------- Fetching functions -------------------

# MADRID_EVENTS_URL = "https://datos.madrid.es/egob/catalogo/206974-0-agenda-eventos-culturales-100.json"
# MADRID_EVENTS_URL = "https://datos.madrid.es/dataset/206974-0-agenda-eventos-culturales-100/resource/206974-0-agenda-eventos-culturales-100-json/download/206974-0-agenda-eventos-culturales-100-json.json"
MADRID_EVENTS_URL = "https://datos.madrid.es/dataset/300107-0-agenda-actividades-eventos/resource/300107-5-agenda-actividades-eventos-json/download/300107-5-agenda-actividades-eventos-json.json"
def fetch_madrid_events():
    response = requests.get(MADRID_EVENTS_URL)
    response.raise_for_status()
    raw_text = response.text

    # Remove control characters that break JSON
    clean_text = re.sub(r'[\x00-\x1f]', '', raw_text)
    
    data = json.loads(clean_text)
    
    events = data.get("@graph", [])  # adjust if your JSON uses a different key
    
    def parse_event(event):
        dtstart = event.get("dtstart")
        if dtstart:
            parts = dtstart.split(" ")
            date_part = parts[0]  # only the date
            time_part = parts[1] if len(parts) > 1 else None
            if time_part:
                time_part = time_part.split(".")[0]  # remove any ".0"
        else:
            date_part = None
            time_part = None
        
        end_date_part = event.get("dtend", "").split(" ")[0] if event.get("dtend") else None
        venue_name = event.get("event-location") or event.get("organization")
        
        return {
            "source": "Ayuntamiento de Madrid",
            "id": event.get("id"),
            "title": event.get("title"),
            "description": event.get("description"),
            "free": bool(event.get("free")),
            "price": event.get("price"),
            "datetime_local"  : date_part, 
            "end_date": end_date_part,
            "venue": {
                "name": venue_name,
                "city": "Madrid",
                "street_address": event.get("address", {}).get("area", {}).get("street-address"), 
            },
            "time": event.get("time"),
            "link": event.get("link"),
            "location_name": event.get("event-location"),
            "latitude": event.get("location", {}).get("latitude"),
            "longitude": event.get("location", {}).get("longitude"),
            "organization": event.get("organization", {}).get("organization-name"),
            "url": event.get("link"),
            "accessibility": event.get("organization", {}).get("accesibility")
        }
    
    return [parse_event(e) for e in events]

def fetch_nyc_events(size=50, keyword=""):
    """
    Fetch events from NYC.gov Event Calendar API with robust error handling
    """
    nyc_api_key = os.getenv("NYC_GOV_API_KEY")

    if not nyc_api_key:
        print("NYC Gov API key not found in environment variables")
        return []
    
    endpoint = "https://api.nyc.gov/calendar/discover"
    headers = {
        "Ocp-Apim-Subscription-Key": nyc_api_key,
        "Accept": "application/json"
    }
    
    params = {
        "limit": min(size, 50),
        "offset": 0
    }
    
    if keyword:
        params["q"] = keyword
    
    try:
        print(f"=== FETCHING NYC EVENTS ===")
        response = requests.get(endpoint, headers=headers, params=params, timeout=10)
        print(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        items = data.get("items", [])
        print(f"Found {len(items)} items in response")
        # See what fields the API returns
        print("Response keys:", data.keys())

        # Try to find total available events
        total_events = (
            data.get("total")
            or data.get("count")
            or data.get("pagination", {}).get("total")
            or data.get("meta", {}).get("total")
        )

        if total_events:
            print(f"Total NYC events available in API: {total_events}")

        items = data.get("items", [])
        print(f"Fetched {len(items)} items in this request")
        
        events = []
        
        for index, item in enumerate(items[:size]):
            # Skip non-dictionary items
            if not isinstance(item, dict):
                continue
            
            try:
                print(
                    f"Processing item {index}: "
                    f"{item.get('name', 'Unnamed')} | "
                    f"Date: {item.get('startDate', 'No date found')}"
                )
                
                # Safe field access with type checking
                title = item.get("name", "Untitled Event")
                
                # Parse date and time safely
                start_datetime_str = item.get("startDate")
                datetime_local = None
                time_display = None
                
                if start_datetime_str and isinstance(start_datetime_str, str):
                    try:
                        start_dt = datetime.fromisoformat(start_datetime_str.replace('Z', '+00:00'))
                        datetime_local = start_dt.strftime("%Y-%m-%d")
                        time_display = start_dt.strftime("%H:%M")
                    except ValueError:
                        datetime_local = item.get("datePart", start_datetime_str[:10])
                
                # # SAFE LOCATION ACCESS - handle case where location might be string or dict
                location_data = item.get("location", {})
                if not isinstance(location_data, dict):
                    location_data = {}  # Reset to empty dict if it's not a dict
                
                venue_name = item.get("location", "Various Locations")
                borough = location_data.get("borough", "") if isinstance(location_data, dict) else ""
                address = item.get("address", "")
                
                # SAFE ORGANIZATION ACCESS
                organization_data = item.get("organization", {})
                if not isinstance(organization_data, dict):
                    organization_data = {}
                
                org_name = organization_data.get("name") if isinstance(organization_data, dict) else None
                
                # Build categories safely
                raw_categories = item.get("categories", "")
                if isinstance(raw_categories, str):
                    categories = [c.strip() for c in raw_categories.split(",") if c.strip() and c.strip().lower() != "general events"]
                else:
                    categories = []
                    
                raw_description = (
                    item.get("desc")
                    or item.get("shortDesc")
                    or item.get("description")
                    or ""
                ) 
                # Create event object with safe field access
                event = {
                    "source": "nyc_gov",
                    "id": f"nyc_{item.get('id', item.get('guid', ''))}",
                    "title": title,
                    "datetime_local": datetime_local,
                    "time": time_display,
                    "venue": {
                        "name": venue_name if isinstance(venue_name, str) else str(venue_name),
                        "city": "New York",
                        "street_address": address,
                        "borough": borough,
                    },
                    "description": clean_html_description(raw_description),
                    "categories": categories,
                    "url": item.get("permalink"),
                    "image": item.get("imageUrl"),
                    "accessibility": [],
                    "is_free": item.get("isFree", False),
                    "organization": org_name
                }
                
                # Add formatted time display if available
                time_part = item.get("timePart")
                if time_part and isinstance(time_part, str):
                    event["time_display"] = time_part
                
                # Clean None values
                event = {k: v for k, v in event.items() if v is not None}
                events.append(event)
                print(f"✓ Successfully processed: {title}")
                
            except Exception as e:
                print(f"✗ Error processing item {index}: {e}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                # Print the problematic item for debugging
                print(f"Problematic item keys: {list(item.keys())}")
                continue
        
        print(f"Successfully processed {len(events)} NYC events")
        return events
        
    except Exception as e:
        print(f"Error fetching NYC events: {e}")
        return []

# for madrid events we must extract category from description bc they dont have that data in the api
def extract_category(description: str):
    if not description:
        return []

    match = re.search(r"Categoría:\s*([^\.]+)", description, re.IGNORECASE)
    if not match:
        return []

    category = match.group(1).strip()

    # handle multiple categories like "Teatro, Cine"
    return [c.strip() for c in category.split(",") if c.strip()]

def update_events_in_db(city="Madrid", keyword=""):
    """
    Fetch events dynamically (Ticketmaster, SeatGeek, Madrid, NYC) and store them in MongoDB.
    This preserves the exact structure your frontend expects.
    """
    merged_events = []

    # --- TICKETMASTER ---
    try:
        tm_api_key = os.getenv("TICKETMASTER_API_KEY")
        if tm_api_key:
            tm_url = "https://app.ticketmaster.com/discovery/v2/events.json"
            tm_params = {
                "apikey": tm_api_key,
                "city": city,
                "keyword": keyword,
                "size": 15
            }
            tm_response = requests.get(tm_url, params=tm_params)
            tm_response.raise_for_status()
            tm_data = tm_response.json()

            for event in tm_data.get("_embedded", {}).get("events", []):
                accessibility_info = []
                accessibility = event.get("accessibility")
                if accessibility:
                    info = accessibility.get("info")
                    additional = accessibility.get("additionalInfo")
                    if info and info.strip():
                        accessibility_info.append(info.strip())
                    if additional and additional.strip():
                        accessibility_info.append(additional.strip())

                # Build categories from Ticketmaster classifications
                categories = []
                for c in event.get("classifications", []):
                    segment = c.get("segment", {}).get("name")
                    genre = c.get("genre", {}).get("name")
                    subgenre = c.get("subGenre", {}).get("name")
                    if segment:
                        categories.append(segment)
                    if genre:
                        categories.append(genre)
                    if subgenre:
                        categories.append(subgenre)

                merged_events.append({
                    "source": "ticketmaster",
                    "id": event.get("id"),
                    "title": event.get("name"),
                    "datetime_local": event.get("dates", {}).get("start", {}).get("localDate"),
                    "end_date": event.get("dates", {}).get("end", {}).get("localDate"),
                    "time": event.get("dates", {}).get("start", {}).get("localTime", "")[:5],
                    "venue": {
                        "name": event.get("_embedded", {}).get("venues", [{}])[0].get("name"),
                        "city": event.get("_embedded", {}).get("venues", [{}])[0].get("city", {}).get("name"),
                        "street_address": event.get("_embedded", {}).get("venues", [{}])[0].get("address", {}).get("line1"),
                    },
                    "performers": event.get("_embedded", {}).get("attractions", []),
                    "description": event.get("info") or event.get("description"),
                    "categories": list(set(categories)),
                    "url": event.get("url"),
                    "image": event.get("images", [{}])[0].get("url"),
                    "accessibility": accessibility_info
                })
    except Exception as e:
        print(f"Ticketmaster fetch error: {e}")

    # --- SEATGEEK ---
    try:
        sg_client_id = os.getenv("SEATGEEK_CLIENT_ID")
        sg_client_secret = os.getenv("SEATGEEK_CLIENT_SECRET")
        if sg_client_id and sg_client_secret:
            sg_url = "https://api.seatgeek.com/2/events"
            sg_params = {
                "client_id": sg_client_id,
                "client_secret": sg_client_secret,
                "venue.city": city,
                "q": keyword,
                "per_page": 15
            }
            sg_response = requests.get(sg_url, params=sg_params)
            sg_response.raise_for_status()
            sg_data = sg_response.json()

            for event in sg_data.get("events", []):
                merged_events.append({
                    "source": "seatgeek",
                    "id": str(event.get("id")),
                    "title": event.get("title"),
                    "datetime_local": event.get("datetime_local", "").split("T")[0],
                    "end_date": event.get("datetime_local", "").split("T")[0], 
                    "time": event.get("datetime_local", "").split("T")[1][:5] if event.get("datetime_local") else "",
                    "venue": {
                        "name": event.get("venue", {}).get("name"),
                        "city": event.get("venue", {}).get("city"),
                        "street_address": event.get("venue", {}).get("address"),
                    },
                    "performers": event.get("performers", []),
                    "description": event.get("description"),
                    "categories": [tax.get("name") for tax in event.get("taxonomies", [])],
                    "url": event.get("url"),
                    "image": event.get("performers", [{}])[0].get("image") if event.get("performers") else None,
                    "accessibility": None
                })
    except Exception as e:
        print(f"SeatGeek fetch error: {e}")

    # --- Madrid events ---
    if city.lower() == "madrid":
        try:
            # HAVE TO USE DIFFERENT FORMAT BC MADRID API IS DOWN AND I NEED TO UPDATE DATABASE
            madrid_events = fetch_madrid_events()
            # madrid_events = fetch_madrid_events_xml()
            # print("Madrid XML events:", len(madrid_events))
            if keyword:
                madrid_events = [e for e in madrid_events if keyword.lower() in (e["title"] or "").lower()]
            
            for e in madrid_events:
                e["categories"] = extract_category(
                    e.get("description", "")
                )

            today = datetime.utcnow().date()
            months_later = today + timedelta(days=60)
            filtered_madrid_events = []
            for e in madrid_events:
                dt_str = e.get("datetime_local")
                if not dt_str:
                    continue
                try:
                    event_date = datetime.strptime(dt_str, "%Y-%m-%d").date()
                except:
                    continue

                venue_name = (e.get("venue", {}).get("name") or "").lower()
                if "biblioteca" in venue_name or "cine" in venue_name or "cineteca" in venue_name:
                    continue
                if today <= event_date <= months_later:
                    filtered_madrid_events.append(e)

            merged_events.extend(filtered_madrid_events)
            # merged_events.extend(madrid_events[:30]) this was adding back in unfiltered events
        except Exception as e:
            print(f"Madrid fetch error: {e}")

    # --- NYC events ---
    elif city.lower() in ["new york", "nyc", "new york city"]:
        try:
            nyc_events = fetch_nyc_events(size=50, keyword=keyword)
            merged_events.extend(nyc_events)
            print(f"Added {len(nyc_events)} NYC events to results")
        except Exception as e:
            print(f"NYC events fetch error: {e}")

    # --- Normalize and filter ---
    merged_events = [normalize_event(e) for e in merged_events]
    merged_events = filter_events(merged_events)

    # --- Naive Bayes classification  ---
    merged_events = classify_events(merged_events, city)
    merged_events.sort(key=lambda x: x.get("datetime_local") or "")

    if merged_events:
        print(f"Inserted {len(merged_events)} events into MongoDB")

    return merged_events  # returns the list in case you want it

def refresh_all_events():
    # Delete all old events first
    events_collection.delete_many({})
    print("Deleted all old events")

    all_merged_events = []
    for city in CITIES:
        merged_events = update_events_in_db(city=city)  # just fetch and return events
        for e in merged_events:
            e["city"] = city  # Add a city field to each event
        all_merged_events.extend(merged_events)
        print(f"Added {len(merged_events)} events for {city}")

    if all_merged_events:
        events_collection.insert_many(all_merged_events)
        print(f"Inserted total {len(all_merged_events)} events for all cities")

def refresh_events_by_cities(cities):
    # 1. Delete only those cities
    events_collection.delete_many({
        "city": {"$in": cities}
    })
    print(f"Deleted events for cities: {cities}")

    refreshed_events = []

    # 2. Re-fetch only those cities
    for city in cities:
        merged_events = update_events_in_db(city=city)

        for e in merged_events:
            e["city"] = city  # ensure city field exists

        refreshed_events.extend(merged_events)
        print(f"Added {len(merged_events)} events for {city}")

    # 3. Insert only refreshed ones
    if refreshed_events:
        events_collection.insert_many(refreshed_events)
        print(f"Inserted total {len(refreshed_events)} refreshed events")

    return refreshed_events