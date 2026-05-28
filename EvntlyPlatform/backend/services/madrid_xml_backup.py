"""
MADRID XML BACKUP INGESTION PIPELINE

This file exists because the Madrid JSON API frequently changes
or becomes unavailable.

The XML feed is more stable and is used as a fallback source
when the JSON version fails or returns incomplete data.

This ensures event coverage continuity even during API instability.

The Madrid XML feed is NOT fully valid XML.
It contains invalid Unicode entities (e.g. broken emojis),
so we sanitize it before parsing.
"""

import requests
import xmltodict
import re
import json
from xml.parsers.expat import ExpatError


MADRID_XML_URL = "https://datos.madrid.es/dataset/300107-0-agenda-actividades-eventos/resource/300107-3-agenda-actividades-eventos-xml/download/300107-3-agenda-actividades-eventos-xml.xml"


# ----------------------------
# XML SANITIZER (IMPORTANT)
# ----------------------------
def clean_xml(xml_text: str) -> str:
    # remove control chars that break XML parsing
    xml_text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", xml_text)

    # remove broken numeric emoji/entities (Madrid dataset issue)
    xml_text = re.sub(r"&#\d{5,7};", "", xml_text)

    return xml_text

# ----------------------------
# CATEGORY EXTRACTOR
# ----------------------------
def extract_category(description: str):
    if not description:
        return []

    match = re.search(r"Categoría:\s*([^\.]+)", description, re.IGNORECASE)
    if not match:
        return []

    category = match.group(1).strip()

    # handle multiple categories like "Teatro, Cine"
    return [c.strip() for c in category.split(",") if c.strip()]


# ----------------------------
# MAIN FETCH FUNCTION
# ----------------------------
def fetch_madrid_events_xml():
    response = requests.get(MADRID_XML_URL, timeout=20)
    response.raise_for_status()

    raw_xml = response.text
    print("Raw XML size:", len(raw_xml))

    cleaned_xml = clean_xml(raw_xml)

    # # Save cleaned version for debugging always
    # with open("madrid_cleaned_debug.xml", "w", encoding="utf-8") as f:
    #     f.write(cleaned_xml)

    # ----------------------------
    # PARSE XML SAFELY
    # ----------------------------
    try:
        data = xmltodict.parse(cleaned_xml)

    except ExpatError as e:
        print("\nXML PARSING FAILED")
        print("Error:", e)

        with open("madrid_failed.xml", "w", encoding="utf-8") as f:
            f.write(cleaned_xml)

        return []

    # ----------------------------
    # ROOT HANDLING
    # ----------------------------
    root = data.get("Contenidos") or data

    contents = (
        root.get("contenido")
        or root.get("Contenido")
        or root.get("CONTENIDO")
        or []
    )

    if isinstance(contents, dict):
        contents = [contents]

    print("XML items found:", len(contents))

    events = []

    # ----------------------------
    # PARSE EVENTS
    # ----------------------------
    for item in contents:
        try:
            attrs = item.get("atributos", {}).get("atributo", [])
            if isinstance(attrs, dict):
                attrs = [attrs]

            def get_attr(name):
                for a in attrs:
                    if a.get("@nombre") == name:
                        return a.get("#text") or a.get("atributo")
                return None

            def get_localizacion():
                for a in attrs:
                    if a.get("@nombre") == "LOCALIZACION":
                        loc_attrs = a.get("atributo", [])
                        if isinstance(loc_attrs, dict):
                            loc_attrs = [loc_attrs]

                        def get_loc(name):
                            for x in loc_attrs:
                                if x.get("@nombre") == name:
                                    return x.get("#text") or x.get("atributo")
                            return None

                        return {
                            "name": get_loc("NOMBRE-INSTALACION"),
                            "address": get_loc("DIRECCION-INSTALACION"),
                            "lat": get_loc("LATITUD"),
                            "lon": get_loc("LONGITUD"),
                            "city": get_loc("LOCALIDAD"),
                            "district": get_loc("DISTRITO"),
                        }
                return {}

            loc = get_localizacion()
            desc = get_attr("DESCRIPCION") or ""
            events.append({
                "source": "Ayuntamiento de Madrid",
                "id": get_attr("ID-EVENTO") or "",
                "title": get_attr("TITULO") or "",
                "description": get_attr("DESCRIPCION") or "",
                "datetime_local": (get_attr("FECHA-EVENTO") or "").split(" ")[0],
                "end_date": (get_attr("FECHA-FIN-EVENTO") or "").split(" ")[0],
                "time": get_attr("HORA-EVENTO") or "",

                "venue": {
                    "name": loc.get("name") or "",
                    "city": "Madrid",
                    "street_address": loc.get("address") or "",
                },

                "latitude": loc.get("lat"),
                "longitude": loc.get("lon"),

                "categories": extract_category(desc),
                "url": get_attr("CONTENT-URL") or "",
                "accessibility": []
            })

        except Exception as e:
            print("XML item parse error:", e)
            continue

    print("Parsed Madrid events:", len(events))

    # ----------------------------
    # SAVE FINAL OUTPUT
    # ----------------------------
    # with open("madrid_events_debug.json", "w", encoding="utf-8") as f:
    #     json.dump(events, f, indent=2, ensure_ascii=False)

    # print("✅ Saved JSON to madrid_events_debug.json")

    return events


# ----------------------------
# TEST FUNCTION
# ----------------------------
def test_madrid_xml_parsing(limit=10):
    events = fetch_madrid_events_xml()

    print(f"\nTotal parsed events: {len(events)}\n")

    for e in events[:limit]:
        print(json.dumps(e, indent=2, ensure_ascii=False))

    return events


def get_madrid_events_only():
    return fetch_madrid_events_xml()