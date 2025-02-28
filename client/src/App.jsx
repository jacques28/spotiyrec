import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SpotifyProvider } from './context/SpotifyContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import AlbumPage from './pages/AlbumPage';
import CallbackPage from './pages/CallbackPage';

function App() {
  return (
    <SpotifyProvider>
      <Routes>
        {/* Callback route needs to be outside Layout to avoid navbar during auth */}
        <Route path="/callback" element={<CallbackPage />} />
        
        {/* All other routes use the Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="album/:albumId" element={<AlbumPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </SpotifyProvider>
  );
}

export default App;
