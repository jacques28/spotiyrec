/**
 * Utility functions for processing audio analysis and features from Spotify API
 */

/**
 * Calculate the average value of a specific feature across all segments
 * @param {Array} segments - Audio analysis segments
 * @param {string} feature - Feature name to average
 * @returns {number} Average value
 */
export const calculateAverageFeature = (segments, feature) => {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return 0;
  }
  
  const sum = segments.reduce((total, segment) => {
    return total + (segment[feature] || 0);
  }, 0);
  
  return sum / segments.length;
};

/**
 * Find segments with high confidence and intensity
 * @param {Object} analysis - Audio analysis object
 * @param {number} confidenceThreshold - Minimum confidence threshold (0-1)
 * @param {number} loudnessThreshold - Minimum loudness threshold (dB)
 * @returns {Array} Filtered segments
 */
export const findSignificantSegments = (analysis, confidenceThreshold = 0.7, loudnessThreshold = -20) => {
  if (!analysis || !analysis.segments || !Array.isArray(analysis.segments)) {
    return [];
  }
  
  return analysis.segments.filter(segment => 
    segment.confidence >= confidenceThreshold && 
    segment.loudness_max >= loudnessThreshold
  );
};

/**
 * Detect potential highlights in a track based on audio analysis
 * @param {Object} analysis - Audio analysis object
 * @param {Object} features - Audio features object
 * @param {number} count - Number of highlights to detect
 * @returns {Array} Detected highlights with start and end times
 */
export const detectHighlights = (analysis, features, count = 3) => {
  if (!analysis || !analysis.sections || !analysis.segments || !features) {
    return [];
  }
  
  // Find sections with high energy
  const sections = analysis.sections.map((section, index) => ({
    ...section,
    index,
    score: calculateSectionScore(section, features)
  }));
  
  // Sort sections by score
  const sortedSections = [...sections].sort((a, b) => b.score - a.score);
  
  // Take top N sections as highlights
  const topSections = sortedSections.slice(0, count);
  
  // Sort back by time
  const orderedHighlights = topSections.sort((a, b) => a.start - b.start);
  
  // Format highlights with start and end times
  return orderedHighlights.map(section => ({
    start: section.start,
    end: section.start + section.duration,
    duration: section.duration,
    score: section.score,
    loudness: section.loudness,
    tempo: section.tempo
  }));
};

/**
 * Calculate a score for a section based on various factors
 * @param {Object} section - Section from audio analysis
 * @param {Object} features - Audio features
 * @returns {number} Score value
 */
const calculateSectionScore = (section, features) => {
  // Base score on loudness (normalized)
  const loudnessScore = normalizeLoudness(section.loudness);
  
  // Tempo factor - prefer sections with tempo close to track tempo
  const tempoFactor = 1 - Math.min(Math.abs(section.tempo - features.tempo) / features.tempo, 1);
  
  // Confidence factor
  const confidenceFactor = section.confidence;
  
  // Energy factor from track features
  const energyFactor = features.energy;
  
  // Calculate weighted score
  return (
    loudnessScore * 0.4 +
    tempoFactor * 0.2 +
    confidenceFactor * 0.2 +
    energyFactor * 0.2
  );
};

/**
 * Normalize loudness value to 0-1 range
 * @param {number} loudness - Loudness in dB (typically negative)
 * @returns {number} Normalized value between 0-1
 */
const normalizeLoudness = (loudness) => {
  // Typical loudness range in Spotify analysis is -60 to 0 dB
  // Convert to 0-1 scale
  return Math.min(Math.max((loudness + 60) / 60, 0), 1);
};

/**
 * Get descriptive key name from Spotify's pitch notation
 * @param {number} key - Key value (0-11)
 * @param {number} mode - Mode value (0 for minor, 1 for major)
 * @returns {string} Key name (e.g., "C Major")
 */
export const getKeyName = (key, mode) => {
  if (key === -1) return 'No key detected';
  
  const keyNames = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const modeName = mode === 1 ? 'Major' : 'Minor';
  
  return `${keyNames[key]} ${modeName}`;
};

