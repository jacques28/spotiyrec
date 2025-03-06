import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { SpotifyProvider } from './context/SpotifyContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import AlbumPage from './pages/AlbumPage';
import CallbackPage from './pages/CallbackPage';
import LandingPage from './components/LandingPage';
import AppleMusicTest from './components/AppleMusicTest';
import SpotifyTest from './components/SpotifyTest';
import Navigation from './components/Navigation';

const App = () => {
  return (
    <SpotifyProvider>
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/spotify-original" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="album/:albumId" element={<AlbumPage />} />
        </Route>
        
        <Route path="/spotify" element={
          <Box>
            <Navigation />
            <Box pt="16">
              <SpotifyTest />
            </Box>
          </Box>
        } />
        
        <Route path="/apple-music" element={
          <Box>
            <Navigation />
            <Box pt="16">
              <AppleMusicTest />
            </Box>
          </Box>
        } />
        
        <Route path="/apple-test" element={
          <Box>
            <Navigation />
            <Box pt="16">
              <AppleMusicTest />
            </Box>
          </Box>
        } />
        <Route path="/deezer" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SpotifyProvider>
  );
};

export default App;
