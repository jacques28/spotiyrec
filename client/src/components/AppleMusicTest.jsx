import React, { useState, useEffect, useRef } from 'react';
import appleMusicService from '../services/appleMusicService';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Input,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  IconButton,
  useColorModeValue,
  FormControl
} from '@chakra-ui/react';
import { FaPlay, FaPause, FaSync } from 'react-icons/fa';

const AppleMusicTest = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  const addDebugInfo = (info) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
  };

  useEffect(() => {
    const initializeMusicKit = async () => {
      try {
        addDebugInfo('Starting MusicKit initialization...');
        if (window.MusicKit) {
          await appleMusicService.initialize();
          const isAuthorized = appleMusicService.musicKit?.isAuthorized;
          const musicUserToken = appleMusicService.musicKit?.musicUserToken;
          setIsAuthorized(isAuthorized);
          addDebugInfo(`MusicKit initialized (Authorized: ${isAuthorized}, Token: ${musicUserToken ? 'Present' : 'Missing'})`);
        } else {
          addDebugInfo('MusicKit is not loaded');
          setError('Apple Music SDK failed to load');
        }
      } catch (err) {
        console.error('Failed to initialize MusicKit:', err);
        addDebugInfo(`MusicKit initialization failed: ${err.message}`);
        setError(`Failed to initialize Apple Music: ${err.message}`);
      }
    };

    initializeMusicKit();
  }, []);

  const handlePlayPause = async (track) => {
    if (currentlyPlaying?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      try {
        setCurrentlyPlaying(track);
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.src = track.attributes.previews[0].url;
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Error playing track:', error);
        setError('Failed to play track preview');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const handleSeek = (value) => {
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAuthorize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      addDebugInfo('Starting authorization process...');
      const result = await appleMusicService.authorize();
      console.log('Authorization result:', result);
      setIsAuthorized(true);
      addDebugInfo(`Authorization successful: ${result.message}`);
      if (result.musicUserToken) {
        addDebugInfo('Music User Token received');
      }
    } catch (err) {
      const errorMessage = `Failed to authorize with Apple Music: ${err.message}`;
      setError(errorMessage);
      addDebugInfo(`Authorization error: ${err.message}`);
      console.error('Authorization error:', err);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      addDebugInfo(`Searching for: ${searchQuery}`);
      const results = await appleMusicService.searchTracks(searchQuery);
      console.log('Search results:', results);
      
      if (!results || !results.songs || !results.songs.data) {
        addDebugInfo('No search results found');
        setError('No results found');
        setSearchResults([]);
        return;
      }
      
      addDebugInfo(`Found ${results.songs.data.length} search results`);
      setSearchResults(results.songs.data);
    } catch (err) {
      const errorMessage = `Failed to search tracks: ${err.message}`;
      setError(errorMessage);
      addDebugInfo(`Search error: ${err.message}`);
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      addDebugInfo('Fetching recommendations...');
      const results = await appleMusicService.getRecommendations();
      console.log('Recommendations results:', results);
      
      if (!Array.isArray(results) || results.length === 0) {
        addDebugInfo('No recommendations found');
        setError('No recommendations found');
        setRecommendations([]);
        return;
      }
      
      addDebugInfo(`Found ${results.length} recommendations`);
      setRecommendations(results);
    } catch (err) {
      const errorMessage = `Failed to get recommendations: ${err.message}`;
      setError(errorMessage);
      addDebugInfo(`Recommendations error: ${err.message}`);
      console.error('Recommendations error:', err);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const TrackList = ({ tracks, title }) => (
    <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
      <Heading size="md" mb={4}>{title}</Heading>
      {tracks.length === 0 ? (
        <Text color={secondaryTextColor}>No tracks available</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {tracks.map((track) => (
            <Flex
              key={track.id}
              p={3}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              align="center"
              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              transition="background 0.2s"
            >
              <Box position="relative" flexShrink={0}>
                {track.attributes?.artwork?.url && (
                  <Image
                    src={track.attributes.artwork.url.replace('{w}', '60').replace('{h}', '60')}
                    alt={track.attributes.name}
                    boxSize="60px"
                    borderRadius="md"
                    shadow="sm"
                  />
                )}
                <IconButton
                  icon={currentlyPlaying?.id === track.id && isPlaying ? <FaPause /> : <FaPlay />}
                  onClick={() => handlePlayPause(track)}
                  aria-label={currentlyPlaying?.id === track.id && isPlaying ? "Pause" : "Play"}
                  position="absolute"
                  inset="0"
                  variant="unstyled"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="blackAlpha.700"
                  color="white"
                  opacity="0"
                  _hover={{ opacity: 1 }}
                  borderRadius="md"
                  transition="opacity 0.2s"
                />
              </Box>
              <Box ml={4} flex="1">
                <Text fontWeight="medium" color={textColor}>{track.attributes?.name}</Text>
                <Text fontSize="sm" color={secondaryTextColor}>{track.attributes?.artistName}</Text>
                <Text fontSize="xs" color={secondaryTextColor}>{track.attributes?.albumName}</Text>
              </Box>
              {track.attributes?.previews?.[0]?.url && (
                <HStack spacing={2}>
                  {currentlyPlaying?.id === track.id && (
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {formatTime(currentTime)}
                    </Text>
                  )}
                </HStack>
              )}
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pb={8}>
      <Container maxW="6xl" px={4}>
        <VStack textAlign="center" spacing={2} mb={8} pt={4}>
          <Heading size="xl" color={textColor}>Apple Music Explorer</Heading>
          <Text color={secondaryTextColor}>Search and discover music from Apple Music's vast library</Text>
        </VStack>

        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} mb={8}>
          <GridItem>
            <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
              <Heading size="md" mb={4}>Search Tracks</Heading>
              <form onSubmit={handleSearch}>
                <Flex gap={2}>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for tracks, artists, or albums..."
                    isDisabled={!isAuthorized || isLoading}
                    focusBorderColor="red.500"
                  />
                  <Button
                    type="submit"
                    colorScheme="red"
                    isDisabled={!isAuthorized || isLoading || !searchQuery.trim()}
                    isLoading={isLoading && !!searchQuery.trim()}
                    loadingText="Searching"
                  >
                    Search
                  </Button>
                </Flex>
              </form>
            </Box>

            <TrackList tracks={searchResults} title="Search Results" />
          </GridItem>

          <GridItem>
            <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
              {!isAuthorized ? (
                <Button
                  onClick={handleAuthorize}
                  w="full"
                  colorScheme="red"
                  isDisabled={isLoading}
                  isLoading={isLoading}
                  loadingText="Authorizing"
                  py={3}
                >
                  Authorize with Apple Music
                </Button>
              ) : (
                <Alert status="success" variant="subtle" borderRadius="lg">
                  <AlertIcon />
                  Connected to Apple Music
                </Alert>
              )}
            </Box>

            <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Recommendations</Heading>
                <Button
                  onClick={handleGetRecommendations}
                  colorScheme="red"
                  size="sm"
                  isDisabled={!isAuthorized || isLoading}
                  isLoading={isLoading}
                  loadingText="Loading"
                  leftIcon={<FaSync />}
                >
                  Refresh
                </Button>
              </Flex>
              <TrackList tracks={recommendations} title="" />
            </Box>

            {debugInfo.length > 0 && (
              <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
                <Heading size="md" mb={4}>Debug Info</Heading>
                <VStack align="stretch" maxH="200px" overflowY="auto" spacing={1}>
                  {debugInfo.map((info, index) => (
                    <Text key={index} fontSize="xs" fontFamily="monospace">
                      {info}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </GridItem>
        </Grid>

        {error && (
          <Alert status="error" mb={6} borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {currentlyPlaying && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg={bgColor}
            p={4}
            borderTopWidth="1px"
            borderTopColor={borderColor}
            shadow="lg"
          >
            <Container maxW="6xl">
              <Flex align="center">
                <Box flexShrink={0} mr={4}>
                  {currentlyPlaying.attributes?.artwork?.url && (
                    <Image
                      src={currentlyPlaying.attributes.artwork.url
                        .replace('{w}', '40')
                        .replace('{h}', '40')}
                      alt={currentlyPlaying.attributes.name}
                      boxSize="40px"
                      borderRadius="md"
                    />
                  )}
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" fontWeight="medium">
                    {currentlyPlaying.attributes?.name}
                  </Text>
                  <Text fontSize="xs" color={secondaryTextColor}>
                    {currentlyPlaying.attributes?.artistName}
                  </Text>
                  <Flex align="center" mt={1}>
                    <Text fontSize="xs" color={secondaryTextColor} mr={2}>
                      {formatTime(currentTime)}
                    </Text>
                    <Box flex="1" mx={2}>
                      <Slider
                        value={currentTime}
                        min={0}
                        max={duration || 100}
                        onChange={handleSeek}
                        colorScheme="red"
                        size="sm"
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </Box>
                    <Text fontSize="xs" color={secondaryTextColor} ml={2}>
                      {formatTime(duration)}
                    </Text>
                  </Flex>
                </Box>
                <Box flexShrink={0} ml={4} width="100px">
                  <Slider
                    value={volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                    colorScheme="red"
                    size="sm"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </Box>
                <IconButton
                  icon={isPlaying ? <FaPause /> : <FaPlay />}
                  onClick={() => handlePlayPause(currentlyPlaying)}
                  colorScheme="red"
                  variant="ghost"
                  ml={4}
                  aria-label={isPlaying ? "Pause" : "Play"}
                />
              </Flex>
            </Container>
          </Box>
        )}

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setError('Audio playback error');
            setIsPlaying(false);
          }}
          style={{ display: 'none' }}
        />
      </Container>
    </Box>
  );
};

export default AppleMusicTest; 