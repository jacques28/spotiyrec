# Spotify Redirect URI Troubleshooting Guide

## The Problem: 400 Bad Request Error

You're seeing a 400 Bad Request error when trying to authenticate with Spotify:

```
GET https://accounts.spotify.com/authorize?client_id=7caca26fddb04f839798d006bb455c80&response_type=code&redirect_uri=http://localhost:3000/callback&scope=user-read-private%20user-read-email%20user-top-read%20user-library-read%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming%20playlist-read-private%20playlist-read-collaborative&state=spotify_auth_state 400 (Bad Request)
```

This error occurs when the redirect URI in your request doesn't **exactly** match one of the redirect URIs registered in your Spotify Developer Dashboard.

## Step 1: Check Your Current Configuration

Your current server configuration in `.env`:
```
REDIRECT_URI=http://localhost:3000/callback
```

## Step 2: Verify Spotify Developer Dashboard Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Select your application
4. Click "Edit Settings"
5. Look at the "Redirect URIs" section

### Important: Check for Exact Matches

Make sure your redirect URIs are entered EXACTLY as follows (with no spaces or typos):

```
http://localhost:3000/callback
http://localhost:5173/callback
http://localhost:4000/callback
```

Common issues to check for:
- Extra spaces (e.g., "http://localhost: 3000/callback" with a space after the colon)
- Missing or extra slashes
- Typos in "localhost" or "callback"
- HTTP vs HTTPS (use HTTP for localhost)

## Step 3: Test with Our Diagnostic Tool

I've created a simple test page for you:

1. Open http://localhost:8000/test-spotify-auth.html in your browser
2. Click each button to test different redirect URIs
3. Note which ones work and which ones give 400 errors

## Step 4: Update Your Configuration

Based on which redirect URI works in the test:

1. Update your server's `.env` file:
   ```
   REDIRECT_URI=http://localhost:XXXX/callback
   ```
   (Replace XXXX with the port number that worked)

2. Restart your server:
   ```
   cd server && npm run dev
   ```

## Step 5: Clear Browser Cache and Cookies

Sometimes old authorization attempts can cause issues:

1. Open your browser settings
2. Clear cookies and site data for accounts.spotify.com
3. Try authenticating again

## Additional Troubleshooting

If you're still having issues:

1. Try using an incognito/private browser window
2. Double-check that both your client and server are running
3. Make sure your Spotify Developer account has the correct app selected
4. Verify that your Client ID matches what's in your `.env` file 