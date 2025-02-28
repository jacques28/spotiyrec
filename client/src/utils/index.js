/**
 * Utility functions index file
 * Exports all utility functions from various utility modules
 */

// Export API utilities
export * from './api';

// Export formatting utilities
export * from './formatters';

// Export storage utilities
export * from './localStorage';

// Export theme utilities
export * from './theme';

// Export validation utilities
export * from './validation';

// Export error handling utilities
export * from './errorHandling';

// Export audio analysis utilities
export * from './audioAnalysis';

// Export track analysis utilities
export * from './trackAnalysis';

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Error deep cloning object:', error);
    return { ...obj };
  }
};

/**
 * Group an array of objects by a key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by or function that returns the key
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort an array of objects by a key
 * @param {Array} array - Array to sort
 * @param {string|Function} key - Key to sort by or function that returns the key
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export const sortBy = (array, key, direction = 'asc') => {
  const sortedArray = [...array];
  const directionMultiplier = direction.toLowerCase() === 'desc' ? -1 : 1;
  
  return sortedArray.sort((a, b) => {
    const aValue = typeof key === 'function' ? key(a) : a[key];
    const bValue = typeof key === 'function' ? key(b) : b[key];
    
    if (aValue < bValue) return -1 * directionMultiplier;
    if (aValue > bValue) return 1 * directionMultiplier;
    return 0;
  });
};

/**
 * Chunk an array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export const chunkArray = (array, size = 10) => {
  const chunks = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

/**
 * Flatten an array of arrays
 * @param {Array} array - Array to flatten
 * @returns {Array} Flattened array
 */
export const flattenArray = (array) => {
  return array.reduce((result, item) => {
    return result.concat(Array.isArray(item) ? flattenArray(item) : item);
  }, []);
};

/**
 * Get a random item from an array
 * @param {Array} array - Array to get item from
 * @returns {any} Random item
 */
export const getRandomItem = (array) => {
  if (!array || !array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}; 