/**
 * Get tempo description based on BPM
 * @param {number} tempo - Tempo in BPM
 * @returns {string} Tempo description
 */
export const getTempoDescription = (tempo) => {
  if (tempo < 60) return 'Very slow';
  if (tempo < 80) return 'Slow';
  if (tempo < 110) return 'Moderate';
  if (tempo < 140) return 'Fast';
  if (tempo < 170) return 'Very fast';
  return 'Extremely fast';
};

/**
 * Get time signature as a string
 * @param {number} timeSignature - Time signature value
 * @returns {string} Formatted time signature
 */
export const getTimeSignature = (timeSignature) => {
  if (timeSignature < 1) return 'Unknown';
  return `${timeSignature}/4`;
};

/**
 * Calculate the energy distribution across the track
 * @param {Object} analysis - Audio analysis object
 * @param {number} segments - Number of segments to divide the track into
 * @returns {Array} Energy values for each segment
 */
export const calculateEnergyDistribution = (analysis, segments = 50) => {
  if (!analysis || !analysis.segments || analysis.segments.length === 0) {
    return Array(segments).fill(0);
  }
  
  const trackDuration = analysis.track.duration;
  const segmentDuration = trackDuration / segments;
  const distribution = Array(segments).fill(0);
  
  // Map each analysis segment to our simplified segments
  analysis.segments.forEach(segment => {
    const segmentIndex = Math.min(
      Math.floor(segment.start / segmentDuration),
      segments - 1
    );
    
    // Use loudness as energy indicator
    const energy = normalizeLoudness(segment.loudness_max);
    distribution[segmentIndex] += energy;
  });
  
  // Normalize each segment by the number of analysis segments it contains
  const analysisSegmentsPerSegment = analysis.segments.length / segments;
  return distribution.map(value => 
    Math.min(value / analysisSegmentsPerSegment, 1)
  );
};

/**
 * Get feature explanation for a specific audio feature
 * @param {string} feature - Feature name
 * @param {number} value - Feature value (0-1)
 * @returns {string} Human-readable explanation
 */
export const getFeatureExplanation = (feature, value) => {
  const explanations = {
    danceability: [
      { threshold: 0.3, text: 'Not very danceable' },
      { threshold: 0.6, text: 'Moderately danceable' },
      { threshold: 1.0, text: 'Very danceable' }
    ],
    energy: [
      { threshold: 0.3, text: 'Low energy' },
      { threshold: 0.6, text: 'Moderate energy' },
      { threshold: 1.0, text: 'High energy' }
    ],
    valence: [
      { threshold: 0.3, text: 'Negative/sad mood' },
      { threshold: 0.6, text: 'Neutral mood' },
      { threshold: 1.0, text: 'Positive/happy mood' }
    ],
    acousticness: [
      { threshold: 0.3, text: 'Not acoustic' },
      { threshold: 0.6, text: 'Partially acoustic' },
      { threshold: 1.0, text: 'Highly acoustic' }
    ],
    instrumentalness: [
      { threshold: 0.3, text: 'Contains vocals' },
      { threshold: 0.6, text: 'Mix of vocals and instrumental' },
      { threshold: 1.0, text: 'Primarily instrumental' }
    ],
    liveness: [
      { threshold: 0.3, text: 'Studio recording' },
      { threshold: 0.6, text: 'Possible live elements' },
      { threshold: 1.0, text: 'Live performance' }
    ],
    speechiness: [
      { threshold: 0.3, text: 'Music, not speech' },
      { threshold: 0.6, text: 'Mix of music and speech' },
      { threshold: 1.0, text: 'Speech-heavy' }
    ]
  };
  
  if (!explanations[feature]) {
    return 'No explanation available';
  }
  
  for (const level of explanations[feature]) {
    if (value <= level.threshold) {
      return level.text;
    }
  }
  
  return 'No explanation available';
}; 