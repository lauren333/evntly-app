import os
import json
import requests
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.event_classifier_ml.naivebayes import NaiveBayesClassifier


"""
This script was used as a testing tool for the Naive Bayes text classifier. 

Purpose:
- Quickly test and validate the behavior of the classifier during development.
- Observe classification results in real-time before integrating with the front-end.
- Serve as a playground for experimenting with the classifier logic / training data.
"""

# ------------------------------ 1. Cities to test ------------------------------
CITIES = ["New York","Boston","Washington","Philadelphia","Chicago","Miami","Los Angeles","San Francisco","Seattle","Las Vegas","Denver","Toronto","Montreal","Vancouver","Ottawa","Amsterdam","Vienna","Berlin","Brussels","Stockholm","Oslo","Barcelona","Madrid","Valencia"]
SPANISH_CITIES = ["Madrid", "Barcelona", "Valencia"]

API_URL = os.getenv("API_URL", "http://127.0.0.1:5000/api/events")

# ------------------------------ 2. Initialize Naive Bayes ------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))  # backend/test
services_dir = os.path.join(base_dir, '..', 'services') # backend/services

category_files = {
    'sober_friendly': os.path.join(services_dir, 'sober_friendly.txt'),
    'family_friendly': os.path.join(services_dir, 'family_friendly.txt'),
    'wheelchair_accessible': os.path.join(services_dir, 'wheelchair_accessible.txt')
}

category_files_es = {
    'ambiente_sobrio': os.path.join(services_dir, 'sin_alcohol.txt'),
    'amigable_familia': os.path.join(services_dir, 'amigable_familia.txt'),
    'accesible_silla_ruedas': os.path.join(services_dir, 'accesible_silla_ruedas.txt')
}

# nb = NaiveBayesClassifier(category_files=category_files, stop_words=True)
# freq = nb.calculate_word_frequency()
# prob = nb.calculate_word_probability(freq)

# ------------------------------ 3. Fetch and classify events for each city ------------------------------
all_results = []

THRESHOLD = 0.35  # minimum probability to assign a category

for city in CITIES:
    print(f"Fetching events for {city}...")
    params = {"city": city, "keyword": "", "category": ""}

    if city in SPANISH_CITIES:
        language = 'spanish'
        category_files = category_files_es
    else:
        language = 'english'
        category_files = category_files
    
    # Initialize Naive Bayes per city
    nb = NaiveBayesClassifier(category_files=category_files, language=language, stop_words=True)
    freq = nb.calculate_word_frequency()
    prob = nb.calculate_word_probability(freq)

    try:
        response = requests.get(API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        # events = data.get("events", [])
        # print(f"  Fetched {len(events)} events for {city}")
        events = data.get("events", [])
        events = events[:20]  # limit to max 20 events per city
        print(f"  Classifying {len(events)} events for {city} (max 20)")
    except Exception as e:
        print(f"  Error fetching events for {city}: {e}")
        events = []

    for event in events:
        text = f"{event.get('title','')} {event.get('description','')}"
        probabilities, selected_categories = nb.classify(text, prob, threshold=THRESHOLD)
        
        all_results.append({
            "city": city,
            "title": event.get("title"),
            "description": event.get("description", ""),
            "venue": event.get("venue"),
            "selected_categories": selected_categories,   # multi-label output
            "probabilities": probabilities
        })

# ------------------------------ 4. Write all results to TXT ------------------------------
with open("test_classification_results.txt", "w", encoding="utf-8") as f:
    for r in all_results:
        f.write(f"City: {r['city']}\n")
        f.write(f"Title: {r['title']}\n")
        f.write(f"Description: {r.get('description', '')}\n")  
        f.write(f"Venue: {r.get('venue', {})}\n")
        f.write(f"Predicted Categories: {r['selected_categories']}\n")
        f.write(f"Probabilities: {r['probabilities']}\n")
        f.write("-" * 50 + "\n")

print("Classification results saved to test_classification_results.txt")