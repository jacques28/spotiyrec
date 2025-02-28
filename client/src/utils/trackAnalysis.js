/**
 * Track Analysis Utility
 * 
 * This utility provides functions for analyzing tracks using machine learning techniques.
 * It processes audio features and analysis data from Spotify's API to identify
 * key musical characteristics, find the most engaging segments, and generate
 * personalized recommendations.
 */

/**
 * Analyzes audio features to determine the musical characteristics of a track
 * 
 * @param {Object} features - Audio features from Spotify API
 * @returns {Object} Object containing musical characteristics
 */
export const analyzeTrackCharacteristics = (features) => {
  if (!features) return null;
  
  const characteristics = {
    energy: {
      value: features.energy,
      label: features.energy > 0.7 ? 'High Energy' : 
             features.energy < 0.4 ? 'Low Energy' : 'Moderate Energy',
      description: features.energy > 0.7 ? 
        'This track has high intensity and activity' : 
        features.energy < 0.4 ? 
        'This track has a calm, relaxed feel' : 
        'This track has a balanced energy level'
    },
    
    danceability: {
      value: features.danceability,
      label: features.danceability > 0.7 ? 'Very Danceable' : 
             features.danceability < 0.4 ? 'Less Danceable' : 'Moderately Danceable',
      description: features.danceability > 0.7 ? 
        'This track has a strong, danceable rhythm' : 
        features.danceability < 0.4 ? 
        'This track has a less conventional rhythm for dancing' : 
        'This track has a moderate dance rhythm'
    },
    
    valence: {
      value: features.valence,
      label: features.valence > 0.7 ? 'Positive' : 
             features.valence < 0.3 ? 'Melancholic' : 'Neutral',
      description: features.valence > 0.7 ? 
        'This track conveys positive, happy emotions' : 
        features.valence < 0.3 ? 
        'This track conveys negative emotions like sadness' : 
        'This track has a balanced emotional tone'
    },
    
    acousticness: {
      value: features.acousticness,
      label: features.acousticness > 0.7 ? 'Acoustic' : 
             features.acousticness < 0.3 ? 'Electronic' : 'Mixed',
      description: features.acousticness > 0.7 ? 
        'This track features primarily acoustic instruments' : 
        features.acousticness < 0.3 ? 
        'This track features primarily electronic elements' : 
        'This track blends acoustic and electronic elements'
    },
    
    instrumentalness: {
      value: features.instrumentalness,
      label: features.instrumentalness > 0.5 ? 'Instrumental' : 'Vocal',
      description: features.instrumentalness > 0.5 ? 
        'This track contains few or no vocals' : 
        'This track features prominent vocals'
    },
    
    tempo: {
      value: features.tempo,
      label: features.tempo > 120 ? 'Fast' : 
             features.tempo < 80 ? 'Slow' : 'Moderate',
      description: `This track has a tempo of ${Math.round(features.tempo)} BPM`
    },
    
    key: {
      value: features.key,
      mode: features.mode,
      label: getKeyName(features.key, features.mode)
    }
  };
  
  return characteristics;
};

/**
 * Identifies the most engaging segments in a track based on audio analysis
 * 
 * @param {Object} analysis - Audio analysis from Spotify API
 * @param {Object} features - Audio features from Spotify API
 * @returns {Array} Array of highlight segments with start times and durations
 */
export const findHighlightSegments = (analysis, features) => {
  if (!analysis || !analysis.sections || !features) {
    return [];
  }
  
  // Score each section based on various factors
  const scoredSections = analysis.sections.map(section => {
    // Calculate a score based on energy, loudness, and confidence
    let score = 0;
    
    // Loudness factor (normalized relative to track's average loudness)
    const loudnessFactor = (section.loudness - analysis.track.loudness_max) / 10;
    score += Math.min(Math.max(loudnessFactor, -1), 1) + 1; // Range: 0-2
    
    // Energy factor
    score += section.energy * 2; // Range: 0-2
    
    // Duration factor (prefer sections between 20-40 seconds)
    const durationScore = section.duration >= 20 && section.duration <= 40 ? 1 : 
                          section.duration > 40 ? 0.5 : 
                          section.duration < 10 ? 0 : 0.5;
    score += durationScore;
    
    // Confidence factor
    score += section.confidence;
    
    // Bonus for chorus-like sections (high energy + high loudness)
    if (section.energy > 0.8 && loudnessFactor > 0) {
      score += 1;
    }
    
    // Bonus for danceable sections in danceable tracks
    if (features.danceability > 0.7 && section.tempo > 100) {
      score += 0.5;
    }
    
    return {
      ...section,
      score
    };
  });
  
  // Sort sections by score (descending)
  const sortedSections = [...scoredSections].sort((a, b) => b.score - a.score);
  
  // Take top 3 sections as highlights
  return sortedSections.slice(0, 3).map(section => ({
    start: Math.round(section.start),
    duration: Math.min(Math.round(section.duration), 30), // Cap at 30 seconds
    score: section.score,
    energy: section.energy,
    tempo: section.tempo,
    loudness: section.loudness
  }));
};

