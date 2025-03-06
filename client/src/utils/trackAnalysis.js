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
 * Find the most engaging segments of a track based on audio analysis
 * @param {Object} analysis - The audio analysis data from Spotify API
 * @param {Object} features - The audio features data from Spotify API
 * @param {Object} options - Options for highlight detection
 * @returns {Array} - Array of highlight segments with start time and duration
 */
export const findHighlightSegments = (analysis, features, options = {}) => {
  // Default options
  const {
    maxHighlights = 3,
    minDuration = 20,
    maxDuration = 30,
    minSegmentScore = 0.6
  } = options;
  
  // Check if we have limited data (e.g., from a free Spotify account)
  const isLimited = analysis?._limited || features?._limited;
  
  // If we have limited data or missing analysis, create a default highlight
  if (isLimited || !analysis || !features || !analysis.sections || analysis.sections.length === 0) {
    console.log('Limited data available for highlight detection, using fallback method');
    
    // Create a default highlight at the beginning of the track
    return [{
      start: 0,
      duration: 30,
      energy: features?.energy || 0.5,
      loudness: features?.loudness || -10,
      tempo: features?.tempo || 120,
      score: 0.7,
      reason: 'Preview segment'
    }];
  }
  
  try {
    // Get track sections from analysis
    const { sections, segments, track } = analysis;
    
    // Calculate section scores based on energy, loudness, and tempo
    const sectionScores = sections.map(section => {
      // Calculate base score from section properties
      const energyScore = section.energy * 1.2; // Weight energy more heavily
      const loudnessScore = Math.min(1, Math.max(0, (section.loudness + 30) / 30)); // Normalize loudness
      const tempoScore = Math.min(1, section.tempo / 160); // Normalize tempo
      
      // Calculate section density (number of segments per second)
      const sectionSegments = segments.filter(seg => 
        seg.start >= section.start && seg.start < (section.start + section.duration)
      );
      const segmentDensity = sectionSegments.length / section.duration;
      const densityScore = Math.min(1, segmentDensity / 5); // Normalize density
      
      // Combine scores with weights
      const score = (
        energyScore * 0.4 + 
        loudnessScore * 0.3 + 
        tempoScore * 0.2 + 
        densityScore * 0.1
      );
      
      return {
        start: section.start,
        duration: section.duration,
        energy: section.energy,
        loudness: section.loudness,
        tempo: section.tempo,
        score,
        reason: score > 0.8 ? 'High energy section' : 
                loudnessScore > 0.8 ? 'Prominent, loud section' : 
                tempoScore > 0.8 ? 'Fast-paced section' : 
                'Key musical moment'
      };
    });
    
    // Sort sections by score (descending)
    const sortedSections = [...sectionScores].sort((a, b) => b.score - a.score);
    
    // Filter sections that meet minimum criteria
    const candidateSections = sortedSections.filter(section => 
      section.score >= minSegmentScore && section.duration >= minDuration
    );
    
    // If no sections meet criteria, use the highest scoring section
    if (candidateSections.length === 0 && sortedSections.length > 0) {
      const bestSection = sortedSections[0];
      
      // Ensure minimum duration
      const adjustedDuration = Math.min(
        Math.max(bestSection.duration, minDuration),
        maxDuration
      );
      
      return [{
        ...bestSection,
        duration: adjustedDuration
      }];
    }
    
    // Select top N non-overlapping sections
    const selectedHighlights = [];
    
    for (const section of candidateSections) {
      // Skip if we already have enough highlights
      if (selectedHighlights.length >= maxHighlights) break;
      
      // Adjust duration to be within limits
      const adjustedDuration = Math.min(section.duration, maxDuration);
      
      // Check for overlap with existing highlights
      const overlaps = selectedHighlights.some(highlight => {
        const highlightEnd = highlight.start + highlight.duration;
        const sectionEnd = section.start + adjustedDuration;
        
        return (
          (section.start >= highlight.start && section.start < highlightEnd) ||
          (sectionEnd > highlight.start && sectionEnd <= highlightEnd) ||
          (section.start <= highlight.start && sectionEnd >= highlightEnd)
        );
      });
      
      // Add if no overlap
      if (!overlaps) {
        selectedHighlights.push({
          ...section,
          duration: adjustedDuration
        });
      }
    }
    
    // If we couldn't find non-overlapping sections, just take the top N
    if (selectedHighlights.length === 0 && sortedSections.length > 0) {
      return sortedSections.slice(0, maxHighlights).map(section => ({
        ...section,
        duration: Math.min(section.duration, maxDuration)
      }));
    }
    
    // Sort highlights by start time
    return selectedHighlights.sort((a, b) => a.start - b.start);
  } catch (error) {
    console.error('Error finding highlight segments:', error);
    
    // Return a default highlight as fallback
    return [{
      start: 0,
      duration: 30,
      energy: features?.energy || 0.5,
      loudness: features?.loudness || -10,
      tempo: features?.tempo || 120,
      score: 0.7,
      reason: 'Preview segment'
    }];
  }
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