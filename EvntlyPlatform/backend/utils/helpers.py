import html
import re

"""
Utilitie Functions: 
These helper functions support the event processing pipeline (services/event_processing.py):

   - `load_ignore_keywords`: loads keywords used to **filter out events containing certain words**.
   - `clean_html_description`: cleans and normalizes HTML content from event descriptions.
"""

def load_ignore_keywords(file_path="ignore_keywords.txt"):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            # Read lines, strip whitespace, lowercase everything
            return [line.strip().lower() for line in f if line.strip()]
    except Exception as e:
        print(f"Error loading ignore keywords: {e}")
        return []
    
def clean_html_description(text):
    if not text or not isinstance(text, str):
        return ""
    # Decode HTML entities (&nbsp;, &ndash;, etc.)
    text = html.unescape(text)
    # Convert escaped newlines to real ones
    text = text.replace("\\n", "\n")
    # Replace paragraph and break tags with newlines
    text = re.sub(r"</p\s*>", "\n\n", text)
    text = re.sub(r"<br\s*/?>", "\n", text)
    # Remove all remaining HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize spaces BUT keep newlines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()