# Spotify Developer Dashboard Setup Guide

## Current Configuration

Your application is configured with the following settings:

- **Client ID**: 7caca26fddb04f839798d006bb455c80
- **Client Secret**: f2a2cb636e5f43c2bce3f9a7726a8bed
- **Redirect URI**: http://localhost:3000/callback
- **Client URL**: http://localhost:5173

## Steps to Update Spotify Developer Dashboard

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Select your application (or create a new one if needed)
4. Click on "Edit Settings"
5. Under "Redirect URIs", make sure you have **exactly** this URI:
   ```
   http://localhost:3000/callback
   ```
6. Save your changes

## Important Notes

- The redirect URI in your Spotify Dashboard must **exactly** match the one in your `.env` file
- The error you were seeing (400 Bad Request) typically occurs when these don't match
- Your application is set up to handle the callback on port 3000, but your client is running on port 5173
- We've updated the code to handle this mismatch by:
  1. Accepting the callback on port 3000
  2. Redirecting to your client application on port 5173 with the tokens
  3. Processing the tokens in your React application

## Testing the Authentication Flow

1. Start your server: `cd server && npm run dev`
2. Start your client: `cd client && npm run dev`
3. Click the "Sign In with Spotify" button in your application
4. You should be redirected to Spotify's authorization page
5. After authorizing, you should be redirected back to your application

## Troubleshooting

If you still encounter issues:

1. Check the server console for any error messages
2. Verify that both your server and client are running
3. Make sure your Spotify Developer Dashboard settings match exactly what's in your `.env` file
4. Clear your browser cookies and try again
5. Try using an incognito/private browser window

## Alternative Solution

If you prefer to have everything on the same port, you can:

1. Update your Spotify Developer Dashboard to use `http://localhost:5173/callback` as the redirect URI
2. Update your `.env` file to match this change
3. Restart your server and client applications 