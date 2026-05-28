import os
from services.event_classifier_ml.naivebayes import NaiveBayesClassifier

"""
Naive Bayes Classifier Script: 

Uses the NaiveBayesClassifier to predict accessibility categories for events (sober-friendly, family-friendly, wheelchair-accessible) 
based on their title + description. Supports English and Spanish categories depending on the city.
Adds predicted categories to each event's 'accessibility' field.
"""

# Spanish vs English category files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORY_FILES_EN = {
    'sober_friendly': os.path.join(BASE_DIR, 'sober_friendly.txt'),
    'family_friendly': os.path.join(BASE_DIR, 'family_friendly.txt'),
    'wheelchair_accessible': os.path.join(BASE_DIR, 'wheelchair_accessible.txt')
}
CATEGORY_FILES_ES = {
    'ambiente_sobrio': os.path.join(BASE_DIR, 'sin_alcohol.txt'),
    'amigable_familia': os.path.join(BASE_DIR, 'amigable_familia.txt'),
    'accesible_silla_ruedas': os.path.join(BASE_DIR, 'accesible_silla_ruedas.txt')
}

SPANISH_CITIES = ["Madrid", "Barcelona", "Valencia"]
THRESHOLD = 0.35

def classify_events(events, city):
    """
    Add Naive Bayes predicted accessibility categories to events.
    """
    if city in SPANISH_CITIES:
        language = 'spanish'
        category_files = CATEGORY_FILES_ES
    else:
        language = 'english'
        category_files = CATEGORY_FILES_EN

    nb = NaiveBayesClassifier(category_files=category_files, language=language, stop_words=True)
    freq = nb.calculate_word_frequency()
    prob = nb.calculate_word_probability(freq)

    for event in events:
        text = f"{event.get('title','')} {event.get('description','')}"
        _, selected_categories = nb.classify(text, prob, threshold=THRESHOLD)

        # Ensure accessibility field exists and merge
        existing = event.get("accessibility", [])
        if not isinstance(existing, list):
            existing = []
        event["accessibility"] = list(set(existing + selected_categories))

    return events