/**
 * Utility functions for error handling
 */

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network error. Please check your internet connection.',
  [ERROR_TYPES.API]: 'Error communicating with the server.',
  [ERROR_TYPES.AUTH]: 'Authentication error. Please log in again.',
  [ERROR_TYPES.VALIDATION]: 'Invalid data provided.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred.',
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {string} type - Error type from ERROR_TYPES
   * @param {Object} details - Additional error details
   * @param {Error} originalError - Original error object
   */
  constructor(message, type = ERROR_TYPES.UNKNOWN, details = {}, originalError = null) {
    super(message || ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle API errors from axios responses
 * @param {Error} error - Axios error object
 * @returns {AppError} Standardized AppError
 */
export const handleApiError = (error) => {
  // Default error type and message
  let errorType = ERROR_TYPES.UNKNOWN;
  let errorMessage = ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  let errorDetails = {};

  // Check if it's an axios error with a response
  if (error.response) {
    const { status, data } = error.response;
    
    // Set error details from response
    errorDetails = {
      status,
      data,
      endpoint: error.config?.url,
      method: error.config?.method,
    };
    
    // Determine error type based on status code
    switch (status) {
      case 400:
        errorType = ERROR_TYPES.VALIDATION;
        errorMessage = data.message || 'Invalid request data.';
        break;
      case 401:
      case 403:
        errorType = ERROR_TYPES.AUTH;
        errorMessage = data.message || 'Authentication error. Please log in again.';
        break;
      case 404:
        errorType = ERROR_TYPES.NOT_FOUND;
        errorMessage = data.message || 'The requested resource was not found.';
        break;
      case 408:
      case 504:
        errorType = ERROR_TYPES.TIMEOUT;
        errorMessage = data.message || 'Request timed out. Please try again.';
        break;
      case 500:
      case 502:
      case 503:
        errorType = ERROR_TYPES.API;
        errorMessage = data.message || 'Server error. Please try again later.';
        break;
      default:
        errorType = ERROR_TYPES.API;
        errorMessage = data.message || 'An error occurred while communicating with the server.';
    }
  } else if (error.request) {
    // Request was made but no response received
    errorType = ERROR_TYPES.NETWORK;
    errorMessage = 'No response received from the server. Please check your internet connection.';
    errorDetails = {
      request: error.request,
      endpoint: error.config?.url,
      method: error.config?.method,
    };
  } else {
    // Error in setting up the request
    errorType = ERROR_TYPES.UNKNOWN;
    errorMessage = error.message || 'An error occurred while setting up the request.';
  }
  
  // Create and return standardized error
  return new AppError(errorMessage, errorType, errorDetails, error);
};

/**
 * Log an error to the console with additional context
 * @param {Error|AppError} error - Error object
 * @param {string} context - Context where the error occurred
 */
export const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const isAppError = error instanceof AppError;
  
  console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}Error:`, {
    message: error.message,
    type: isAppError ? error.type : 'UNKNOWN',
    details: isAppError ? error.details : {},
    stack: error.stack,
  });
};

/**
 * Get a user-friendly error message
 * @param {Error|AppError} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error.message && error.message.length < 100) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
};

/**
 * Check if an error is a network error
 * @param {Error|AppError} error - Error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  if (error instanceof AppError) {
    return error.type === ERROR_TYPES.NETWORK;
  }
  
  return error.message && (
    error.message.includes('Network Error') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  );
};

/**
 * Check if an error is an authentication error
 * @param {Error|AppError} error - Error object
 * @returns {boolean} True if it's an authentication error
 */
export const isAuthError = (error) => {
  if (error instanceof AppError) {
    return error.type === ERROR_TYPES.AUTH;
  }
  
  if (error.response) {
    return error.response.status === 401 || error.response.status === 403;
  }
  
  return false;
};

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} validationErrors - Validation error details
 * @returns {AppError} Validation error
 */
export const createValidationError = (message, validationErrors = {}) => {
  return new AppError(
    message || 'Validation failed',
    ERROR_TYPES.VALIDATION,
    { validationErrors }
  );
};

/**
 * Handle errors in async functions
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise} Promise that resolves to [error, result]
 */
export const handleAsync = async (fn, options = {}) => {
  const { 
    context = '',
    logErrors = true,
    transformError = (err) => err
  } = options;
  
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    const transformedError = transformError(error);
    
    if (logErrors) {
      logError(transformedError, context);
    }
    
    return [transformedError, null];
  }
}; 