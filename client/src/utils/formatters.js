/**
 * Format milliseconds to MM:SS format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export const formatDuration = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Format seconds to MM:SS format
 * @param {number} seconds - Seconds
 * @returns {string} Formatted time string
 */
export const formatSeconds = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Format a date string to a readable format
 * @param {string} dateString - Date string in ISO format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Extract year from a date string
 * @param {string} dateString - Date string in ISO format
 * @returns {string} Year
 */
export const extractYear = (dateString) => {
  if (!dateString) return '';
  
  return dateString.split('-')[0];
};

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
};

/**
 * Format artist names from an array of artist objects
 * @param {Array} artists - Array of artist objects
 * @returns {string} Formatted artist names
 */
export const formatArtistNames = (artists) => {
  if (!artists || !Array.isArray(artists) || artists.length === 0) {
    return 'Unknown Artist';
  }
  
  return artists.map(artist => artist.name).join(', ');
};

/**
 * Get appropriate image URL from Spotify image array
 * @param {Array} images - Array of image objects
 * @param {string} size - Size preference ('small', 'medium', 'large')
 * @returns {string} Image URL
 */
export const getImageUrl = (images, size = 'medium') => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return 'https://via.placeholder.com/300?text=No+Image';
  }
  
  // Sort images by size (width)
  const sortedImages = [...images].sort((a, b) => a.width - b.width);
  
  // Return appropriate image based on size preference
  switch (size) {
    case 'small':
      return sortedImages[0]?.url || sortedImages[0]?.url;
    case 'large':
      return sortedImages[sortedImages.length - 1]?.url;
    case 'medium':
    default:
      // Get middle image or fallback to first available
      const middleIndex = Math.floor(sortedImages.length / 2);
      return sortedImages[middleIndex]?.url || sortedImages[0]?.url;
  }
};

/**
 * Convert RGB color to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color code
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

/**
 * Get a readable description of audio features
 * @param {Object} features - Audio features object from Spotify API
 * @returns {Array} Array of feature descriptions
 */
export const getFeatureDescriptions = (features) => {
  if (!features) return [];
  
  const descriptions = [];
  
  if (features.energy > 0.8) descriptions.push('High energy');
  else if (features.energy < 0.4) descriptions.push('Low energy');
  
  if (features.danceability > 0.8) descriptions.push('Very danceable');
  else if (features.danceability > 0.6) descriptions.push('Danceable');
  
  if (features.acousticness > 0.8) descriptions.push('Acoustic');
  
  if (features.instrumentalness > 0.5) descriptions.push('Instrumental');
  
  if (features.valence > 0.8) descriptions.push('Positive mood');
  else if (features.valence < 0.3) descriptions.push('Negative mood');
  
  if (features.tempo > 160) descriptions.push('Fast tempo');
  else if (features.tempo < 80) descriptions.push('Slow tempo');
  
  return descriptions;
}; 