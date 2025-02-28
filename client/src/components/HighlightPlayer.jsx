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
  Icon
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
      setDuration(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
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
    if (!highlights || highlights.length === 0) return;
    
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
  }, [highlights, currentHighlight]);
  
  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      clearInterval(progressIntervalRef.current);
    } else {
      audioRef.current.play();
      
      // Update progress
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(audioRef.current.currentTime);
      }, 1000);
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
  
  // Handle seek
  const handleSeek = (value) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };
  
  // Play a specific highlight
  const playHighlight = (highlight) => {
    if (!audioRef.current || !highlight) return;
    
    setCurrentHighlight(highlight);
    audioRef.current.currentTime = highlight.start;
    
    if (!isPlaying) {
      togglePlay();
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
          
          {currentHighlight && (
            <Badge colorScheme="green" p={2} borderRadius="md">
              Highlight {highlights.indexOf(currentHighlight) + 1}/{highlights.length}
            </Badge>
          )}
        </Flex>
        
        {/* Highlight info */}
        {currentInfo && (
          <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <HStack mb={2}>
              <Icon as={FaRegLightbulb} color="yellow.400" />
              <Text fontWeight="medium">Current Highlight</Text>
            </HStack>
            <Text fontSize="sm">{currentInfo.description}</Text>
            <HStack mt={2} fontSize="xs" color="gray.500">
              <Icon as={FaMusic} />
              <Text>Timestamp: {currentInfo.timeRange}</Text>
              
              {currentHighlight.energy && (
                <>
                  <Icon as={FaHeartbeat} ml={2} />
                  <Text>Energy: {Math.round(currentHighlight.energy * 100)}%</Text>
                </>
              )}
            </HStack>
          </Box>
        )}
        
        {/* Progress bar */}
        <Box>
          <Slider
            aria-label="seek-slider"
            value={currentTime}
            min={0}
            max={duration || 30}
            onChange={handleSeek}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <SliderTrack>
              <SliderFilledTrack bg={progressColor} />
            </SliderTrack>
            <Tooltip
              hasArrow
              bg="gray.700"
              color="white"
              placement="top"
              isOpen={showTooltip}
              label={formatTime(currentTime)}
            >
              <SliderThumb />
            </Tooltip>
          </Slider>
          
          <Flex justify="space-between">
            <Text fontSize="sm" color="gray.500">
              {formatTime(currentTime)}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {formatTime(duration || 30)}
            </Text>
          </Flex>
        </Box>
        
        {/* Controls */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              aria-label="Previous track"
              icon={<FaStepBackward />}
              variant="ghost"
              onClick={onPrevious}
              isDisabled={!onPrevious}
            />
            
            <IconButton
              aria-label={isPlaying ? 'Pause' : 'Play'}
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              colorScheme="green"
              borderRadius="full"
              size="lg"
              onClick={togglePlay}
              isDisabled={!track || !track.preview_url}
            />
            
            <IconButton
              aria-label="Next track"
              icon={<FaStepForward />}
              variant="ghost"
              onClick={onNext}
              isDisabled={!onNext}
            />
          </HStack>
          
          <HStack spacing={2} width="120px">
            <IconButton
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            />
            
            <Slider
              aria-label="volume-slider"
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
            >
              <SliderTrack>
                <SliderFilledTrack bg={progressColor} />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </HStack>
        </Flex>
        
        {/* Highlights section */}
        {highlights && highlights.length > 0 && (
          <Box mt={4}>
            <Divider mb={3} />
            <Text fontWeight="bold" mb={2}>
              Track Highlights
            </Text>
            <HStack spacing={2} overflowX="auto" pb={2}>
              {highlightInfo.map((info, index) => (
                <Badge
                  key={index}
                  px={3}
                  py={2}
                  borderRadius="md"
                  colorScheme={currentHighlight === highlights[info.index] ? 'green' : 'gray'}
                  cursor="pointer"
                  onClick={() => playHighlight(highlights[info.index])}
                >
                  <VStack spacing={0} align="start">
                    <Text>Highlight {info.index + 1}</Text>
                    <Text fontSize="xs">{info.timeRange}</Text>
                  </VStack>
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default HighlightPlayer; 