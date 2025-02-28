import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const router = express.Router();

// Enable CORS for all routes
router.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Ensure JSON body parsing
router.use(express.json());

// Spotify API credentials
const credentials = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
};

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi(credentials);

// Scopes for Spotify API access
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative'
];

// Login route - redirects to Spotify authorization page
router.get('/spotify', (req, res) => {
  const state = 'spotify_auth_state'; // You can generate a random state for security
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  console.log(`Redirecting to Spotify authorization: ${authorizeURL}`);
  res.redirect(authorizeURL);
});

// Callback route - handles the response from Spotify
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('Error from Spotify:', error);
    return res.redirect(`${process.env.CLIENT_URL}/callback?error=${error}`);
  }
  
  if (!code) {
    console.error('No authorization code provided');
    return res.redirect(`${process.env.CLIENT_URL}/callback?error=no_code`);
  }
  
  try {
    console.log('Received authorization code in callback');
    // Don't exchange the code here, just pass it to the client
    res.redirect(`${process.env.CLIENT_URL}/callback?code=${code}`);
  } catch (err) {
    console.error('Error during callback:', err);
    res.redirect(`${process.env.CLIENT_URL}/callback?error=callback_failed`);
  }
});

// Exchange code for tokens endpoint
router.post('/exchange', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  try {
    console.log('Exchanging authorization code for tokens');
    
    // Create a new instance with the same credentials
    const exchangeApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI
    });
    
    // Exchange authorization code for access token
    const data = await exchangeApi.authorizationCodeGrant(code);
    
    const { access_token, refresh_token, expires_in } = data.body;
    console.log('Token exchange successful');
    
    // Return tokens as JSON
    res.json({
      access_token,
      refresh_token,
      expires_in
    });
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  // Create new instance with refresh token
  const refreshSpotifyApi = new SpotifyWebApi({
    ...credentials,
    refreshToken
  });
  
  try {
    const data = await refreshSpotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    
    res.json({
      accessToken: access_token,
      expiresIn: expires_in
    });
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  // Clear session
  if (req.session) {
    req.session.destroy();
  }
  res.redirect(process.env.CLIENT_URL);
});

export default router; 