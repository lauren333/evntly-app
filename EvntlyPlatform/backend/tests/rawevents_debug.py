import os
import requests
import json
import requests
from dotenv import load_dotenv
load_dotenv()

"""
    This is a simple debug script to fetch raw event data from NYC, Ticketmaster, SeatGeek, and Madrid.
    It saves the responses locally as a txt file so I can look at the raw event data from each API.

    Purpose:
        - Mainly to better understand the structure of each raw file and the variable names used.
        - The JSON/text files also serve as a reference when updating or normalizing events in the main app.
        - Saving the raw output locally lets us see exactly what we can pull, making it easier to test and plan future changes.
"""

def fetch_nyc_events_debug(size=10, keyword="", output_file="nyc_raw.json"):
    nyc_api_key = os.getenv("NYC_GOV_API_KEY")
    if not nyc_api_key:
        print("NYC Gov API key not found")
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

    response = requests.get(endpoint, headers=headers, params=params)
    print(f"Status code: {response.status_code}")

    # Save raw JSON to file
    try:
        data = response.json()
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Raw NYC JSON written to {output_file}")
        return data
    except json.JSONDecodeError:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"Raw NYC text written to {output_file} (JSON decode failed)")
        return []

def fetch_ticketmaster_debug(city="New York", size=10, output_file="ticketmaster_raw.json"):
    api_key = os.getenv("TICKETMASTER_API_KEY")
    if not api_key:
        print("Ticketmaster API key not found")
        return []

    url = "https://app.ticketmaster.com/discovery/v2/events.json"
    params = {
        "apikey": api_key,
        "city": city,
        "size": size
    }
    response = requests.get(url, params=params)
    print(f"Status code: {response.status_code}")

    try:
        data = response.json()
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Raw Ticketmaster JSON written to {output_file}")
        return data
    except json.JSONDecodeError:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"Raw Ticketmaster text written to {output_file} (JSON decode failed)")
        return []

def fetch_seatgeek_debug(city="New York", size=10, output_file="seatgeek_raw.json"):
    client_id = os.getenv("SEATGEEK_CLIENT_ID")
    client_secret = os.getenv("SEATGEEK_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("SeatGeek API credentials not found")
        return []

    url = "https://api.seatgeek.com/2/events"
    params = {
        "client_id": client_id,
        "client_secret": client_secret,
        "venue.city": city,
        "per_page": size
    }
    response = requests.get(url, params=params)
    print(f"Status code: {response.status_code}")

    try:
        data = response.json()
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Raw SeatGeek JSON written to {output_file}")
        return data
    except json.JSONDecodeError:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"Raw SeatGeek text written to {output_file} (JSON decode failed)")
        return []
    
def fetch_madrid_events_debug(size=10, output_file="madrid_raw.json"):
    url = "https://datos.madrid.es/egob/catalogo/206974-0-agenda-eventos-culturales-100.json"

    params = {
        "_limit": size
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Status code: {response.status_code}")

        raw_text = response.text

        # Write RAW response exactly as received
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(raw_text)

        print(f"Raw Madrid JSON written to {output_file}")
        return raw_text

    except Exception as e:
        print(f"Madrid debug fetch error: {e}")
        return None

def fetch_madrid_events_xml_debug(size=10, output_file="madrid_raw.xml"):
    url = "https://datos.madrid.es/dataset/300107-0-agenda-actividades-eventos/resource/300107-3-agenda-actividades-eventos-xml/download/300107-3-agenda-actividades-eventos-xml.xml"

    try:
        response = requests.get(url, timeout=20)

        print("Status code:", response.status_code)
        print("Content-Type:", response.headers.get("Content-Type"))
        print("First 500 chars:\n")
        print(response.text[:500])  # 👈 super important

        # Save raw XML exactly as received
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(response.text)

        print(f"\nRaw XML saved to {output_file}")
        print("File size:", len(response.text), "characters")

        return response.text

    except Exception as e:
        print("Madrid XML debug error:", e)
        return None