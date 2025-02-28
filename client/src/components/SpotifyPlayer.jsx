import React, { useState, useEffect } from 'react';
import { Box, Button, Text, Flex, Slider, SliderTrack, SliderFilledTrack, SliderThumb, IconButton, Image, VStack, HStack, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Link } from '@chakra-ui/react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useSpotify } from '../context/SpotifyContext';
import { formatSeconds } from '../utils/formatters';

const SpotifyPlayer = ({ trackUri }) => {
  const { accessToken } = useSpotify();
  const [player, setPlayer] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);
  const [isPremium, setIsPremium] = useState(null);
  const [premiumChecked, setPremiumChecked] = useState(false);

  // Initialize the Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    // Load the Spotify Web Playback SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize the player when the SDK is loaded
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'SpotiYRec Web Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: volume
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
      });
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
      });
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
      });
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;
        
        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsLoading(false);
        setIsActive(true);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsActive(false);
      });

      // Connect to the player
      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      // Clean up
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  // Play the track when trackUri changes
  useEffect(() => {
    if (!trackUri || !deviceId || !accessToken) return;

    const playTrack = async () => {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
      } catch (error) {
        console.error('Error playing track:', error);
      }
    };

    playTrack();
  }, [trackUri, deviceId, accessToken]);

  // Update position every second
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        if (prev >= duration) {
          clearInterval(interval);
          return 0;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, duration]);

  // Toggle play/pause
  const togglePlay = async () => {
    if (!player) return;

    await player.togglePlay();
    setIsPaused(!isPaused);
  };

  // Skip to next track
  const skipNext = async () => {
    if (!player) return;
    await player.nextTrack();
  };

  // Skip to previous track
  const skipPrevious = async () => {
    if (!player) return;
    await player.previousTrack();
  };

  // Handle volume change
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (player) {
      player.setVolume(value);
    }
  };

  // Handle seeking
  const handleSeek = async (value) => {
    if (!player) return;
    await player.seek(value * duration);
    setPosition(value * duration);
  };

  // Check if user has Spotify Premium
  useEffect(() => {
    if (!accessToken) return;

    const checkPremiumStatus = async () => {
      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.product === 'premium');
        } else {
          setIsPremium(false);
        }
        
        setPremiumChecked(true);
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
        setPremiumChecked(true);
      }
    };

    checkPremiumStatus();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg">
        <Text>Please log in to use the player</Text>
      </Box>
    );
  }

  if (premiumChecked && !isPremium) {
    return (
      <Alert
        status="warning"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="lg"
        p={6}
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Spotify Premium Required
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          <Text mb={4}>
            The Spotify Web Playback SDK requires a Spotify Premium subscription to play full tracks.
          </Text>
          <Link
            href="https://www.spotify.com/premium/"
            isExternal
            color="green.500"
            fontWeight="bold"
          >
            Upgrade to Spotify Premium
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" textAlign="center">
        <Spinner size="xl" color="green.500" />
        <Text mt={4}>Initializing Spotify Player...</Text>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Note: Spotify Premium is required for playback
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.800" color="white">
      <Flex direction={{ base: 'column', md: 'row' }} align="center">
        {/* Track Info */}
        <HStack spacing={4} flex="1" mb={{ base: 4, md: 0 }}>
          <Image 
            src={currentTrack?.album?.images[0]?.url || 'https://via.placeholder.com/64'} 
            alt={currentTrack?.name || 'Album cover'} 
            boxSize="64px"
            borderRadius="md"
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" noOfLines={1}>
              {currentTrack?.name || 'No track playing'}
            </Text>
            <Text fontSize="sm" color="gray.400" noOfLines={1}>
              {currentTrack?.artists?.[0]?.name || 'Unknown artist'}
            </Text>
          </VStack>
        </HStack>

        {/* Player Controls */}
        <VStack spacing={2} width={{ base: '100%', md: '60%' }}>
          <HStack spacing={4}>
            <IconButton
              aria-label="Previous track"
              icon={<FaStepBackward />}
              onClick={skipPrevious}
              variant="ghost"
              isDisabled={!isActive}
            />
            <IconButton
              aria-label={isPaused ? 'Play' : 'Pause'}
              icon={isPaused ? <FaPlay /> : <FaPause />}
              onClick={togglePlay}
              colorScheme="green"
              isDisabled={!isActive}
              size="lg"
              borderRadius="full"
            />
            <IconButton
              aria-label="Next track"
              icon={<FaStepForward />}
              onClick={skipNext}
              variant="ghost"
              isDisabled={!isActive}
            />
          </HStack>

          {/* Progress Bar */}
          <HStack width="100%" spacing={4}>
            <Text fontSize="xs">{formatSeconds(position / 1000)}</Text>
            <Slider
              aria-label="seek-slider"
              value={duration > 0 ? position / duration : 0}
              onChange={handleSeek}
              isDisabled={!isActive || duration === 0}
              colorScheme="green"
              flex="1"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="xs">{formatSeconds(duration / 1000)}</Text>
          </HStack>
        </VStack>

        {/* Volume Control */}
        <HStack spacing={2} width={{ base: '100%', md: '15%' }} mt={{ base: 4, md: 0 }}>
          <IconButton
            aria-label="Volume"
            icon={volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            variant="ghost"
            size="sm"
            onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
          />
          <Slider
            aria-label="volume-slider"
            value={volume}
            onChange={handleVolumeChange}
            colorScheme="green"
            size="sm"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </HStack>
      </Flex>

      {!isActive && (
        <Text fontSize="sm" color="red.300" mt={2} textAlign="center">
          Player inactive. Make sure you have Spotify Premium and try refreshing.
        </Text>
      )}
    </Box>
  );
};

export default SpotifyPlayer; 