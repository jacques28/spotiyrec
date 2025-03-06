import React from 'react';
import { Box, Image, Text, Flex, Badge, useColorModeValue, Skeleton, Icon, Tooltip, VStack, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCompactDisc, FaCalendarAlt, FaMusic } from 'react-icons/fa';

const MotionBox = motion(Box);

const AlbumCard = ({ album, isLoading = false }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Handle missing album data gracefully
  if (!album && !isLoading) return null;
  
  const { id, name, artists, images, release_date, total_tracks, type } = album || {};
  
  // Get the appropriate image size
  const albumImage = images && images.length > 0 
    ? images[0].url // Use the first (largest) image
    : 'https://via.placeholder.com/300?text=No+Image';
  
  // Format artist names
  const artistNames = artists && artists.length > 0
    ? artists.map(artist => artist.name).join(', ')
    : 'Unknown Artist';
  
  // Format release year
  const releaseYear = release_date ? release_date.split('-')[0] : '';
  
  const handleClick = () => {
    if (isLoading) return;
    
    // Navigate to the appropriate page based on type
    if (type === 'playlist') {
      // For now, we'll just show an alert since we don't have a playlist page
      alert('Playlist view is not implemented yet');
      return;
    }
    navigate(`/album/${id}`);
  };
  
  if (isLoading) {
    return (
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        maxW="sm"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        borderColor={borderColor}
      >
        <Skeleton height="300px" />
        <Box p={4}>
          <Skeleton height="24px" width="80%" mb={2} />
          <Skeleton height="20px" width="60%" mb={4} />
          <Flex justify="space-between" align="center">
            <Skeleton height="20px" width="30%" />
            <Skeleton height="20px" width="20%" />
          </Flex>
        </Box>
      </MotionBox>
    );
  }
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      onClick={handleClick}
      position="relative"
    >
      <Box position="relative">
        <Image 
          src={albumImage} 
          alt={`${name} ${type || 'album'} cover`}
          width="100%"
          height="auto"
          objectFit="cover"
          fallback={<Skeleton height="300px" />}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          opacity={0}
          transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={FaCompactDisc} w={12} h={12} color="white" />
        </Box>
      </Box>
      
      <VStack p={4} align="stretch" spacing={2}>
        <Text
          fontWeight="bold"
          fontSize="lg"
          noOfLines={1}
          title={name}
          color={textColor}
        >
          {name}
        </Text>
        
        <Text 
          color={secondaryTextColor}
          fontSize="md"
          noOfLines={1}
          title={artistNames}
        >
          {artistNames}
        </Text>
        
        <Flex mt={2} justify="space-between" align="center">
          <HStack spacing={4}>
            <Tooltip label={`${total_tracks} tracks`} placement="top">
              <Flex align="center">
                <Icon as={FaMusic} color={secondaryTextColor} mr={1} />
                <Text fontSize="sm" color={secondaryTextColor}>
                  {total_tracks || '?'}
                </Text>
              </Flex>
            </Tooltip>
            
            {releaseYear && (
              <Tooltip label="Release year" placement="top">
                <Flex align="center">
                  <Icon as={FaCalendarAlt} color={secondaryTextColor} mr={1} />
                  <Text fontSize="sm" color={secondaryTextColor}>
                    {releaseYear}
                  </Text>
                </Flex>
              </Tooltip>
            )}
          </HStack>
          
          <Badge 
            colorScheme={type === 'playlist' ? 'purple' : 'green'} 
            variant="subtle" 
            px={2} 
            py={1} 
            borderRadius="md"
          >
            {type === 'playlist' ? 'Playlist' : 'Album'}
          </Badge>
        </Flex>
      </VStack>
    </MotionBox>
  );
};

export default AlbumCard; 