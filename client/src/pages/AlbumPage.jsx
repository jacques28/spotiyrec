import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Image,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Divider,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Skeleton,
  SkeletonText,
  useColorModeValue,
  IconButton,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Progress,
  Container,
  Spinner,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton
} from '@chakra-ui/react';
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaClock, FaMusic, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { useSpotify } from '../context/SpotifyContext';
import useSpotifyAPI from '../hooks/useSpotifyAPI';
import HighlightPlayer from '../components/HighlightPlayer';
import SpotifyPlayer from '../components/SpotifyPlayer';
import EnhancedTrackList from '../components/EnhancedTrackList';

const AlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, login } = useSpotify();
  const {
    getAlbum,
    getAlbumTracks,
    detectHighlights,
    getTrackAnalysis,
    getTrackRecommendations,
    checkSavedAlbums,
    saveAlbums,
    removeAlbums,
    loading,
    error
  } = useSpotifyAPI();
  
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackHighlights, setTrackHighlights] = useState({});
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [albumAnalysis, setAlbumAnalysis] = useState(null);
  const [analyzingAlbum, setAnalyzingAlbum] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState(null);
  const [playerTab, setPlayerTab] = useState('highlights'); // 'highlights' or 'full'
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('green.500', 'green.300');
  
  // Fetch album details and tracks
  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping album fetch');
        return;
      }
      
      if (!albumId) {
        console.error('No album ID provided');
        toast({
          title: 'Error',
          description: 'No album ID provided',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/');
        return;
      }
      
      try {
        console.log(`Fetching album data for ID: ${albumId}`);
        setTracks([]); // Clear existing tracks
        
        // Get album details
        const albumData = await getAlbum(albumId);
        if (!albumData) {
          throw new Error('Failed to fetch album data');
        }
        
        console.log('Album data fetched successfully', albumData);
        setAlbum(albumData);
        
        // Get album tracks
        const tracksData = await getAlbumTracks(albumId, { limit: 50 });
        if (!tracksData || !tracksData.items) {
          throw new Error('Failed to fetch album tracks');
        }
        
        console.log(`Fetched ${tracksData.items.length} tracks`);
        setTracks(tracksData.items);
      } catch (err) {
        console.error('Error fetching album data:', err);
        
        // Check if error is due to authentication
        if (err.message && (
            err.message.includes('authentication') || 
            err.message.includes('token') || 
            err.message.includes('unauthorized')
          )) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in again to access this content',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          // Redirect to login page or show login prompt
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load album data. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };
    
    fetchAlbumData();
  }, [albumId, isAuthenticated, getAlbum, getAlbumTracks, toast, navigate]);
  
  // Analyze album when tracks are loaded
  useEffect(() => {
    const analyzeAlbum = async () => {
      if (!tracks.length || albumAnalysis) return;
      
      setAnalyzingAlbum(true);
      
      try {
        // For free Spotify accounts, we'll use a simplified approach
        // that doesn't rely on audio features or analysis
        
        // Check if we're using a free account by attempting to get features for one track
        const firstTrackId = tracks[0]?.id;
        if (!firstTrackId) {
          throw new Error('No tracks available for analysis');
        }
        
        try {
          // Try to get audio features for the first track
          const analysis = await getTrackAnalysis(firstTrackId);
          
          // If successful, proceed with full analysis
          if (analysis && analysis.features) {
            // Get audio features for the first 5 tracks to analyze the album
            const trackIds = tracks.slice(0, 5).map(track => track.id);
            
            // Analyze a sample of tracks to get album characteristics
            let totalEnergy = 0;
            let totalDanceability = 0;
            let totalValence = 0;
            let totalAcousticness = 0;
            let totalInstrumentalness = 0;
            let successfulAnalyses = 0;
            
            // Process each track
            for (const trackId of trackIds) {
              try {
                const analysis = await getTrackAnalysis(trackId);
                if (analysis && analysis.features) {
                  totalEnergy += analysis.features.energy;
                  totalDanceability += analysis.features.danceability;
                  totalValence += analysis.features.valence;
                  totalAcousticness += analysis.features.acousticness;
                  totalInstrumentalness += analysis.features.instrumentalness;
                  successfulAnalyses++;
                }
              } catch (err) {
                // Log error but continue with other tracks
                console.error(`Error analyzing track ${trackId}:`, err);
                // If it's a 403 error, we might be rate limited, so break the loop
                if (err.response && err.response.status === 403) {
                  console.warn('Received 403 error, possibly rate limited or free account. Stopping analysis.');
                  break;
                }
              }
            }
            
            // Only calculate averages if we have at least one successful analysis
            if (successfulAnalyses > 0) {
              // Calculate averages
              const count = successfulAnalyses;
              const albumFeatures = {
                energy: totalEnergy / count,
                danceability: totalDanceability / count,
                valence: totalValence / count,
                acousticness: totalAcousticness / count,
                instrumentalness: totalInstrumentalness / count
              };
              
              // Determine album characteristics
              const characteristics = [];
              
              if (albumFeatures.energy > 0.7) characteristics.push('Energetic');
              else if (albumFeatures.energy < 0.4) characteristics.push('Calm');
              
              if (albumFeatures.danceability > 0.7) characteristics.push('Danceable');
              
              if (albumFeatures.valence > 0.7) characteristics.push('Upbeat');
              else if (albumFeatures.valence < 0.3) characteristics.push('Melancholic');
              
              if (albumFeatures.acousticness > 0.7) characteristics.push('Acoustic');
              
              if (albumFeatures.instrumentalness > 0.5) characteristics.push('Instrumental');
              
              setAlbumAnalysis({
                features: albumFeatures,
                characteristics: characteristics.length ? characteristics : ['Balanced']
              });
            } else {
              // If no successful analyses, use the fallback method
              throw new Error('No successful analyses');
            }
          } else {
            // If no features available, use the fallback method
            throw new Error('No features available');
          }
        } catch (err) {
          console.log('Using fallback analysis method due to error:', err);
          
          // Fallback method for free accounts or when API access is limited
          // Use album metadata and track properties that don't require API calls
          
          // Estimate album characteristics based on available metadata
          const characteristics = [];
          
          // Use album release date to estimate era/style
          const releaseYear = album?.release_date ? new Date(album.release_date).getFullYear() : null;
          if (releaseYear) {
            if (releaseYear < 1980) characteristics.push('Classic');
            else if (releaseYear < 2000) characteristics.push('Retro');
            else if (releaseYear >= 2020) characteristics.push('Contemporary');
          }
          
          // Use album genres if available
          if (album?.genres && album.genres.length > 0) {
            const genres = album.genres;
            if (genres.some(g => g.includes('rock'))) characteristics.push('Rock');
            if (genres.some(g => g.includes('pop'))) characteristics.push('Pop');
            if (genres.some(g => g.includes('hip hop') || g.includes('rap'))) characteristics.push('Hip-Hop');
            if (genres.some(g => g.includes('electronic') || g.includes('dance'))) characteristics.push('Electronic');
          }
          
          // Use artist genres as fallback
          if (album?.artists && album.artists[0]?.genres && album.artists[0].genres.length > 0) {
            const genres = album.artists[0].genres;
            if (genres.some(g => g.includes('rock'))) characteristics.push('Rock');
            if (genres.some(g => g.includes('pop'))) characteristics.push('Pop');
            if (genres.some(g => g.includes('hip hop') || g.includes('rap'))) characteristics.push('Hip-Hop');
            if (genres.some(g => g.includes('electronic') || g.includes('dance'))) characteristics.push('Electronic');
          }
          
          // Use track durations to estimate album intensity
          const avgDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0) / tracks.length;
          if (avgDuration < 180000) characteristics.push('Fast-paced'); // Less than 3 minutes
          else if (avgDuration > 300000) characteristics.push('Epic'); // More than 5 minutes
          
          // If we couldn't determine any characteristics, use a generic one
          if (characteristics.length === 0) {
            characteristics.push('Varied');
          }
          
          // Create a simplified analysis with estimated values
          setAlbumAnalysis({
            features: {
              energy: 0.5,
              danceability: 0.5,
              valence: 0.5,
              acousticness: 0.5,
              instrumentalness: 0.5
            },
            characteristics: characteristics,
            limited: true // Flag to indicate this is a limited analysis
          });
        }
      } catch (err) {
        console.error('Error analyzing album:', err);
        // Set a default analysis on error
        setAlbumAnalysis({
          features: {
            energy: 0.5,
            danceability: 0.5,
            valence: 0.5,
            acousticness: 0.5,
            instrumentalness: 0.5
          },
          characteristics: ['Analysis Limited'],
          limited: true
        });
      } finally {
        setAnalyzingAlbum(false);
      }
    };
    
    analyzeAlbum();
  }, [tracks, albumAnalysis, getTrackAnalysis]);
  
  // Show premium alert if we encounter 403 errors
  useEffect(() => {
    if (albumAnalysis && albumAnalysis.limited) {
      setShowPremiumAlert(true);
    }
  }, [albumAnalysis]);
  
  // Check if album is saved in user's library
  useEffect(() => {
    const checkIfAlbumIsSaved = async () => {
      if (!isAuthenticated || !album) return;
      
      try {
        const result = await checkSavedAlbums([album.id]);
        setIsSaved(result[0]);
      } catch (err) {
        console.error('Error checking if album is saved:', err);
        // Default to not saved on error
        setIsSaved(false);
      }
    };
    
    checkIfAlbumIsSaved();
  }, [album, isAuthenticated, checkSavedAlbums]);
  
  // Handle saving/removing album from library
  const handleToggleSave = async () => {
    if (!isAuthenticated || !album) return;
    
    try {
      if (isSaved) {
        await removeAlbums([album.id]);
        setIsSaved(false);
        toast({
          title: 'Album removed',
          description: `"${album.name}" has been removed from your library`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await saveAlbums([album.id]);
        setIsSaved(true);
        toast({
          title: 'Album saved',
          description: `"${album.name}" has been added to your library`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error toggling album save:', err);
      toast({
        title: 'Error',
        description: 'Failed to update your library. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Function to get highlights for a track
  const getTrackHighlights = async (track) => {
    if (!track || !track.id || trackHighlights[track.id]) return;
    
    setLoadingHighlights(true);
    setCurrentTrack(track);
    
    try {
      const highlights = await detectHighlights(track.id);
      
      setTrackHighlights(prev => ({
        ...prev,
        [track.id]: highlights
      }));
    } catch (err) {
      console.error('Error detecting highlights:', err);
      toast({
        title: 'Error',
        description: 'Failed to detect highlights for this track.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingHighlights(false);
    }
  };
  
  // Format duration from ms to MM:SS
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle next track
  const handleNextTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      getTrackHighlights(nextTrack);
    }
  };
  
  // Handle previous track
  const handlePreviousTrack = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      getTrackHighlights(prevTrack);
    }
  };
  
  // Play full track
  const playFullTrack = (track) => {
    if (!track || !track.uri) return;
    setSelectedTrackUri(track.uri);
    setPlayerTab('full');
  };
  
  // Play track preview
  const playTrackPreview = (track) => {
    if (!track.preview_url) {
      toast({
        title: 'Preview Unavailable',
        description: 'No preview available for this track',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    console.log(`Playing preview for track: ${track.name}`);
    setCurrentTrack(track);
    setSelectedTrackUri(track.uri);
    setPlayerTab('highlights');
  };
  
  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={10}>
        <Heading mb={6}>Sign in to view album details</Heading>
        <Button colorScheme="green" size="lg" onClick={login}>
          Connect with Spotify
        </Button>
      </Box>
    );
  }
  
  if (loading && !album) {
    return (
      <Box>
        <Flex direction={{ base: 'column', md: 'row' }} gap={8} mb={8}>
          <Skeleton height="300px" width="300px" borderRadius="md" />
          <VStack align="flex-start" spacing={4} flex="1">
            <SkeletonText noOfLines={1} skeletonHeight={8} width="70%" />
            <SkeletonText noOfLines={1} skeletonHeight={6} width="50%" />
            <SkeletonText noOfLines={3} skeletonHeight={4} width="90%" />
          </VStack>
        </Flex>
        
        <SkeletonText noOfLines={1} skeletonHeight={6} width="20%" mb={4} />
        <Skeleton height="400px" borderRadius="md" />
      </Box>
    );
  }
  
  if (error || (!loading && !album)) {
    return (
      <Box textAlign="center" py={10}>
        <Heading mb={6}>Album not found</Heading>
        <Text mb={6}>The album you're looking for doesn't exist or couldn't be loaded.</Text>
        <Button colorScheme="green" onClick={() => navigate('/discover')}>
          Discover Albums
        </Button>
      </Box>
    );
  }
  
  return (
    <Container maxW="container.xl" py={8}>
      {loading ? (
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color={accentColor} />
        </Flex>
      ) : error ? (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Error loading album</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : album ? (
        <>
          {showPremiumAlert && (
            <Alert status="info" mb={6} borderRadius="lg">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Free Account Detected</AlertTitle>
                <AlertDescription display="block">
                  Some advanced features like detailed audio analysis require a Spotify Premium account. 
                  You'll still be able to browse and play music, but some analysis features will be limited.
                </AlertDescription>
              </Box>
              <CloseButton 
                position="absolute" 
                right="8px" 
                top="8px" 
                onClick={() => setShowPremiumAlert(false)} 
              />
            </Alert>
          )}
          
          {/* Album Header */}
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            mb={8}
            bg={bgColor}
            p={6}
            borderRadius="lg"
            boxShadow="md"
          >
            {/* Album cover */}
            <Box mr={{ base: 0, md: 8 }} mb={{ base: 6, md: 0 }} flexShrink={0}>
              <Image 
                src={album.images[0]?.url} 
                alt={album.name}
                boxSize={{ base: '100%', md: '300px' }}
                objectFit="cover"
                borderRadius="md"
                boxShadow="lg"
              />
            </Box>
            
            {/* Album info */}
            <VStack align="flex-start" spacing={4} flex={1}>
              <Heading as="h1" size="xl">{album.name}</Heading>
              <Text fontSize="xl">{album.artists.map(artist => artist.name).join(', ')}</Text>
              <Text color="gray.500">
                {album.release_date ? new Date(album.release_date).getFullYear() : 'Unknown'} • {album.total_tracks} tracks
              </Text>
              
              {/* Album characteristics */}
              {albumAnalysis && (
                <Box mt={4} w="100%">
                  <Heading as="h3" size="md" mb={2}>Album Characteristics</Heading>
                  <HStack spacing={2} mb={4} wrap="wrap">
                    {albumAnalysis.characteristics.map((characteristic, index) => (
                      <Badge key={index} colorScheme="green" fontSize="sm" px={2} py={1}>
                        {characteristic}
                      </Badge>
                    ))}
                  </HStack>
                  
                  {!albumAnalysis.limited && (
                    <StatGroup mt={4}>
                      <Stat>
                        <StatLabel>Energy</StatLabel>
                        <StatNumber>{Math.round(albumAnalysis.features.energy * 100)}%</StatNumber>
                        <StatHelpText>
                          <Progress value={albumAnalysis.features.energy * 100} size="sm" colorScheme="red" />
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Danceability</StatLabel>
                        <StatNumber>{Math.round(albumAnalysis.features.danceability * 100)}%</StatNumber>
                        <StatHelpText>
                          <Progress value={albumAnalysis.features.danceability * 100} size="sm" colorScheme="purple" />
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Mood</StatLabel>
                        <StatNumber>{Math.round(albumAnalysis.features.valence * 100)}%</StatNumber>
                        <StatHelpText>
                          <Progress value={albumAnalysis.features.valence * 100} size="sm" colorScheme="yellow" />
                        </StatHelpText>
                      </Stat>
                    </StatGroup>
                  )}
                </Box>
              )}
              
              {/* Album actions */}
              <HStack spacing={4} mt={4}>
                <Button 
                  leftIcon={<FaPlay />} 
                  colorScheme="green" 
                  onClick={() => playTrackPreview(tracks[0])}
                  isDisabled={!tracks.length || !tracks[0].preview_url}
                >
                  Preview First Track
                </Button>
                <Button
                  leftIcon={isSaved ? <FaRegHeart /> : <FaHeart />}
                  variant="outline"
                  onClick={handleToggleSave}
                >
                  {isSaved ? 'Remove from Library' : 'Save to Library'}
                </Button>
              </HStack>
            </VStack>
          </Flex>
          
          {/* Player Tabs */}
          {(currentTrack || selectedTrackUri) && (
            <Box mb={8}>
              <Tabs variant="soft-rounded" colorScheme="green" index={playerTab === 'highlights' ? 0 : 1} onChange={(index) => setPlayerTab(index === 0 ? 'highlights' : 'full')}>
                <TabList mb={4}>
                  <Tab>Highlights Player</Tab>
                  <Tab>Full Track Player</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel p={0}>
                    {currentTrack && (
                      <HighlightPlayer
                        track={currentTrack}
                        highlights={trackHighlights[currentTrack.id] || []}
                        onNext={handleNextTrack}
                        onPrevious={handlePreviousTrack}
                      />
                    )}
                  </TabPanel>
                  <TabPanel p={0}>
                    <SpotifyPlayer trackUri={selectedTrackUri} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          )}
          
          {/* Enhanced Track List */}
          <EnhancedTrackList
            tracks={tracks}
            album={album}
            onPlayHighlight={playTrackPreview}
            loadingHighlights={loadingHighlights}
            currentTrackId={currentTrack?.id}
            getTrackAnalysis={getTrackAnalysis}
            getTrackRecommendations={getTrackRecommendations}
          />
        </>
      ) : null}
    </Container>
  );
};

export default AlbumPage; 