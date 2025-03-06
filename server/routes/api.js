import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const router = express.Router();

// Spotify API credentials
const credentials = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
};

// Middleware to check for access token
const requireToken = (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }
  
  // Create Spotify API instance with the token
  const spotifyApi = new SpotifyWebApi(credentials);
  spotifyApi.setAccessToken(token);
  
  // Attach to request for use in route handlers
  req.spotifyApi = spotifyApi;
  next();
};

// Get user profile
router.get('/me', requireToken, async (req, res) => {
  try {
    const data = await req.spotifyApi.getMe();
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user's saved albums
router.get('/albums', requireToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const data = await req.spotifyApi.getMySavedAlbums({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching saved albums:', err);
    res.status(500).json({ error: 'Failed to fetch saved albums' });
  }
});

// Get album details
router.get('/albums/:id', requireToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await req.spotifyApi.getAlbum(id);
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching album details:', err);
    res.status(500).json({ error: 'Failed to fetch album details' });
  }
});

// Get album tracks
router.get('/albums/:id/tracks', requireToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const data = await req.spotifyApi.getAlbumTracks(id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching album tracks:', err);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
});

// Get track audio features
router.get('/tracks/:id/features', requireToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching audio features for track: ${id}`);
    
    const data = await req.spotifyApi.getAudioFeaturesForTrack(id);
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching track audio features:', err.message);
    
    // Check for specific error types
    if (err.statusCode === 403) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'You do not have permission to access this resource. This may be due to API rate limiting or subscription level.',
        statusCode: 403
      });
    }
    
    if (err.statusCode === 404) {
      return res.status(404).json({ 
        error: 'Track not found',
        message: 'The requested track audio features could not be found',
        statusCode: 404
      });
    }
    
    res.status(err.statusCode || 500).json({ 
      error: 'Failed to fetch track audio features',
      message: err.message
    });
  }
});

// Get track audio analysis
router.get('/tracks/:id/analysis', requireToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching audio analysis for track: ${id}`);
    
    const data = await req.spotifyApi.getAudioAnalysisForTrack(id);
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching track audio analysis:', err.message);
    
    // Check for specific error types
    if (err.statusCode === 403) {
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'You do not have permission to access this resource. This may be due to API rate limiting or subscription level.',
        statusCode: 403
      });
    }
    
    if (err.statusCode === 404) {
      return res.status(404).json({ 
        error: 'Track analysis not found',
        message: 'The requested track audio analysis could not be found',
        statusCode: 404
      });
    }
    
    res.status(err.statusCode || 500).json({ 
      error: 'Failed to fetch track audio analysis',
      message: err.message
    });
  }
});

// Search for albums
router.get('/search/albums', requireToken, async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const data = await req.spotifyApi.searchAlbums(q, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(data.body);
  } catch (err) {
    console.error('Error searching albums:', err);
    res.status(500).json({ error: 'Failed to search albums' });
  }
});

// Get new releases
router.get('/browse/new-releases', requireToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, country } = req.query;
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (country) {
      options.country = country;
    }
    
    const data = await req.spotifyApi.getNewReleases(options);
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching new releases:', err);
    res.status(500).json({ error: 'Failed to fetch new releases' });
  }
});

// Get featured playlists
router.get('/browse/featured-playlists', requireToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, country, locale, timestamp } = req.query;
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (country) options.country = country;
    if (locale) options.locale = locale;
    if (timestamp) options.timestamp = timestamp;
    
    console.log(`Fetching featured playlists with options:`, options);
    
    try {
      const data = await req.spotifyApi.getFeaturedPlaylists(options);
      console.log(`Successfully fetched featured playlists with message: "${data.body.message}"`);
      res.json(data.body);
    } catch (spotifyErr) {
      console.error(`Error from Spotify API for featured playlists:`, spotifyErr.statusCode, spotifyErr.message);
      
      // Check for specific error types
      if (spotifyErr.statusCode === 404) {
        console.log('Featured playlists returned 404 - likely due to regional restrictions or account type');
        // Return a structured empty response for 404 errors
        return res.status(200).json({ 
          playlists: {
            href: null,
            items: [],
            limit: parseInt(req.query.limit || 20),
            next: null,
            offset: parseInt(req.query.offset || 0),
            previous: null,
            total: 0
          },
          message: 'Featured playlists are not available in your region or with your account type. This is normal for some Spotify accounts.'
        });
      }
      
      // For other errors, rethrow to be caught by the outer try/catch
      throw spotifyErr;
    }
  } catch (err) {
    console.error('Error fetching featured playlists:', err);
    
    // For other errors, return appropriate status code
    res.status(err.statusCode || 500).json({ 
      error: 'Failed to fetch featured playlists',
      message: err.message || 'An unknown error occurred',
      playlists: {
        href: null,
        items: [],
        limit: parseInt(req.query.limit || 20),
        next: null,
        offset: parseInt(req.query.offset || 0),
        previous: null,
        total: 0
      }
    });
  }
});

