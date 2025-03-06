const API_BASE_URL = 'http://localhost:4000/apple-music';

class AppleMusicService {
  constructor() {
    this.musicKit = null;
    this.isInitialized = false;
    this.developerToken = null;
    this.currentPlayback = null;
  }

  async getToken() {
    try {
      console.log('Requesting token from server...');
      const response = await fetch(`${API_BASE_URL}/token`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get token:', errorText);
        throw new Error(`Failed to get token: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Token received from server:', data.token ? 'yes (token exists)' : 'no token found');
      return data.token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  async initialize() {
    if (this.isInitialized && this.musicKit) return this.musicKit;

    try {
      if (!window.MusicKit) {
        console.error('MusicKit JS is not loaded');
        throw new Error('MusicKit JS is not loaded. Please check if the script is included in your HTML.');
      }

      // Get the developer token from our backend
      this.developerToken = await this.getToken();
      if (!this.developerToken) {
        console.error('No developer token received from server');
        throw new Error('Failed to get developer token from server');
      }

      console.log('Configuring MusicKit with token length:', this.developerToken ? this.developerToken.length : 'No token');

      // Try to get the token from the meta tag as fallback
      const metaToken = document.querySelector('meta[name="apple-music-developer-token"]')?.getAttribute('content');
      if (!this.developerToken && metaToken && metaToken !== '%VITE_APPLE_DEVELOPER_TOKEN%') {
        console.log('Using token from meta tag instead');
        this.developerToken = metaToken;
      }

      // Configure MusicKit
      this.musicKit = await window.MusicKit.configure({
        developerToken: this.developerToken,
        app: {
          name: 'spotiyrec',
          build: '1.0.0'
        }
      });

      // Add event listeners
      this.musicKit.addEventListener('authorizationStatusDidChange', (event) => {
        console.log('Authorization status changed:', {
          isAuthorized: this.musicKit.isAuthorized,
          musicUserToken: this.musicKit.musicUserToken,
          event
        });
      });

      this.musicKit.addEventListener('playbackStateDidChange', (event) => {
        console.log('Playback state changed:', {
          state: event.state,
          position: this.musicKit.player.currentPlaybackTime,
          duration: this.musicKit.player.currentPlaybackDuration
        });
      });

      this.musicKit.addEventListener('mediaItemDidChange', (event) => {
        console.log('Media item changed:', event.item);
        this.currentPlayback = event.item;
      });

      this.isInitialized = true;
      console.log('MusicKit initialized successfully');
      return this.musicKit;
    } catch (error) {
      console.error('Failed to initialize Apple Music:', error);
      throw error;
    }
  }

  async searchTracks(query) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.musicKit.isAuthorized) {
        throw new Error('Not authorized. Please authorize with Apple Music first.');
      }

      console.log('Searching for:', query);
      console.log('Using Music User Token:', this.musicKit.musicUserToken);

      const term = encodeURIComponent(query);
      const response = await fetch(
        `${API_BASE_URL}/search?query=${term}`,
        {
          headers: {
            'Music-User-Token': this.musicKit.musicUserToken
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search error response:', errorText);
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw search results:', data);

      // Handle different response formats and enrich track data
      let tracks = [];
      if (data.songs && data.songs.data) {
        tracks = data.songs.data;
      } else if (data.results && data.results.songs && data.results.songs.data) {
        tracks = data.results.songs.data;
      }

      // Enrich track data with additional information
      tracks = tracks.map(track => ({
        ...track,
        attributes: {
          ...track.attributes,
          previews: track.attributes.previews || [],
          artwork: {
            ...track.attributes.artwork,
            url: track.attributes.artwork?.url?.replace('{w}', '1000').replace('{h}', '1000')
          }
        }
      }));

      return { songs: { data: tracks } };
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async getRecommendations() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.musicKit.isAuthorized) {
        throw new Error('Not authorized. Please authorize with Apple Music first.');
      }

      console.log('Getting recommendations');
      console.log('Using Music User Token:', this.musicKit.musicUserToken);

      const response = await fetch(
        `${API_BASE_URL}/recommendations`,
        {
          headers: {
            'Music-User-Token': this.musicKit.musicUserToken
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recommendations error response:', errorText);
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw recommendations:', data);

      // Handle different response formats and enrich track data
      let tracks = [];
      if (data.data) {
        tracks = data.data;
      } else if (data.results && data.results.songs) {
        tracks = data.results.songs.data;
      } else if (data.songs && data.songs.data) {
        tracks = data.songs.data;
      }

      // Enrich track data with additional information
      tracks = tracks.map(track => ({
        ...track,
        attributes: {
          ...track.attributes,
          previews: track.attributes.previews || [],
          artwork: {
            ...track.attributes.artwork,
            url: track.attributes.artwork?.url?.replace('{w}', '1000').replace('{h}', '1000')
          }
        }
      }));

      return tracks;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  async authorize() {
    try {
      await this.initialize();
      
      if (this.musicKit.isAuthorized) {
        console.log('Already authorized with Apple Music');
        return { authorized: true, message: 'Already authorized' };
      }

      console.log('Requesting Apple Music authorization...');
      await this.musicKit.authorize();
      
      // Wait a bit to ensure the authorization is processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isAuthorized = this.musicKit.isAuthorized;
      console.log('Authorization status:', { 
        isAuthorized,
        musicUserToken: this.musicKit.musicUserToken
      });
      
      if (!isAuthorized) {
        throw new Error('Authorization failed or was cancelled');
      }
      
      return { 
        authorized: true, 
        message: 'Authorization successful',
        musicUserToken: this.musicKit.musicUserToken
      };
    } catch (error) {
      console.error('Error authorizing with Apple Music:', error);
      throw error;
    }
  }

  async playTrack(track) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.musicKit.isAuthorized) {
        throw new Error('Not authorized. Please authorize with Apple Music first.');
      }

      if (!track.attributes?.previews?.[0]?.url) {
        throw new Error('No preview available for this track');
      }

      return {
        previewUrl: track.attributes.previews[0].url,
        artwork: track.attributes.artwork,
        title: track.attributes.name,
        artist: track.attributes.artistName,
        album: track.attributes.albumName
      };
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  // Helper method to check if a user has an active Apple Music subscription
  async checkSubscription() {
    try {
      if (!this.musicKit) {
        await this.initialize();
      }
      return this.musicKit.isAuthorized && await this.musicKit.api.hasCapabilities(['playback']);
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Helper method to format track duration
  formatDuration(durationInMillis) {
    if (!durationInMillis) return '0:00';
    const minutes = Math.floor(durationInMillis / 60000);
    const seconds = ((durationInMillis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  }
}

export default new AppleMusicService(); 