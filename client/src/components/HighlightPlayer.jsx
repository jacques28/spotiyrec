import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Progress,
  useColorModeValue,
  Tooltip,
  HStack,
  VStack,
  Badge,
  Divider,
  Icon,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  FaPlay, 
  FaPause, 
  FaStepForward, 
  FaStepBackward, 
  FaVolumeUp, 
  FaVolumeMute,
  FaMusic,
  FaHeartbeat,
  FaRegLightbulb
} from 'react-icons/fa';

const HighlightPlayer = ({ track, highlights, onNext, onPrevious }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [highlightInfo, setHighlightInfo] = useState([]);
  
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const progressColor = useColorModeValue('green.500', 'green.300');
  
  // Initialize audio when track changes
  useEffect(() => {
    if (!track || !track.preview_url) return;
    
    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentHighlight(null);
    
    // Create new audio element
    const audio = new Audio(track.preview_url);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      console.log(`Audio loaded: duration = ${audio.duration}s`);
      setDuration(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
      setCurrentTime(0);
      
      // If there are highlights, move to the next one
      if (highlights && highlights.length > 0) {
        const currentIndex = currentHighlight ? highlights.indexOf(currentHighlight) : -1;
        if (currentIndex < highlights.length - 1) {
          playHighlight(highlights[currentIndex + 1]);
        } else {
          setCurrentHighlight(null);
          if (onNext) onNext();
        }
      } else if (onNext) {
        onNext();
      }
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    });
    
    // Set volume
    audio.volume = volume;
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [track, highlights, onNext]);
  
  // Generate highlight descriptions when highlights change
  useEffect(() => {
    if (!highlights || highlights.length === 0) {
      // If no highlights are provided, create a default one for the whole preview
      if (track && track.preview_url) {
        const defaultHighlight = {
          start: 0,
          duration: 30,
          energy: 0.5,
          loudness: -10,
          tempo: 120
        };
        
        setHighlightInfo([{
          index: 0,
          highlight: defaultHighlight,
          description: 'Preview',
          timeRange: '0:00 - 0:30'
        }]);
        
        setCurrentHighlight(defaultHighlight);
      }
      return;
    }
    
    // Generate descriptions for each highlight
    const descriptions = highlights.map((highlight, index) => {
      let description = '';
      
      // Determine what makes this highlight special
      if (highlight.energy > 0.8) {
        description = 'High energy section';
      } else if (highlight.loudness > -5) {
        description = 'Prominent, loud section';
      } else if (highlight.tempo > 120) {
        description = 'Fast-paced section';
      } else {
        description = 'Key musical moment';
      }
      
      // Add timestamp info
      const startTime = formatTime(highlight.start);
      const endTime = formatTime(highlight.start + highlight.duration);
      
      return {
        index,
        highlight,
        description,
        timeRange: `${startTime} - ${endTime}`
      };
    });
    
    setHighlightInfo(descriptions);
    
    // Auto-select the first highlight if none is selected
    if (!currentHighlight && highlights.length > 0) {
      setCurrentHighlight(highlights[0]);
    }
  }, [highlights, track, currentHighlight]);
  
  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) {
      console.error('No audio element available');
      return;
    }
    
    if (isPlaying) {
      console.log('Pausing audio playback');
      audioRef.current.pause();
      clearInterval(progressIntervalRef.current);
    } else {
      console.log('Starting audio playback');
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio playback started successfully');
          // Update progress
          progressIntervalRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }, 1000);
        }).catch(error => {
          console.error('Error starting audio playback:', error);
          // Handle autoplay restrictions
          if (error.name === 'NotAllowedError') {
            console.warn('Autoplay prevented by browser. User interaction required.');
          }
        });
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle volume change
  const handleVolumeChange = (value) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
    
    if (value === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  // Handle seeking
  const handleSeek = (value) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };
  
  // Play a specific highlight
  const playHighlight = (highlight) => {
    if (!audioRef.current || !highlight) {
      console.error('Cannot play highlight: audio element or highlight not available');
      return;
    }
    
    console.log(`Playing highlight at ${highlight.start}s`);
    setCurrentHighlight(highlight);
    audioRef.current.currentTime = highlight.start;
    
    if (!isPlaying) {
      togglePlay();
    }
  };
  
  // Handle next highlight
  const handleNextHighlight = () => {
    if (!highlights || highlights.length <= 1 || !currentHighlight) return;
    
    const currentIndex = highlights.indexOf(currentHighlight);
    if (currentIndex < highlights.length - 1) {
      playHighlight(highlights[currentIndex + 1]);
    } else if (onNext) {
      // If we're at the last highlight, move to the next track
      onNext();
    }
  };
  
  // Handle previous highlight
  const handlePreviousHighlight = () => {
    if (!highlights || highlights.length <= 1 || !currentHighlight) return;
    
    const currentIndex = highlights.indexOf(currentHighlight);
    if (currentIndex > 0) {
      playHighlight(highlights[currentIndex - 1]);
    } else if (onPrevious) {
      // If we're at the first highlight, move to the previous track
      onPrevious();
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get the current highlight info
  const getCurrentHighlightInfo = () => {
    if (!currentHighlight) return null;
    
    const index = highlights.indexOf(currentHighlight);
    return highlightInfo.find(info => info.index === index);
  };
  
  const currentInfo = getCurrentHighlightInfo();
  
  return (
    <Box
      p={4}
      borderRadius="lg"
      bg={bgColor}
      boxShadow="md"
      width="100%"
    >
      <VStack spacing={4} align="stretch">
        {/* Track info */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={textColor}>
              {track?.name || 'No track selected'}
            </Text>
            <Text color="gray.500">
              {track?.artists?.map(a => a.name).join(', ') || 'Unknown artist'}
            </Text>
          </Box>
          
          {currentHighlight && highlights && highlights.length > 0 && (
            <Badge colorScheme="green" p={2} borderRadius="md">
              Highlight {highlights.indexOf(currentHighlight) + 1}/{highlights.length}
            </Badge>
          )}
        </Flex>
        
        {/* Highlight info */}
        {currentInfo && (
          <Box p={2} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <HStack>
              <Icon as={FaRegLightbulb} color="yellow.500" />
              <Text fontSize="sm" fontWeight="medium">
                {currentInfo.description}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {currentInfo.timeRange}
              </Text>
            </HStack>
          </Box>
        )}
        
        {/* Playback controls */}
        <HStack spacing={4} justify="center" align="center">
          <IconButton
            aria-label="Previous highlight"
            icon={<FaStepBackward />}
            onClick={handlePreviousHighlight}
            isDisabled={!highlights || highlights.length <= 1 || !currentHighlight}
            variant="ghost"
          />
          
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={togglePlay}
            isDisabled={!track || !track.preview_url}
            colorScheme="green"
            size="lg"
            borderRadius="full"
          />
          
          <IconButton
            aria-label="Next highlight"
            icon={<FaStepForward />}
            onClick={handleNextHighlight}
            isDisabled={!highlights || highlights.length <= 1 || !currentHighlight}
            variant="ghost"
          />
        </HStack>
        
        {/* Progress bar */}
        <Box>
          <Slider
            aria-label="Progress"
            value={currentTime}
            min={0}
            max={duration || 30}
            onChange={handleSeek}
            isDisabled={!track || !track.preview_url}
          >
            <SliderTrack>
              <SliderFilledTrack bg={progressColor} />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>
          
          <Flex justify="space-between" fontSize="sm" color="gray.500">
            <Text>{formatTime(currentTime)}</Text>
            <Text>{formatTime(duration)}</Text>
          </Flex>
        </Box>
        
        {/* Volume control */}
        <HStack spacing={2}>
          <IconButton
            aria-label={isMuted ? "Unmute" : "Mute"}
            icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            onClick={toggleMute}
            size="sm"
            variant="ghost"
          />
          
          <Slider
            aria-label="Volume"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            width="100px"
          >
            <SliderTrack>
              <SliderFilledTrack bg={progressColor} />
            </SliderTrack>
            <SliderThumb boxSize={2} />
          </Slider>
        </HStack>
        
        {/* Highlight navigation */}
        {highlights && highlights.length > 1 && (
          <Box mt={2}>
            <Divider mb={2} />
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              All Highlights
            </Text>
            <HStack spacing={2} overflowX="auto" pb={2}>
              {highlightInfo.map((info, index) => (
                <Badge
                  key={index}
                  colorScheme={currentHighlight === info.highlight ? "green" : "gray"}
                  p={2}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => playHighlight(info.highlight)}
                >
                  {info.timeRange}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
        
        {/* Error message if no preview available */}
        {(!track || !track.preview_url) && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              No preview available for this track. Try another track or check your Spotify account.
            </Text>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default HighlightPlayer; 