import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceReady, setDeviceReady] = useState(false);
  
  // Add a ref to track if we're currently exchanging a code
  const isExchangingCode = useRef(false);
  // Add a ref to track which code we've already processed
  const processedCode = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Spotiyrec Web Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setDeviceReady(true);
        
        // Transfer playback to this device
        spotifyApi.transferMyPlayback([device_id], { play: false })
          .then(() => {
            console.log('Transferred playback to current device');
          })
          .catch(err => {
            console.error('Error transferring playback:', err);
          });
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      spotifyPlayer.connect()
        .then(success => {
          if (success) {
            console.log('Connected to Spotify Web Playback SDK');
            setPlayer(spotifyPlayer);
          }
        });

      return () => {
        spotifyPlayer.disconnect();
      };
    };
  }, [accessToken]);

  // Function to login with Spotify
  const login = () => {
    window.location.href = 'http://localhost:4000/auth/spotify';
  };

  // Function to logout
  const logout = () => {
    if (player) {
      player.disconnect();
    }
    setUser(null);
    setAccessToken('');
    setRefreshToken('');
    setExpiresIn(0);
    setIsAuthenticated(false);
    setDeviceId(null);
    setDeviceReady(false);
    setPlayer(null);
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_access_token');
    // Reset the processed code ref
    processedCode.current = null;
    navigate('/');
  };

  // Function to exchange code for tokens
  const exchangeCodeForTokens = async (code) => {
    // Prevent duplicate exchange attempts for the same code
    if (isExchangingCode.current) {
      console.log('Already exchanging a code, skipping duplicate request');
      return null;
    }
    
    // Check if we've already processed this code
    if (processedCode.current === code) {
      console.log('This code has already been processed');
      return accessToken;
    }
    
    try {
      isExchangingCode.current = true;
      processedCode.current = code;
      
      console.log('Exchanging code for tokens...');
      const response = await axios.post('http://localhost:4000/auth/exchange', { code });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
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
      
      // Check for specific error types
      if (err.response?.data?.code === 'invalid_grant') {
        setError('Authorization code has expired or has already been used. Please try logging in again.');
      } else {
        setError('Failed to exchange code for tokens: ' + (err.response?.data?.message || err.message));
      }
      
      // Reset the processed code ref so the user can try again
      processedCode.current = null;
      throw err;
    } finally {
      isExchangingCode.current = false;
    }
  };

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
    
    try {
      if (!storedRefreshToken) {
        console.error('No refresh token available');
        setIsAuthenticated(false);
        return null;
      }
      
      console.log('Refreshing access token...');
      const response = await axios.post('http://localhost:4000/auth/refresh', {
        refreshToken: storedRefreshToken,
      });
      
      const { accessToken: newAccessToken, expiresIn: newExpiresIn } = response.data;
      
      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }
      
      console.log('Token refreshed successfully');
      setAccessToken(newAccessToken);
      setExpiresIn(newExpiresIn);
      localStorage.setItem('spotify_access_token', newAccessToken);
      spotifyApi.setAccessToken(newAccessToken);
      setIsAuthenticated(true);
      
      // Set timer to refresh token before it expires
      setTimeout(() => {
        refreshAccessToken();
      }, (newExpiresIn - 60) * 1000); // Refresh 1 minute before expiry
      
      return newAccessToken;
    } catch (err) {
      console.error('Error refreshing access token:', err);
      
      // Check for specific error types
      if (err.response?.status === 400) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to refresh access token: ' + (err.response?.data?.message || err.message));
      }
      
      // Clear tokens and authentication state
      setAccessToken('');
      localStorage.removeItem('spotify_access_token');
      setIsAuthenticated(false);
      
      // Don't automatically logout to allow user to re-login
      // Only clear the invalid access token
      return null;
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
        // Check if we've already processed this code
        if (processedCode.current === code) {
          console.log('This code has already been processed, skipping');
          setLoading(false);
          navigate('/', { replace: true });
          return;
        }
        
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
          setError('Authentication failed: ' + (err.response?.data?.message || err.message));
          // Don't navigate away so user can see the error
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
          
          // Set timer to refresh token before it expires (assuming 50 minutes left)
          // This ensures the token gets refreshed even after a page reload
          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
            setTimeout(() => {
              refreshAccessToken();
            }, 50 * 60 * 1000); // Refresh after 50 minutes
          }
        } catch (err) {
          console.error('Error with stored token:', err);
          // Token might be expired, try to refresh
          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
            const newToken = await refreshAccessToken();
            if (!newToken) {
              // If refresh failed, clear authentication state
              setIsAuthenticated(false);
            }
          } else {
            // No refresh token, clear invalid access token
            localStorage.removeItem('spotify_access_token');
            setIsAuthenticated(false);
          }
        }
      } else if (storedRefreshToken) {
        setRefreshToken(storedRefreshToken);
        const newToken = await refreshAccessToken();
        if (!newToken) {
          // If refresh failed, clear authentication state
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkStoredTokens();
  }, []);

  // Spotify API methods
  const searchTracks = async (query) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return spotifyApi.searchTracks(query);
  };

  const getRecommendations = async () => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    try {
      const topTracks = await spotifyApi.getMyTopTracks({ limit: 5 });
      if (!topTracks.items || topTracks.items.length === 0) {
        // If no top tracks, use some popular tracks as seeds
        return spotifyApi.getRecommendations({
          seed_tracks: ['11dFghVXANMlKmJXsNCbNl', '7qiZfU4dY1lWllzX7mPBI3'],
          min_popularity: 50
        });
      }
      const seedTracks = topTracks.items.map(track => track.id).slice(0, 5);
      return spotifyApi.getRecommendations({ seed_tracks: seedTracks });
    } catch (err) {
      console.error('Error getting recommendations:', err);
      throw err;
    }
  };

  const playTrack = async (uri) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    if (!deviceReady) throw new Error('Playback device not ready');
    
    try {
      await spotifyApi.play({
        device_id: deviceId,
        uris: [uri]
      });
      setCurrentTrack({ uri });
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing track:', err);
      throw err;
    }
  };

  const pauseTrack = async () => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    if (!deviceReady) throw new Error('Playback device not ready');
    
    try {
      await spotifyApi.pause({ device_id: deviceId });
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing track:', err);
      throw err;
    }
  };

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
    refreshAccessToken,
    searchTracks,
    getRecommendations,
    playTrack,
    pauseTrack,
    currentTrack,
    isPlaying,
    deviceReady,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export default SpotifyContext; 