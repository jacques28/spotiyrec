import { useState, useCallback } from 'react';
import { useSpotify } from '../context/SpotifyContext';

// Custom hook for handling Spotify API requests with loading and error states
const useSpotifyAPI = () => {
  const { spotifyApi, refreshAccessToken, isAuthenticated } = useSpotify();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic function to make API calls with retry logic
  const apiCall = useCallback(async (apiMethod, ...args) => {
    if (!isAuthenticated) {
      console.error('Not authenticated for API call');
      setError('Authentication required');
      throw new Error('Authentication required');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiMethod.apply(spotifyApi, args);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Spotify API Error:', err);
      
      // Check if error is due to authorization issues
      const isAuthError = err.status === 401 || 
                         (err.message && err.message.includes('token')) ||
                         (err.message && err.message.includes('authorization'));
      
      if (isAuthError && refreshAccessToken) {
        try {
          // Try to refresh the token and retry the API call
          console.log('Attempting to refresh token and retry API call');
          await refreshAccessToken();
          
          // Retry the API call
          const result = await apiMethod.apply(spotifyApi, args);
          setLoading(false);
          return result;
        } catch (retryErr) {
          console.error('Retry failed after token refresh:', retryErr);
          setError('Authentication failed. Please log in again.');
          setLoading(false);
          throw retryErr;
        }
      }
      
      // For non-auth errors or if retry failed
      setError(err.message || 'An error occurred with the Spotify API');
      setLoading(false);
      throw err;
    }
  }, [spotifyApi, refreshAccessToken, isAuthenticated]);

  // Get user's saved albums
  const getUserAlbums = useCallback(async (options = {}) => {
    return apiCall(spotifyApi.getMySavedAlbums, options);
  }, [apiCall, spotifyApi]);

  // Get album details
  const getAlbum = useCallback(async (albumId) => {
    return apiCall(spotifyApi.getAlbum, albumId);
  }, [apiCall, spotifyApi]);

  // Get album tracks
  const getAlbumTracks = useCallback(async (albumId, options = {}) => {
    return apiCall(spotifyApi.getAlbumTracks, albumId, options);
  }, [apiCall, spotifyApi]);

  // Get track audio features (for highlight detection)
  const getAudioFeatures = useCallback(async (trackId) => {
    try {
      return await apiCall(spotifyApi.getAudioFeaturesForTrack, trackId);
    } catch (err) {
      console.error('Error getting audio features:', err);
      
      // If we get a 403 error, it's likely due to API limitations for free accounts
      if (err.status === 403) {
        return {
          // Return default values that won't break the app
          energy: 0.5,
          danceability: 0.5,
          valence: 0.5,
          acousticness: 0.5,
          instrumentalness: 0.5,
          tempo: 120,
          loudness: -10,
          _limited: true // Flag to indicate this is limited data
        };
      }
      
      // For other errors, rethrow
      throw err;
    }
  }, [apiCall, spotifyApi]);

  // Get multiple tracks' audio features
  const getMultipleAudioFeatures = useCallback(async (trackIds) => {
    return apiCall(spotifyApi.getAudioFeaturesForTracks, trackIds);
  }, [apiCall, spotifyApi]);

  // Get track audio analysis (for detailed timing information)
  const getAudioAnalysis = useCallback(async (trackId) => {
    try {
      return await apiCall(spotifyApi.getAudioAnalysisForTrack, trackId);
    } catch (err) {
      console.error('Error getting audio analysis:', err);
      
      // If we get a 403 error, it's likely due to API limitations for free accounts
      if (err.status === 403) {
        return {
          // Return minimal structure that won't break the app
          sections: [],
          segments: [],
          beats: [],
          bars: [],
          tatums: [],
          track: {
            duration: 0,
            tempo: 120
          },
          _limited: true // Flag to indicate this is limited data
        };
      }
      
      // For other errors, rethrow
      throw err;
    }
  }, [apiCall, spotifyApi]);

  // Search for albums
  const searchAlbums = useCallback(async (query, options = {}) => {
    return apiCall(spotifyApi.searchAlbums, query, options);
  }, [apiCall, spotifyApi]);

  // Get recommendations based on seed tracks
  const getRecommendations = useCallback(async (options) => {
    return apiCall(spotifyApi.getRecommendations, options);
  }, [apiCall, spotifyApi]);

  // Get new releases
  const getNewReleases = useCallback(async (options = {}) => {
    return apiCall(spotifyApi.getNewReleases, options);
  }, [apiCall, spotifyApi]);

  // Get featured playlists
  const getFeaturedPlaylists = useCallback(async (options = {}) => {
    try {
      // Add market parameter if not provided
      const optionsWithMarket = {
        ...options,
        country: options.country || 'US', // Default to US market
        locale: options.locale || 'en_US', // Add locale parameter
        limit: options.limit || 10 // Reduce limit to avoid rate limiting
      };
      
      console.log(`Attempting to fetch featured playlists with options:`, optionsWithMarket);
      
      // Try to get featured playlists
      const response = await apiCall(spotifyApi.getFeaturedPlaylists, optionsWithMarket);
      console.log('Successfully fetched featured playlists');
      return response;
    } catch (err) {
      console.error('Error getting featured playlists:', err);
      
      // Check for specific error types
      if (err.status === 404) {
        console.log('Featured playlists returned 404 - likely due to regional restrictions or account type');
        // Return a structured empty response with a helpful message
        return {
          playlists: {
            items: [],
            total: 0,
            limit: options.limit || 10,
            offset: options.offset || 0,
            href: null,
            next: null,
            previous: null
          },
          message: 'Featured playlists are not available in your region or with your account type. This is normal for some Spotify accounts.'
        };
      }
      
      // For other errors, return a generic empty response
      return {
        playlists: {
          items: [],
          total: 0,
          limit: options.limit || 10,
          offset: options.offset || 0,
          href: null,
          next: null,
          previous: null
        },
        message: `Unable to load featured playlists (${err.status || 'unknown error'}). Please try again later.`
      };
    }
  }, [apiCall, spotifyApi]);

  // Get user's top tracks
  const getTopTracks = useCallback(async (options = {}) => {
    return apiCall(spotifyApi.getMyTopTracks, options);
  }, [apiCall, spotifyApi]);

  // Get user's top artists
  const getTopArtists = useCallback(async (options = {}) => {
    try {
      return await apiCall(spotifyApi.getMyTopArtists, options);
    } catch (err) {
      console.error('Error getting top artists:', err);
      // Return a structured empty response instead of throwing
      return {
        items: [],
        total: 0,
        limit: options.limit || 20,
        offset: options.offset || 0
      };
    }
  }, [apiCall, spotifyApi]);

  // Get comprehensive track analysis (features + analysis)
  const getTrackAnalysis = useCallback(async (trackId) => {
    try {
      // Get both audio features and analysis in parallel
      const [features, analysis] = await Promise.all([
        getAudioFeatures(trackId),
        getAudioAnalysis(trackId)
      ]);
      
      // Check if either result is limited (403 error fallback)
      const isLimited = features._limited || analysis._limited;
      
      return { 
        features, 
        analysis,
        limited: isLimited // Add a flag to indicate if this is limited data
      };
    } catch (err) {
      console.error('Error getting track analysis:', err);
      
      // Return a minimal structure that won't break the app
      return {
        features: {
          energy: 0.5,
          danceability: 0.5,
          valence: 0.5,
          acousticness: 0.5,
          instrumentalness: 0.5
        },
        analysis: {
          sections: [],
          segments: [],
          beats: [],
          bars: []
        },
        limited: true // This is limited data
      };
    }
  }, [getAudioFeatures, getAudioAnalysis]);

  // Get personalized track recommendations
  const getTrackRecommendations = useCallback(async (trackId) => {
    try {
      // Get user's top tracks for personalization
      const topTracks = await getTopTracks({ limit: 5 });
      const topTrackIds = topTracks.items.map(track => track.id);
      
      // Get recommendations based on this track and user's top tracks
      const recommendationSeeds = {
        seed_tracks: [trackId, ...topTrackIds.slice(0, 4)].slice(0, 5),
        limit: 10
      };
      
      const recommendations = await getRecommendations(recommendationSeeds);
      return recommendations.tracks;
    } catch (err) {
      console.error('Error getting track recommendations:', err);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }, [getTopTracks, getRecommendations]);

  // Detect highlights in a track based on audio features and analysis
  const detectHighlights = useCallback(async (trackId) => {
    try {
      // Get both audio features and analysis
      const { features, analysis, limited } = await getTrackAnalysis(trackId);
      
      // If we have limited data, return a default highlight
      if (limited || !analysis.sections || analysis.sections.length === 0) {
        console.log('Using fallback highlights due to limited data');
        // Return a default highlight at the beginning of the track
        return [{
          start: 0,
          duration: 30,
          confidence: 1.0,
          loudness: -10,
          tempo: 120
        }];
      }
      
      // Extract sections with high energy and danceability
      const highlights = analysis.sections
        .filter(section => {
          // Find sections with high energy, danceability, or loudness
          return (
            section.loudness > analysis.track.loudness_max * 0.8 ||
            (features.energy > 0.7 && section.duration > 10) ||
            (features.danceability > 0.7 && section.duration > 10)
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
      if (highlights.length === 0 && analysis.sections.length > 0) {
        const firstSection = analysis.sections[0];
        highlights.push({
          start: firstSection.start,
          duration: Math.min(firstSection.duration, 30),
          confidence: firstSection.confidence,
          loudness: firstSection.loudness,
          tempo: firstSection.tempo
        });
      }
      
      // Return the top 3 highlights or all if less than 3
      return highlights.slice(0, 3);
    } catch (err) {
      console.error('Error detecting highlights:', err);
      // Return a default highlight at the beginning of the track
      return [{
        start: 0,
        duration: 30,
        confidence: 1.0,
        loudness: -10,
        tempo: 120
      }];
    }
  }, [getTrackAnalysis]);

  // Get similar tracks based on audio features
  const getSimilarTracks = useCallback(async (trackId) => {
    try {
      // Get audio features for the track
      const features = await getAudioFeatures(trackId);
      
      // Create recommendation parameters based on audio features
      const params = {
        seed_tracks: [trackId],
        target_energy: features.energy,
        target_danceability: features.danceability,
        target_valence: features.valence,
        target_acousticness: features.acousticness,
        target_instrumentalness: features.instrumentalness,
        limit: 5
      };
      
      // Get recommendations
      const recommendations = await getRecommendations(params);
      return recommendations.tracks;
    } catch (err) {
      console.error('Error getting similar tracks:', err);
      return [];
    }
  }, [getAudioFeatures, getRecommendations]);

  // Check if albums are saved in the user's library
  const checkSavedAlbums = useCallback(async (albumIds) => {
    try {
      // First, we need to check if the albums are in the user's library
      // Spotify doesn't have a direct API for this, so we'll check if any tracks from the album are saved
      const response = await apiCall(spotifyApi.containsMySavedAlbums, albumIds);
      return response;
    } catch (err) {
      console.error('Error checking saved albums:', err);
      // Return a default response (all false) to avoid breaking the UI
      return albumIds.map(() => false);
    }
  }, [apiCall, spotifyApi]);

  // Save albums to the user's library
  const saveAlbums = useCallback(async (albumIds) => {
    try {
      return await apiCall(spotifyApi.addToMySavedAlbums, albumIds);
    } catch (err) {
      console.error('Error saving albums:', err);
      throw err;
    }
  }, [apiCall, spotifyApi]);

  // Remove albums from the user's library
  const removeAlbums = useCallback(async (albumIds) => {
    try {
      return await apiCall(spotifyApi.removeFromMySavedAlbums, albumIds);
    } catch (err) {
      console.error('Error removing albums:', err);
      throw err;
    }
  }, [apiCall, spotifyApi]);

  return {
    loading,
    error,
    getUserAlbums,
    getAlbum,
    getAlbumTracks,
    getAudioFeatures,
    getMultipleAudioFeatures,
    getAudioAnalysis,
    searchAlbums,
    getRecommendations,
    getNewReleases,
    getFeaturedPlaylists,
    getTopTracks,
    getTopArtists,
    detectHighlights,
    getTrackAnalysis,
    getTrackRecommendations,
    getSimilarTracks,
    checkSavedAlbums,
    saveAlbums,
    removeAlbums
  };
};

export default useSpotifyAPI; 