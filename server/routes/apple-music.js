import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const router = express.Router();

// Generate Apple Music API token
const generateToken = () => {
  try {
    if (!process.env.APPLE_PRIVATE_KEY_PATH || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID) {
      console.error('Missing required Apple Music environment variables');
      return null;
    }

    console.log('Reading private key from:', process.env.APPLE_PRIVATE_KEY_PATH);
    const privateKey = fs.readFileSync(process.env.APPLE_PRIVATE_KEY_PATH, 'utf8');
    console.log('Private key loaded successfully');
    
    const payload = {
      iss: process.env.APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15777000
    };

    console.log('Generating token with payload:', JSON.stringify(payload));
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: process.env.APPLE_KEY_ID
      }
    });
    console.log('Token generated successfully, length:', token.length);
    return token;
  } catch (error) {
    console.error('Error generating Apple Music token:', error);
    if (error.code === 'ENOENT') {
      console.error('Private key file not found');
    }
    return null;
  }
};

// Get developer token
router.get('/token', (req, res) => {
  console.log('Token request received');
  try {
    const token = generateToken();
    if (token) {
      console.log('Token generated and sending to client');
      res.json({ token });
    } else {
      throw new Error('Failed to generate token');
    }
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message
    });
  }
});

// Search tracks
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Search request received for query:', query);

    const token = generateToken();
    if (!token) {
      throw new Error('Failed to generate token for search request');
    }

    const musicUserToken = req.headers['music-user-token'];
    console.log('Music User Token present:', !!musicUserToken);

    const url = `https://api.music.apple.com/v1/catalog/us/search`;
    const searchParams = new URLSearchParams({
      term: query,
      types: 'songs,albums,artists',
      limit: '25'
    });

    console.log('Making request to Apple Music API:', `${url}?${searchParams}`);
    console.log('Request headers:', {
      'Authorization': `Bearer ${token.substring(0, 10)}...`,
      'Music-User-Token': musicUserToken ? `${musicUserToken.substring(0, 10)}...` : 'Not provided'
    });

    const response = await fetch(`${url}?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Music-User-Token': musicUserToken || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Apple Music API Response Status:', response.status);
    console.log('Apple Music API Response Headers:', response.headers.raw());

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      console.error('Apple Music API Error Response:', responseText);
      throw new Error(`Apple Music API responded with status: ${response.status}`);
    }

    const data = JSON.parse(responseText);
    console.log('Parsed response data:', JSON.stringify(data, null, 2));

    if (!data.results || (!data.results.songs && !data.results.albums && !data.results.artists)) {
      console.log('No results found in response');
      return res.json({ songs: { data: [] } });
    }

    res.json(data.results);
  } catch (error) {
    console.error('Error searching Apple Music:', error);
    res.status(500).json({ 
      error: 'Failed to search Apple Music',
      details: error.message
    });
  }
});

// Get recommendations
router.get('/recommendations', async (req, res) => {
  try {
    console.log('Recommendations request received');
    
    const token = generateToken();
    if (!token) {
      throw new Error('Failed to generate token for recommendations request');
    }

    const musicUserToken = req.headers['music-user-token'];
    console.log('Music User Token present:', !!musicUserToken);

    // First try to get personalized recommendations
    const url = 'https://api.music.apple.com/v1/me/recommendations';
    console.log('Making request to Apple Music API:', url);
    console.log('Request headers:', {
      'Authorization': `Bearer ${token.substring(0, 10)}...`,
      'Music-User-Token': musicUserToken ? `${musicUserToken.substring(0, 10)}...` : 'Not provided'
    });

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Music-User-Token': musicUserToken || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Apple Music API Response Status:', response.status);
    console.log('Apple Music API Response Headers:', response.headers.raw());

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      // If personalized recommendations fail, fall back to charts
      console.log('Falling back to charts...');
      const chartsUrl = 'https://api.music.apple.com/v1/catalog/us/charts?types=songs&limit=25';
      const chartsResponse = await fetch(chartsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Music-User-Token': musicUserToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!chartsResponse.ok) {
        const chartsText = await chartsResponse.text();
        console.error('Charts API Error Response:', chartsText);
        throw new Error(`Charts API responded with status: ${chartsResponse.status}`);
      }

      const chartsData = await chartsResponse.json();
      console.log('Charts data:', JSON.stringify(chartsData, null, 2));
      return res.json(chartsData);
    }

    const data = JSON.parse(responseText);
    console.log('Parsed response data:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

export default router; 