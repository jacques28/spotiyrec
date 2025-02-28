# SpotiYRec - Spotify Album Highlights

A music streaming application that helps users discover and enjoy the best moments of albums using the Spotify API.

## Features

- Display album artwork and metadata in a responsive grid layout
- "Highlights" feature that identifies and plays the most engaging parts of songs
- Recommendation engine based on musical highlights
- Playback controls with a clean, modern interface
- Dark/light mode support
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React, Chakra UI, Spotify Web API
- **Backend**: Node.js, Express
- **Authentication**: Spotify OAuth

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Note your Client ID and Client Secret
4. Add `http://localhost:5173/callback` to your Redirect URIs

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/spotiyrec.git
   cd spotiyrec
   ```

2. Install dependencies
   ```
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables
   ```
   # In the server directory
   cp .env.example .env
   ```
   Then edit the `.env` file with your Spotify API credentials

4. Start the development servers
   ```
   # Start the backend server (from the server directory)
   npm run dev
   
   # Start the frontend server (from the client directory)
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## License

MIT 