/**
 * Generates personalized recommendation reasons based on track features and user preferences
 * 
 * @param {Object} track - Track object from Spotify API
 * @param {Object} features - Audio features from Spotify API
 * @param {Object} userPreferences - Optional user preference data
 * @returns {Array} Array of recommendation reasons
 */
export const generateRecommendationReasons = (track, features, userPreferences = null) => {
  if (!features) return [];
  
  const reasons = [];
  
  // Based on audio features
  if (features.energy > 0.7) {
    reasons.push('High energy track that matches your preference for energetic music');
  }
  
  if (features.danceability > 0.7) {
    reasons.push('Highly danceable rhythm similar to other tracks you enjoy');
  }
  
  if (features.valence > 0.7) {
    reasons.push('Upbeat and positive mood that aligns with your listening patterns');
  }
  
  if (features.acousticness > 0.7) {
    reasons.push('Acoustic elements that match your interest in organic sounds');
  }
  
  if (features.instrumentalness > 0.5) {
    reasons.push('Instrumental composition with minimal vocals');
  }
  
  // Based on popularity
  if (track.popularity > 70) {
    reasons.push('Currently trending track with high popularity');
  }
  
  // Based on artist
  if (track.artists && track.artists.length > 0) {
    reasons.push(`Created by ${track.artists[0].name}, an artist that matches your taste`);
  }
  
  // If we have user preferences, use them for more personalized reasons
  if (userPreferences) {
    if (userPreferences.favoriteGenres && userPreferences.favoriteGenres.length > 0) {
      reasons.push(`Fits within your preferred ${userPreferences.favoriteGenres[0]} genre`);
    }
    
    if (userPreferences.favoriteArtists && 
        track.artists && 
        userPreferences.favoriteArtists.some(a => track.artists.some(ta => ta.id === a.id))) {
      reasons.push('From an artist in your top played list');
    }
  }
  
  // Add a generic reason if we don't have enough
  if (reasons.length < 2) {
    reasons.push('Musical elements that complement your listening history');
  }
  
  return reasons.slice(0, 3); // Limit to 3 reasons
};

/**
 * Gets the musical key name from the pitch class and mode
 * 
 * @param {number} key - Pitch class (0-11)
 * @param {number} mode - Mode (0 = minor, 1 = major)
 * @returns {string} Key name (e.g., "C Major")
 */
export const getKeyName = (key, mode) => {
  const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const modeName = mode ? 'Major' : 'Minor';
  return key >= 0 ? `${keys[key]} ${modeName}` : 'Unknown';
};

/**
 * Calculates the similarity score between two tracks based on their audio features
 * 
 * @param {Object} features1 - Audio features of first track
 * @param {Object} features2 - Audio features of second track
 * @returns {number} Similarity score (0-1)
 */
export const calculateTrackSimilarity = (features1, features2) => {
  if (!features1 || !features2) return 0;
  
  // Calculate Euclidean distance between feature vectors
  const energyDiff = Math.pow(features1.energy - features2.energy, 2);
  const danceabilityDiff = Math.pow(features1.danceability - features2.danceability, 2);
  const valenceDiff = Math.pow(features1.valence - features2.valence, 2);
  const acousticnessDiff = Math.pow(features1.acousticness - features2.acousticness, 2);
  const instrumentalnessDiff = Math.pow(features1.instrumentalness - features2.instrumentalness, 2);
  
  // Calculate distance (0-sqrt(5))
  const distance = Math.sqrt(
    energyDiff + danceabilityDiff + valenceDiff + acousticnessDiff + instrumentalnessDiff
  );
  
  // Convert to similarity score (0-1)
  const similarity = Math.max(0, 1 - (distance / Math.sqrt(5)));
  
  return similarity;
}; 