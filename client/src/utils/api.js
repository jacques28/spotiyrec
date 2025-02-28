import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from local storage
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/';
          return Promise.reject(error);
        }
        
        // Request new access token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        
        // Save new access token
        localStorage.setItem('spotify_access_token', accessToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions
const apiService = {
  // Authentication
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  
  // User
  getCurrentUser: () => api.get('/api/me'),
  getTopTracks: (params) => api.get('/api/me/top/tracks', { params }),
  getTopArtists: (params) => api.get('/api/me/top/artists', { params }),
  
  // Albums
  getSavedAlbums: (params) => api.get('/api/albums', { params }),
  getAlbum: (id) => api.get(`/api/albums/${id}`),
  getAlbumTracks: (id, params) => api.get(`/api/albums/${id}/tracks`, { params }),
  searchAlbums: (query, params) => api.get('/api/search/albums', { params: { q: query, ...params } }),
  getNewReleases: (params) => api.get('/api/browse/new-releases', { params }),
  
  // Tracks
  getTrackFeatures: (id) => api.get(`/api/tracks/${id}/features`),
  getTrackAnalysis: (id) => api.get(`/api/tracks/${id}/analysis`),
  getTrackHighlights: (id) => api.get(`/api/tracks/${id}/highlights`),
  
  // Recommendations
  getRecommendations: (params) => api.get('/api/recommendations', { params }),
  getFeaturedPlaylists: (params) => api.get('/api/browse/featured-playlists', { params }),
};

export default apiService; 