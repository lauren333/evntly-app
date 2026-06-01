# Evntly!
An event discovery and scheduling application that aggregates event data from multiple external sources and provides search, filtering, accessibility classification, and event management features.
 
---

## Technology Stack
| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React-20232A?logo=react) | Frontend user interface and client-side interactions |
| ![Flask](https://img.shields.io/badge/Flask-000000?logo=flask) | Backend REST API and server-side application logic |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb) | Persistent storage for events, users, reviews, and saved events |
| ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase) | User authentication and account management |
| ![Python](https://img.shields.io/badge/Python-3776AB?logo=python) | Backend development and machine learning components | 

---

## Key Features
- Aggregates event data from multiple APIs across European and North American cities
- Browse upcoming events
- Full-text search over event metadata (titles, descriptions, venues, time)
- Multi-dimensional filtering across category, city (where applicable), keywords, and accessibility labels
- Unified query system with cumulatively refined results across search and filter inputs
- Machine learning-based accessibility classification using a Naive Bayes model
- Generates wheelchair accessible, family-friendly, and sober-friendly labels 
- Save events 
- Chronological and calendar-based organization of saved events
- External calendar integration
- Event detail pages with ticketing and source links
- User reviews and ratings
---

## Screenshots

### Event Discovery Feed & Filtering Interface

<p align="center">
  <img src="EvntlyPlatform/docs/event-feed.png" width="220px" />
  &nbsp;&nbsp;&nbsp;
  <img src="EvntlyPlatform/docs/filtering.png" width="220px" />
</p>

### Event Detail Page & Reviews

<p align="center">
  <img src="EvntlyPlatform/docs/event-details.png" width="22%" />
  <img src="EvntlyPlatform/docs/event-details1.png" width="22%" />
  <img src="EvntlyPlatform/docs/event-details2.png" width="22%" />
</p>

---

### Saved Events & Calendar View

<p align="center">
  <img src="EvntlyPlatform/docs/saved-events-calendar.png" width="22%" />
  <img src="EvntlyPlatform/docs/saved-events-calendar1.png" width="22%" />
  <img src="EvntlyPlatform/docs/saved-events-calendar2.png" width="22%" />
</p>

—--

## System Architecture

<p align="center">
  <img src="EvntlyPlatform/docs/System_Architecture.png" width="40%" />
</p>

Service-based backend with batch ingestion, ML enrichment, and REST API delivery.

---

## Technical Highlights
- Designed and implemented a multi-source event ingestion pipeline with data normalization across heterogeneous APIs
- Developed a Naive Bayes-based classifier to predict accessibility-related event attributes
- Implemented full-text search and multi-criteria filtering for event discovery using MongoDB query-based retrieval
- Developed a RESTful backend architecture using Flask to handle event retrieval, user data, and interactions
- Integrated multiple external APIs (Ticketmaster, SeatGeek, Madrid Open Data, NYC Open Data) into a unified event schema
- Implemented user authentication and persistent data storage using Firebase and MongoDB
- Developed a saved events system with chronological organization and external calendar export support
