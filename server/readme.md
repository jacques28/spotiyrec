# SpotiYRec Server

Backend server for the SpotiYRec application, handling Spotify API authentication and data retrieval.

## Features

- Spotify OAuth authentication
- API endpoints for album and track data
- Highlight detection algorithm
- Rate limiting and caching

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your Spotify API credentials.

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Note your Client ID and Client Secret
4. Add `http://localhost:5173/callback` to your Redirect URIs in the Spotify Dashboard

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication

- `GET /auth/spotify`: Initiates Spotify OAuth flow
- `GET /auth/callback`: Handles Spotify OAuth callback
- `POST /auth/refresh`: Refreshes access token
- `GET /auth/logout`: Logs out user

### User Data

- `GET /api/me`: Get current user profile
- `GET /api/me/top/tracks`: Get user's top tracks
- `GET /api/me/top/artists`: Get user's top artists

### Albums

- `GET /api/albums`: Get user's saved albums
- `GET /api/albums/:id`: Get album details
- `GET /api/albums/:id/tracks`: Get album tracks
- `GET /api/search/albums`: Search for albums
- `GET /api/browse/new-releases`: Get new releases

### Tracks

- `GET /api/tracks/:id/features`: Get track audio features
- `GET /api/tracks/:id/analysis`: Get track audio analysis
- `GET /api/tracks/:id/highlights`: Get track highlights

### Recommendations

- `GET /api/recommendations`: Get recommendations based on seed tracks
- `GET /api/browse/featured-playlists`: Get featured playlists