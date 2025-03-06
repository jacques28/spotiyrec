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
    console.error('No authorization code provided');
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  try {
    console.log(`Exchanging authorization code for tokens: ${code.substring(0, 10)}...`);
    
    // Create a new instance with the same credentials
    const exchangeApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI
    });
    
    // Exchange authorization code for access token
    const data = await exchangeApi.authorizationCodeGrant(code);
    
    if (!data || !data.body) {
      throw new Error('Invalid response from Spotify API');
    }
    
    const { access_token, refresh_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    console.log(`Token exchange successful. Access token: ${access_token.substring(0, 10)}...`);
    console.log(`Account type: ${data.body.scope?.includes('user-read-private') ? 'Premium' : 'Free'}`);
    
    // Return tokens as JSON
    res.json({
      access_token,
      refresh_token,
      expires_in,
      account_type: data.body.scope?.includes('user-read-private') ? 'premium' : 'free'
    });
  } catch (err) {
    console.error('Error exchanging code for tokens:', err.message);
    console.error('Error details:', err.body || err);
    
    // Check for specific error types
    if (err.body && err.body.error === 'invalid_grant') {
      return res.status(400).json({ 
        error: 'Invalid authorization code',
        message: 'The authorization code has expired or has already been used',
        code: 'invalid_grant'
      });
    }
    
    // Send more detailed error information
    if (err.statusCode) {
      return res.status(err.statusCode).json({ 
        error: 'Failed to exchange code for tokens',
        message: err.message,
        statusCode: err.statusCode
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to exchange code for tokens',
      message: err.message
    });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  try {
    console.log('Refreshing access token...');
    
    // Create a new instance with the same credentials
    const refreshApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI,
      refreshToken
    });
    
    // Refresh the access token
    const data = await refreshApi.refreshAccessToken();
    
    if (!data || !data.body) {
      throw new Error('Invalid response from Spotify API');
    }
    
    const { access_token, expires_in } = data.body;
    
    if (!access_token) {
      throw new Error('No access token received from Spotify');
    }
    
    console.log(`Token refresh successful. New access token: ${access_token.substring(0, 10)}...`);
    
    // Return the new access token and expiry
    res.json({
      accessToken: access_token,
      expiresIn: expires_in
    });
  } catch (err) {
    console.error('Error refreshing access token:', err.message);
    console.error('Error details:', err.body || err);
    
    // Check for specific error types
    if (err.body && err.body.error === 'invalid_grant') {
      return res.status(400).json({ 
        error: 'Invalid refresh token',
        message: 'The refresh token has expired or is invalid',
        code: 'invalid_grant'
      });
    }
    
    // Send more detailed error information
    if (err.statusCode) {
      return res.status(err.statusCode).json({ 
        error: 'Failed to refresh access token',
        message: err.message,
        statusCode: err.statusCode
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to refresh access token',
      message: err.message
    });
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