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
  Progress
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Fetch album details and tracks
  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!isAuthenticated || !albumId) return;
      
      try {
        const albumData = await getAlbum(albumId);
        setAlbum(albumData);
        
        const tracksData = await getAlbumTracks(albumId, { limit: 50 });
        setTracks(tracksData.items);
      } catch (err) {
        console.error('Error fetching album data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load album data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    fetchAlbumData();
  }, [albumId, isAuthenticated, getAlbum, getAlbumTracks, toast]);
  
  // Analyze album when tracks are loaded
  useEffect(() => {
    const analyzeAlbum = async () => {
      if (!tracks.length || albumAnalysis) return;
      
      setAnalyzingAlbum(true);
      
      try {
        // Get audio features for the first 5 tracks to analyze the album
        const trackIds = tracks.slice(0, 5).map(track => track.id);
        
        // Analyze a sample of tracks to get album characteristics
        let totalEnergy = 0;
        let totalDanceability = 0;
        let totalValence = 0;
        let totalAcousticness = 0;
        let totalInstrumentalness = 0;
        
        // Process each track
        for (const trackId of trackIds) {
          const analysis = await getTrackAnalysis(trackId);
          if (analysis && analysis.features) {
            totalEnergy += analysis.features.energy;
            totalDanceability += analysis.features.danceability;
            totalValence += analysis.features.valence;
            totalAcousticness += analysis.features.acousticness;
            totalInstrumentalness += analysis.features.instrumentalness;
          }
        }
        
        // Calculate averages
        const count = trackIds.length;
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
      } catch (err) {
        console.error('Error analyzing album:', err);
      } finally {
        setAnalyzingAlbum(false);
      }
    };
    
    analyzeAlbum();
  }, [tracks, albumAnalysis, getTrackAnalysis]);
  
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
    <Box>
      {/* Album Header */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={8}
        mb={8}
        p={6}
        bg={bgColor}
        borderRadius="lg"
        boxShadow="md"
      >
        <Image
          src={album?.images?.[0]?.url}
          alt={album?.name}
          boxSize={{ base: '200px', md: '300px' }}
          objectFit="cover"
          borderRadius="md"
          boxShadow="lg"
        />
        
        <VStack align="flex-start" spacing={4} flex="1">
          <Badge colorScheme="green" fontSize="sm">
            {album?.album_type?.toUpperCase()}
          </Badge>
          
          <Heading as="h1" size="2xl">
            {album?.name}
          </Heading>
          
          <HStack>
            <Text fontSize="lg" fontWeight="bold">
              {album?.artists?.map(artist => artist.name).join(', ')}
            </Text>
            <Text color="gray.500">
              • {album?.release_date?.split('-')[0]} • {album?.total_tracks} tracks
            </Text>
          </HStack>
          
          <Text color="gray.500" noOfLines={3}>
            {album?.description || `Enjoy the best moments of "${album?.name}" with our Highlights feature.`}
          </Text>
          
          {/* Album characteristics */}
          {albumAnalysis && (
            <Box mt={2}>
              <HStack spacing={2} mb={2}>
                <FaInfoCircle color="gray.500" />
                <Text fontWeight="medium">Album Characteristics:</Text>
                {albumAnalysis.characteristics.map((char, index) => (
                  <Badge key={index} colorScheme={
                    char === 'Energetic' ? 'red' :
                    char === 'Danceable' ? 'purple' :
                    char === 'Upbeat' ? 'green' :
                    char === 'Melancholic' ? 'blue' :
                    char === 'Acoustic' ? 'orange' :
                    char === 'Instrumental' ? 'teal' :
                    'gray'
                  }>
                    {char}
                  </Badge>
                ))}
              </HStack>
              
              {/* Album audio features */}
              <HStack spacing={4} mt={2}>
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Energy</Text>
                  <Progress 
                    value={albumAnalysis.features.energy * 100} 
                    colorScheme="red" 
                    size="xs" 
                    width="80px"
                  />
                </VStack>
                
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Danceability</Text>
                  <Progress 
                    value={albumAnalysis.features.danceability * 100} 
                    colorScheme="purple" 
                    size="xs" 
                    width="80px"
                  />
                </VStack>
                
                <VStack spacing={1} align="start">
                  <Text fontSize="xs" color="gray.500">Mood</Text>
                  <Progress 
                    value={albumAnalysis.features.valence * 100} 
                    colorScheme="green" 
                    size="xs" 
                    width="80px"
                  />
                </VStack>
              </HStack>
            </Box>
          )}
          
          <HStack spacing={4} pt={4}>
            <Button
              leftIcon={<FaPlay />}
              colorScheme="green"
              onClick={() => {
                if (tracks.length > 0) {
                  getTrackHighlights(tracks[0]);
                }
              }}
            >
              Play Highlights
            </Button>
            
            <Button
              leftIcon={<FaPlay />}
              variant="outline"
              colorScheme="green"
              onClick={() => {
                if (tracks.length > 0) {
                  playFullTrack(tracks[0]);
                }
              }}
            >
              Play Album
            </Button>
            
            <IconButton
              aria-label="Add to library"
              icon={<FaRegHeart />}
              variant="outline"
            />
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
        onPlayHighlight={getTrackHighlights}
        loadingHighlights={loadingHighlights}
        currentTrackId={currentTrack?.id}
        getTrackAnalysis={getTrackAnalysis}
        getTrackRecommendations={getTrackRecommendations}
      />
    </Box>
  );
};

export default AlbumPage; 