import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Callback route
app.get('/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('Error from Spotify:', error);
    return res.redirect(`${process.env.CLIENT_URL}/callback?error=${error}`);
  }
  
  if (!code) {
    console.error('No authorization code provided');
    return res.redirect(`${process.env.CLIENT_URL}/callback?error=no_code`);
  }
  
  console.log('Received authorization code:', code);
  console.log('Redirecting to client with code...');
  
  // Redirect to the client with the code
  res.redirect(`${process.env.CLIENT_URL}/callback?code=${code}&state=${state}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Callback server running on http://localhost:${PORT}`);
  console.log(`Ready to handle Spotify callbacks at http://localhost:${PORT}/callback`);
}); 