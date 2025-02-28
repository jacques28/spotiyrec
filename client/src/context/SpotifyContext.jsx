import React, { createContext, useContext, useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Create a new Spotify API instance
const spotifyApi = new SpotifyWebApi();

// Create the context
const SpotifyContext = createContext();

// Custom hook to use the Spotify context
export const useSpotify = () => useContext(SpotifyContext);

// Provider component
export const SpotifyProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Function to login with Spotify
  const login = () => {
    window.location.href = 'http://localhost:4000/auth/spotify';
  };

  // Function to logout
  const logout = () => {
    setUser(null);
    setAccessToken('');
    setRefreshToken('');
    setExpiresIn(0);
    setIsAuthenticated(false);
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_access_token');
    navigate('/');
  };

  // Function to exchange code for tokens
  const exchangeCodeForTokens = async (code) => {
    try {
      console.log('Exchanging code for tokens...');
      const response = await axios.post('http://localhost:4000/auth/exchange', { code });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      setAccessToken(access_token);
      setExpiresIn(expires_in);
      localStorage.setItem('spotify_access_token', access_token);
      spotifyApi.setAccessToken(access_token);
      setIsAuthenticated(true);
      
      if (refresh_token) {
        setRefreshToken(refresh_token);
        localStorage.setItem('spotify_refresh_token', refresh_token);
      }
      
      // Set timer to refresh token before it expires
      setTimeout(() => {
        refreshAccessToken();
      }, (expires_in - 60) * 1000); // Refresh 1 minute before expiry
      
      return access_token;
    } catch (err) {
      console.error('Error exchanging code for tokens:', err);
      setError('Failed to exchange code for tokens');
      throw err;
    }
  };

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) return;
      
      const response = await axios.post('http://localhost:4000/auth/refresh', {
        refreshToken,
      });
      
      const { accessToken: newAccessToken, expiresIn: newExpiresIn } = response.data;
      
      setAccessToken(newAccessToken);
      setExpiresIn(newExpiresIn);
      localStorage.setItem('spotify_access_token', newAccessToken);
      spotifyApi.setAccessToken(newAccessToken);
      
      return newAccessToken;
    } catch (err) {
      console.error('Error refreshing access token:', err);
      setError('Failed to refresh access token');
      logout();
    }
  };

  // Effect to handle code from URL after authentication
  useEffect(() => {
    const handleCodeFromUrl = async () => {
      // Check if we're on the callback page with query parameters
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');
      
      if (errorParam) {
        setError(`Authentication error: ${errorParam}`);
        setLoading(false);
        return;
      }
      
      if (code && location.pathname === '/callback') {
        try {
          // Exchange code for tokens
          await exchangeCodeForTokens(code);
          
          // Fetch user data
          const userData = await spotifyApi.getMe();
          setUser(userData);
          
          // Clean up URL
          navigate('/', { replace: true });
        } catch (err) {
          console.error('Error during authentication:', err);
          setError('Authentication failed');
        } finally {
          setLoading(false);
        }
      } else {
        // Check for direct token in URL (for backward compatibility)
        const token = urlParams.get('access_token');
        const refresh = urlParams.get('refresh_token');
        const expires = urlParams.get('expires_in');
        
        if (token) {
          setAccessToken(token);
          localStorage.setItem('spotify_access_token', token);
          spotifyApi.setAccessToken(token);
          setIsAuthenticated(true);
          
          if (refresh) {
            setRefreshToken(refresh);
            localStorage.setItem('spotify_refresh_token', refresh);
          }
          
          if (expires) {
            setExpiresIn(parseInt(expires));
            // Set timer to refresh token before it expires
            setTimeout(() => {
              refreshAccessToken();
            }, (parseInt(expires) - 60) * 1000); // Refresh 1 minute before expiry
          }
          
          try {
            const userData = await spotifyApi.getMe();
            setUser(userData);
          } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to fetch user data');
          }
          
          // Clean up URL if we're on the callback page
          if (location.pathname === '/callback') {
            navigate('/', { replace: true });
          }
        }
        
        setLoading(false);
      }
    };
    
    handleCodeFromUrl();
  }, [location, navigate]);

  // Effect to check for stored refresh token on mount
  useEffect(() => {
    const checkStoredTokens = async () => {
      const storedAccessToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
        spotifyApi.setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
        
        try {
          const userData = await spotifyApi.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Error with stored token:', err);
          // Token might be expired, try to refresh
          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
            await refreshAccessToken();
          } else {
            // No refresh token, clear invalid access token
            localStorage.removeItem('spotify_access_token');
            setIsAuthenticated(false);
          }
        }
      }
      
      if (storedRefreshToken && !storedAccessToken) {
        setRefreshToken(storedRefreshToken);
        await refreshAccessToken();
      }
      
      setLoading(false);
    };
    
    checkStoredTokens();
  }, []);

  // Value to be provided by the context
  const value = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    spotifyApi,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export default SpotifyContext; 