import { useState, useCallback } from 'react';
import { useSpotify } from '../context/SpotifyContext';

// Custom hook for handling Spotify API requests with loading and error states
const useSpotifyAPI = () => {
  const { spotifyApi } = useSpotify();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic function to make API calls
  const apiCall = useCallback(async (apiMethod, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiMethod.apply(spotifyApi, args);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Spotify API Error:', err);
      setError(err.message || 'An error occurred with the Spotify API');
      setLoading(false);
      throw err;
    }
  }, [spotifyApi]);

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
    return apiCall(spotifyApi.getAudioFeaturesForTrack, trackId);
  }, [apiCall, spotifyApi]);

  // Get multiple tracks' audio features
  const getMultipleAudioFeatures = useCallback(async (trackIds) => {
    return apiCall(spotifyApi.getAudioFeaturesForTracks, trackIds);
  }, [apiCall, spotifyApi]);

  // Get track audio analysis (for detailed timing information)
  const getAudioAnalysis = useCallback(async (trackId) => {
    return apiCall(spotifyApi.getAudioAnalysisForTrack, trackId);
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
        locale: options.locale || 'en_US' // Add locale parameter
      };
      
      return await apiCall(spotifyApi.getFeaturedPlaylists, optionsWithMarket);
    } catch (err) {
      console.error('Error getting featured playlists:', err);
      // Return a structured empty response instead of throwing
      return {
        playlists: {
          items: []
        },
        message: 'Featured playlists not available'
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
      
      return { features, analysis };
    } catch (err) {
      console.error('Error getting track analysis:', err);
      setError('Failed to analyze track');
      throw err;
    }
  }, [getAudioFeatures, getAudioAnalysis, setError]);

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
      const { features, analysis } = await getTrackAnalysis(trackId);
      
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
      
      // Return the top 3 highlights or all if less than 3
      return highlights.slice(0, 3);
    } catch (err) {
      console.error('Error detecting highlights:', err);
      setError('Failed to detect highlights');
      return [];
    }
  }, [getTrackAnalysis, setError]);

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
    getSimilarTracks
  };
};

export default useSpotifyAPI; 