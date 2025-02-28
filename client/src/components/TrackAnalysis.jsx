import React from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Progress,
  VStack,
  HStack,
  Tooltip,
  Icon,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FaMusic, 
  FaHeartbeat, 
  FaGuitar, 
  FaVolumeUp, 
  FaRegLightbulb, 
  FaStar, 
  FaRegSmile, 
  FaRegSadTear,
  FaThumbsUp
} from 'react-icons/fa';

const TrackAnalysis = ({ track, audioFeatures, recommendations }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('green.500', 'green.300');

  // Format values as percentages
  const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  // Determine mood based on valence
  const getMood = (valence) => {
    if (valence > 0.7) return { icon: FaRegSmile, text: 'Happy', color: 'green' };
    if (valence < 0.3) return { icon: FaRegSadTear, text: 'Sad', color: 'blue' };
    return { icon: FaRegSmile, text: 'Neutral', color: 'yellow' };
  };

  // Get key name from pitch class
  const getKeyName = (key, mode) => {
    const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
    const modeName = mode ? 'Major' : 'Minor';
    return key >= 0 ? `${keys[key]} ${modeName}` : 'Unknown';
  };

  // Get tempo category
  const getTempoCategory = (tempo) => {
    if (tempo < 80) return 'Slow';
    if (tempo > 120) return 'Fast';
    return 'Moderate';
  };

  // If no audio features are available
  if (!audioFeatures) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
        <Text>No audio analysis available for this track.</Text>
      </Box>
    );
  }

  const mood = getMood(audioFeatures.valence);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor} boxShadow="sm">
      <Text fontWeight="bold" fontSize="lg" mb={4}>Track Analysis</Text>
      
      {/* Key musical characteristics */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={6} mb={6}>
        <VStack align="start" flex="1">
          <HStack>
            <Icon as={FaMusic} color={accentColor} />
            <Text fontWeight="medium">Key & Mode</Text>
          </HStack>
          <Badge colorScheme="purple" fontSize="md" px={2} py={1}>
            {getKeyName(audioFeatures.key, audioFeatures.mode)}
          </Badge>
        </VStack>
        
        <VStack align="start" flex="1">
          <HStack>
            <Icon as={FaHeartbeat} color={accentColor} />
            <Text fontWeight="medium">Tempo</Text>
          </HStack>
          <Badge colorScheme="blue" fontSize="md" px={2} py={1}>
            {Math.round(audioFeatures.tempo)} BPM ({getTempoCategory(audioFeatures.tempo)})
          </Badge>
        </VStack>
        
        <VStack align="start" flex="1">
          <HStack>
            <Icon as={mood.icon} color={accentColor} />
            <Text fontWeight="medium">Mood</Text>
          </HStack>
          <Badge colorScheme={mood.color} fontSize="md" px={2} py={1}>
            {mood.text}
          </Badge>
        </VStack>
      </Flex>
      
      {/* Detailed metrics */}
      <VStack spacing={3} align="stretch" mb={6}>
        <Flex align="center">
          <Text width="120px" fontSize="sm">Energy</Text>
          <Tooltip label={formatPercentage(audioFeatures.energy)}>
            <Progress 
              value={audioFeatures.energy * 100} 
              colorScheme="red" 
              flex="1" 
              borderRadius="full"
              size="sm"
            />
          </Tooltip>
        </Flex>
        
        <Flex align="center">
          <Text width="120px" fontSize="sm">Danceability</Text>
          <Tooltip label={formatPercentage(audioFeatures.danceability)}>
            <Progress 
              value={audioFeatures.danceability * 100} 
              colorScheme="purple" 
              flex="1" 
              borderRadius="full"
              size="sm"
            />
          </Tooltip>
        </Flex>
        
        <Flex align="center">
          <Text width="120px" fontSize="sm">Acousticness</Text>
          <Tooltip label={formatPercentage(audioFeatures.acousticness)}>
            <Progress 
              value={audioFeatures.acousticness * 100} 
              colorScheme="green" 
              flex="1" 
              borderRadius="full"
              size="sm"
            />
          </Tooltip>
        </Flex>
        
        <Flex align="center">
          <Text width="120px" fontSize="sm">Instrumentalness</Text>
          <Tooltip label={formatPercentage(audioFeatures.instrumentalness)}>
            <Progress 
              value={audioFeatures.instrumentalness * 100} 
              colorScheme="blue" 
              flex="1" 
              borderRadius="full"
              size="sm"
            />
          </Tooltip>
        </Flex>
        
        <Flex align="center">
          <Text width="120px" fontSize="sm">Liveness</Text>
          <Tooltip label={formatPercentage(audioFeatures.liveness)}>
            <Progress 
              value={audioFeatures.liveness * 100} 
              colorScheme="orange" 
              flex="1" 
              borderRadius="full"
              size="sm"
            />
          </Tooltip>
        </Flex>
      </VStack>
      
      {/* Highlight explanation */}
      {track.preview_url && (
        <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
          <HStack mb={2}>
            <Icon as={FaRegLightbulb} color="yellow.400" />
            <Text fontWeight="medium">Highlight Selection</Text>
          </HStack>
          <Text fontSize="sm">
            Our algorithm has identified the most engaging 30-second segment based on 
            {audioFeatures.energy > 0.7 ? ' high energy, ' : ' '}
            {audioFeatures.danceability > 0.7 ? 'danceable rhythm, ' : ''}
            {audioFeatures.valence > 0.7 ? 'positive mood, ' : ''}
            and dynamic audio patterns.
          </Text>
        </Box>
      )}
      
      {/* Recommendations section */}
      {recommendations && recommendations.length > 0 && (
        <>
          <Divider my={4} />
          <Text fontWeight="bold" fontSize="md" mb={3}>
            <Icon as={FaThumbsUp} mr={2} color={accentColor} />
            Why You Might Like This Track
          </Text>
          <VStack align="start" spacing={2}>
            {recommendations.map((reason, index) => (
              <HStack key={index} spacing={2}>
                <Icon as={FaStar} color="yellow.400" boxSize={3} />
                <Text fontSize="sm">{reason}</Text>
              </HStack>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
};

export default TrackAnalysis; 