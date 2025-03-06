import React, { useState, useEffect } from 'react';
import { useSpotify } from '../context/SpotifyContext';
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
  FormControl,
  IconButton,
  Divider,
  useColorModeValue,
  Skeleton,
  useToast,
  InputGroup,
  InputLeftElement,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FaPlay, FaPause, FaSync, FaSearch, FaSpotify, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const SpotifyTest = () => {
  const { 
    isAuthenticated, 
    login, 
    searchTracks, 
    getRecommendations,
    currentTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    deviceReady
  } = useSpotify();
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isAuthenticated) {
      handleGetRecommendations();
    }
  }, [isAuthenticated]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const results = await searchTracks(query);
      setSearchResults(results.tracks?.items || []);
      if (results.tracks?.items.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(`Failed to search tracks: ${err.message}`);
      toast({
        title: "Search failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await getRecommendations();
      setRecommendations(results.tracks || []);
    } catch (err) {
      setError(`Failed to get recommendations: ${err.message}`);
      toast({
        title: "Failed to get recommendations",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async (track) => {
    if (!deviceReady) {
      toast({
        title: "Playback Device Not Ready",
        description: "Please wait while we initialize the playback device...",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pauseTrack();
        toast({
          title: "Paused",
          description: `Paused ${track.name}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await playTrack(track.uri);
        toast({
          title: "Now Playing",
          description: `${track.name} by ${track.artists[0].name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Playback Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const TrackList = ({ tracks, title }) => (
    <AnimatePresence>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        bg={bgColor}
        borderRadius="lg"
        shadow="md"
        p={6}
        mb={6}
      >
        {title && <Heading size="md" mb={4}>{title}</Heading>}
        {!deviceReady && (
          <Alert status="info" mb={4}>
            <AlertIcon />
            Initializing playback device... This may take a few seconds.
          </Alert>
        )}
        {tracks.length === 0 ? (
          <Text color={secondaryTextColor}>No tracks available</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {tracks.map((track, index) => (
              <MotionFlex
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                p={3}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                align="center"
                _hover={{ bg: hoverBg, transform: 'translateY(-2px)' }}
              >
                <Box position="relative" flexShrink={0}>
                  {track.album?.images[0]?.url ? (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.name}
                      boxSize="64px"
                      borderRadius="md"
                      shadow="sm"
                    />
                  ) : (
                    <Skeleton boxSize="64px" borderRadius="md" />
                  )}
                  <IconButton
                    icon={currentTrack?.id === track.id && isPlaying ? <FaPause /> : <FaPlay />}
                    onClick={() => handlePlayPause(track)}
                    aria-label={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"}
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
                    isDisabled={!deviceReady}
                  />
                </Box>
                <Box ml={4} flex="1">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="medium" color={textColor}>{track.name}</Text>
                      <Text fontSize="sm" color={secondaryTextColor}>
                        {track.artists.map(artist => artist.name).join(', ')}
                      </Text>
                      <Text fontSize="xs" color={secondaryTextColor}>
                        {track.album.name}
                      </Text>
                    </Box>
                    <HStack spacing={3}>
                      <Tooltip label="Track duration" placement="top">
                        <Text fontSize="sm" color={secondaryTextColor}>
                          <FaClock /> {formatDuration(track.duration_ms)}
                        </Text>
                      </Tooltip>
                      {track.explicit && (
                        <Badge colorScheme="red" variant="subtle">
                          Explicit
                        </Badge>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              </MotionFlex>
            ))}
          </VStack>
        )}
      </MotionBox>
    </AnimatePresence>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pb={8}>
      <Container maxW="6xl" px={4}>
        <VStack textAlign="center" spacing={2} mb={8} pt={4}>
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Heading size="xl" color={textColor}>Spotify Explorer</Heading>
            <Text color={secondaryTextColor}>Search and discover music from Spotify's vast library</Text>
          </MotionBox>
        </VStack>

        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} mb={8}>
          <GridItem>
            <Box bg={bgColor} borderRadius="lg" shadow="md" p={6} mb={6}>
              <Heading size="md" mb={4}>Search Tracks</Heading>
              <form onSubmit={handleSearch}>
                <Flex gap={2}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for tracks, artists, or albums..."
                      isDisabled={!isAuthenticated || isLoading}
                      focusBorderColor="green.500"
                    />
                  </InputGroup>
                  <Button
                    type="submit"
                    colorScheme="green"
                    isDisabled={!isAuthenticated || isLoading || !query.trim()}
                    isLoading={isLoading && !!query.trim()}
                    loadingText="Searching"
                    leftIcon={<FaSearch />}
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
              {!isAuthenticated ? (
                <Button
                  onClick={login}
                  w="full"
                  colorScheme="green"
                  leftIcon={<FaSpotify />}
                  isDisabled={isLoading}
                  py={3}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Connect with Spotify
                </Button>
              ) : (
                <Alert status="success" variant="subtle" borderRadius="lg">
                  <AlertIcon />
                  Connected to Spotify
                </Alert>
              )}
            </Box>

            <Box bg={bgColor} borderRadius="lg" shadow="md" p={6}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Recommendations</Heading>
                <Button
                  onClick={handleGetRecommendations}
                  colorScheme="green"
                  size="sm"
                  isDisabled={!isAuthenticated || isLoading}
                  isLoading={isLoading}
                  loadingText="Loading"
                  leftIcon={<FaSync />}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'sm',
                  }}
                  transition="all 0.2s"
                >
                  Refresh
                </Button>
              </Flex>
              <TrackList tracks={recommendations} title="" />
            </Box>
          </GridItem>
        </Grid>

        <AnimatePresence>
          {error && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert status="error" mb={6} borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            </MotionBox>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default SpotifyTest; 