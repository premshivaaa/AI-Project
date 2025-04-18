# AI Venue Finder Backend

An AI-powered venue finder chatbot that helps users discover event venues based on their requirements. The chatbot uses Gemini AI for natural language processing, Foursquare Places API for venue search, and MongoDB for chat history persistence.

## Features

- AI-powered natural language understanding
- Real-time venue search with Foursquare Places API
- Venue recommendations based on:
  - Event category (sports, personal, business, wedding, party)
  - Number of attendees
  - Location
- Chat history persistence
- Serverless deployment on Vercel

## Prerequisites

- Node.js 18 or higher
- MongoDB database
- API keys for:
  - Google Gemini AI
  - Foursquare Places API
  - MapTiler (optional, for enhanced map features)

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd venue-finder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```
GOOGLE_API_KEY=your_gemini_api_key
FOURSQUARE_API_KEY=your_foursquare_api_key
MAPTILER_API_KEY=your_maptiler_api_key
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server:
```bash
npm run dev
```

## API Endpoints

### POST /api/chat
Main endpoint for chat interactions.

Request body:
```json
{
  "message": "I need a venue for a business meeting with 20 people in New York",
  "sessionId": "optional-existing-session-id"
}
```

Response:
```json
{
  "sessionId": "session-id",
  "message": "AI response message",
  "venues": [
    {
      "id": "venue-id",
      "name": "Venue Name",
      "category": "business",
      "address": "Venue Address",
      "rating": 4.5,
      "priceRange": "$$$",
      "capacity": 50,
      "photos": ["photo-urls"],
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "mapUrl": "google-maps-url"
    }
  ]
}
```

## Deployment

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Add environment variables in Vercel project settings
4. Deploy!

## License

MIT 