// Get user's top tracks
router.get('/me/top/tracks', requireToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;
    const data = await req.spotifyApi.getMyTopTracks({
      limit: parseInt(limit),
      offset: parseInt(offset),
      time_range
    });
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching top tracks:', err);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Get user's top artists
router.get('/me/top/artists', requireToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, time_range = 'medium_term' } = req.query;
    const data = await req.spotifyApi.getMyTopArtists({
      limit: parseInt(limit),
      offset: parseInt(offset),
      time_range
    });
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching top artists:', err);
    res.status(500).json({ error: 'Failed to fetch top artists' });
  }
});

// Get recommendations based on seed tracks
router.get('/recommendations', requireToken, async (req, res) => {
  try {
    const { seed_tracks, seed_artists, seed_genres, limit = 20 } = req.query;
    
    if (!seed_tracks && !seed_artists && !seed_genres) {
      return res.status(400).json({ 
        error: 'At least one seed (tracks, artists, or genres) is required' 
      });
    }
    
    const options = { limit: parseInt(limit) };
    
    if (seed_tracks) options.seed_tracks = seed_tracks;
    if (seed_artists) options.seed_artists = seed_artists;
    if (seed_genres) options.seed_genres = seed_genres;
    
    const data = await req.spotifyApi.getRecommendations(options);
    res.json(data.body);
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Detect highlights in a track
router.get('/tracks/:id/highlights', requireToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to detect highlights for track: ${id}`);
    
    // Try to get both audio features and analysis
    try {
      // Get both audio features and analysis
      const [features, analysis] = await Promise.all([
        req.spotifyApi.getAudioFeaturesForTrack(id),
        req.spotifyApi.getAudioAnalysisForTrack(id)
      ]);
      
      const featuresData = features.body;
      const analysisData = analysis.body;
      
      // Extract sections with high energy and danceability
      const highlights = analysisData.sections
        .filter(section => {
          // Find sections with high energy, danceability, or loudness
          return (
            section.loudness > analysisData.track.loudness_max * 0.8 ||
            (featuresData.energy > 0.7 && section.duration > 10) ||
            (featuresData.danceability > 0.7 && section.duration > 10)
          );
        })
        .map(section => ({
          start: section.start,
          duration: Math.min(section.duration, 30), // Cap at 30 seconds
          confidence: section.confidence,
          loudness: section.loudness,
          tempo: section.tempo
        }))
        .sort((a, b) => b.loudness - a.loudness); // Sort by loudness (descending)
      
      // If no highlights found, use the first section
      if (highlights.length === 0 && analysisData.sections.length > 0) {
        const firstSection = analysisData.sections[0];
        highlights.push({
          start: firstSection.start,
          duration: Math.min(firstSection.duration, 30),
          confidence: firstSection.confidence,
          loudness: firstSection.loudness,
          tempo: firstSection.tempo
        });
      }
      
      // Return the top 3 highlights or all if less than 3
      res.json(highlights.slice(0, 3));
    } catch (analysisErr) {
      console.error('Error accessing audio analysis:', analysisErr);
      
      // If we get a 403 error, provide fallback highlights
      if (analysisErr.statusCode === 403) {
        console.log('Using fallback highlights due to 403 error');
        
        // Get track details to determine duration if possible
        try {
          const track = await req.spotifyApi.getTrack(id);
          const duration = track.body.duration_ms / 1000; // Convert to seconds
          
          // Create evenly spaced highlights
          const highlights = [];
          
          // If track is longer than 30 seconds, create 3 highlights
          if (duration > 90) {
            // Beginning, middle, and end highlights
            highlights.push({
              start: 0,
              duration: 30,
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
            
            highlights.push({
              start: Math.floor(duration / 2) - 15,
              duration: 30,
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
            
            highlights.push({
              start: Math.max(0, Math.floor(duration - 30)),
              duration: 30,
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
          } else if (duration > 30) {
            // For shorter tracks, just beginning and end
            highlights.push({
              start: 0,
              duration: 30,
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
            
            highlights.push({
              start: Math.max(0, Math.floor(duration - 30)),
              duration: 30,
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
          } else {
            // For very short tracks, just the whole track
            highlights.push({
              start: 0,
              duration: Math.min(30, duration),
              confidence: 1.0,
              loudness: -10,
              tempo: 120
            });
          }
          
          return res.json(highlights);
        } catch (trackErr) {
          console.error('Error getting track details:', trackErr);
          // If we can't get track details, return a default highlight
          return res.json([{
            start: 0,
            duration: 30,
            confidence: 1.0,
            loudness: -10,
            tempo: 120
          }]);
        }
      }
      
      // For other errors, rethrow
      throw analysisErr;
    }
  } catch (err) {
    console.error('Error detecting highlights:', err);
    
    // Return a default highlight at the beginning of the track
    res.json([{
      start: 0,
      duration: 30,
      confidence: 1.0,
      loudness: -10,
      tempo: 120
    }]);
  }
});

export default router; 