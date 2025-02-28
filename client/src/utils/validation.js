/**
 * Utility functions for validation
 */

/**
 * Check if a value is empty (null, undefined, empty string, or empty array/object)
 * @param {any} value - Value to check
 * @returns {boolean} True if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
};

/**
 * Validate if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export const isValidUrl = (url) => {
  if (isEmpty(url)) return false;
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate if a string is a valid Spotify URI
 * @param {string} uri - Spotify URI to validate
 * @returns {boolean} True if URI is valid
 */
export const isValidSpotifyUri = (uri) => {
  if (isEmpty(uri)) return false;
  
  // Spotify URI format: spotify:type:id
  const regex = /^spotify:(album|artist|track|playlist|show|episode):([a-zA-Z0-9]{22})$/;
  return regex.test(uri);
};

/**
 * Validate if a string is a valid Spotify ID
 * @param {string} id - Spotify ID to validate
 * @returns {boolean} True if ID is valid
 */
export const isValidSpotifyId = (id) => {
  if (isEmpty(id)) return false;
  
  // Spotify IDs are 22 characters long and alphanumeric
  const regex = /^[a-zA-Z0-9]{22}$/;
  return regex.test(id);
};

/**
 * Validate if a value is a valid number
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a valid number
 */
export const isValidNumber = (value) => {
  if (isEmpty(value)) return false;
  
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  }
  
  return false;
};

/**
 * Validate if a value is within a specified range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if value is within range
 */
export const isInRange = (value, min, max) => {
  if (!isValidNumber(value)) return false;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue >= min && numValue <= max;
};

/**
 * Validate if a string is a valid email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  if (isEmpty(email)) return false;
  
  // Basic email validation regex
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate if a string has a minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if string has minimum length
 */
export const hasMinLength = (value, minLength) => {
  if (isEmpty(value) || typeof value !== 'string') return false;
  
  return value.length >= minLength;
};

/**
 * Validate if a string has a maximum length
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if string has maximum length
 */
export const hasMaxLength = (value, maxLength) => {
  if (isEmpty(value) || typeof value !== 'string') return true; // Empty strings are valid for max length
  
  return value.length <= maxLength;
};

/**
 * Validate if a value matches a regular expression
 * @param {string} value - Value to validate
 * @param {RegExp} regex - Regular expression to match
 * @returns {boolean} True if value matches regex
 */
export const matchesRegex = (value, regex) => {
  if (isEmpty(value) || typeof value !== 'string') return false;
  
  return regex.test(value);
};

/**
 * Validate if a value is one of the allowed values
 * @param {any} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} True if value is allowed
 */
export const isAllowedValue = (value, allowedValues) => {
  if (isEmpty(allowedValues) || !Array.isArray(allowedValues)) return false;
  
  return allowedValues.includes(value);
};

/**
 * Validate if an object has all required properties
 * @param {Object} obj - Object to validate
 * @param {Array} requiredProps - Array of required property names
 * @returns {boolean} True if object has all required properties
 */
export const hasRequiredProps = (obj, requiredProps) => {
  if (isEmpty(obj) || !obj || typeof obj !== 'object') return false;
  if (isEmpty(requiredProps) || !Array.isArray(requiredProps)) return false;
  
  return requiredProps.every(prop => 
    Object.prototype.hasOwnProperty.call(obj, prop) && !isEmpty(obj[prop])
  );
};

/**
 * Validate if a value is a valid date
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a valid date
 */
export const isValidDate = (value) => {
  if (isEmpty(value)) return false;
  
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
};

/**
 * Validate if a date is in the future
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  return dateObj > now;
};

/**
 * Validate if a date is in the past
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  return dateObj < now;
}; 