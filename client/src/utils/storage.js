/**
 * Utility functions for handling local storage operations
 */

// Keys used in local storage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRY_TIME: 'spotify_token_expiry_time',
  USER_DATA: 'spotify_user_data',
  THEME: 'app_theme',
  RECENTLY_PLAYED: 'recently_played_albums',
  VOLUME: 'player_volume',
  FAVORITES: 'favorite_albums'
};

/**
 * Set an item in local storage with optional expiry
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} expiryInMinutes - Optional expiry time in minutes
 */
export const setStorageItem = (key, value, expiryInMinutes = null) => {
  try {
    const item = {
      value: value
    };
    
    // Add expiry time if specified
    if (expiryInMinutes) {
      const now = new Date();
      item.expiry = now.getTime() + expiryInMinutes * 60 * 1000;
    }
    
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting localStorage item:', error);
  }
};

/**
 * Get an item from local storage, respecting expiry if set
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Stored value or default value
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const itemStr = localStorage.getItem(key);
    
    // Return default value if item doesn't exist
    if (!itemStr) {
      return defaultValue;
    }
    
    const item = JSON.parse(itemStr);
    
    // Check if the item has expired
    if (item.expiry && new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error getting localStorage item:', error);
    return defaultValue;
  }
};

/**
 * Remove an item from local storage
 * @param {string} key - Storage key
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing localStorage item:', error);
  }
};

/**
 * Clear all app-related items from local storage
 */
export const clearAppStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing app storage:', error);
  }
};

/**
 * Store authentication tokens
 * @param {Object} tokens - Object containing access_token, refresh_token, and expires_in
 */
export const storeTokens = (tokens) => {
  if (!tokens) return;
  
  const { access_token, refresh_token, expires_in } = tokens;
  
  if (access_token) {
    setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
  }
  
  if (refresh_token) {
    setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
  }
  
  if (expires_in) {
    const expiryTime = new Date().getTime() + (expires_in * 1000);
    setStorageItem(STORAGE_KEYS.EXPIRY_TIME, expiryTime);
  }
};

/**
 * Get stored authentication tokens
 * @returns {Object} Object containing access_token, refresh_token, and expiry_time
 */
export const getTokens = () => {
  return {
    access_token: getStorageItem(STORAGE_KEYS.ACCESS_TOKEN, null),
    refresh_token: getStorageItem(STORAGE_KEYS.REFRESH_TOKEN, null),
    expiry_time: getStorageItem(STORAGE_KEYS.EXPIRY_TIME, 0)
  };
};

/**
 * Check if the access token has expired
 * @returns {boolean} True if token has expired
 */
export const isTokenExpired = () => {
  const expiryTime = getStorageItem(STORAGE_KEYS.EXPIRY_TIME, 0);
  return new Date().getTime() > expiryTime;
};

/**
 * Store user data
 * @param {Object} userData - User data object
 */
export const storeUserData = (userData) => {
  if (!userData) return;
  setStorageItem(STORAGE_KEYS.USER_DATA, userData);
};

/**
 * Get stored user data
 * @returns {Object|null} User data object or null
 */
export const getUserData = () => {
  return getStorageItem(STORAGE_KEYS.USER_DATA, null);
};

/**
 * Add an album to recently played
 * @param {Object} album - Album object
 * @param {number} maxItems - Maximum number of items to store
 */
export const addToRecentlyPlayed = (album, maxItems = 10) => {
  if (!album || !album.id) return;
  
  const recentlyPlayed = getStorageItem(STORAGE_KEYS.RECENTLY_PLAYED, []);
  
  // Remove the album if it already exists in the list
  const filteredList = recentlyPlayed.filter(item => item.id !== album.id);
  
  // Add the album to the beginning of the list
  const updatedList = [album, ...filteredList].slice(0, maxItems);
  
  setStorageItem(STORAGE_KEYS.RECENTLY_PLAYED, updatedList);
};

/**
 * Get recently played albums
 * @returns {Array} Array of recently played albums
 */
export const getRecentlyPlayed = () => {
  return getStorageItem(STORAGE_KEYS.RECENTLY_PLAYED, []);
};

/**
 * Toggle an album as favorite
 * @param {Object} album - Album object
 * @returns {boolean} New favorite status
 */
export const toggleFavorite = (album) => {
  if (!album || !album.id) return false;
  
  const favorites = getStorageItem(STORAGE_KEYS.FAVORITES, {});
  
  if (favorites[album.id]) {
    // Remove from favorites
    delete favorites[album.id];
    setStorageItem(STORAGE_KEYS.FAVORITES, favorites);
    return false;
  } else {
    // Add to favorites
    favorites[album.id] = {
      id: album.id,
      name: album.name,
      artists: album.artists,
      images: album.images,
      addedAt: new Date().toISOString()
    };
    setStorageItem(STORAGE_KEYS.FAVORITES, favorites);
    return true;
  }
};

/**
 * Check if an album is favorited
 * @param {string} albumId - Album ID
 * @returns {boolean} True if album is favorited
 */
export const isFavorite = (albumId) => {
  if (!albumId) return false;
  
  const favorites = getStorageItem(STORAGE_KEYS.FAVORITES, {});
  return !!favorites[albumId];
};

/**
 * Get all favorite albums
 * @returns {Array} Array of favorite albums
 */
export const getFavorites = () => {
  const favorites = getStorageItem(STORAGE_KEYS.FAVORITES, {});
  return Object.values(favorites);
}; 