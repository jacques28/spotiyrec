import React from 'react';
import { Box, Image, Text, Flex, Badge, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Handle missing album data gracefully
  if (!album) return null;
  
  const { id, name, artists, images, release_date, total_tracks, type } = album;
  
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
    // Navigate to the appropriate page based on type
    if (type === 'playlist') {
      // For now, we'll just show an alert since we don't have a playlist page
      alert('Playlist view is not implemented yet');
      return;
    }
    navigate(`/album/${id}`);
  };
  
  return (
    <Box
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <Image 
        src={albumImage} 
        alt={`${name} ${type || 'album'} cover`}
        width="100%"
        height="auto"
        objectFit="cover"
      />
      
      <Box p={4}>
        <Text
          fontWeight="bold"
          fontSize="lg"
          noOfLines={1}
          title={name}
        >
          {name}
        </Text>
        
        <Text 
          color="gray.500" 
          fontSize="md"
          noOfLines={1}
          title={artistNames}
        >
          {artistNames}
        </Text>
        
        <Flex mt={2} justify="space-between" align="center">
          <Badge 
            colorScheme={type === 'playlist' ? 'purple' : 'green'} 
            variant="subtle" 
            px={2} 
            py={1} 
            borderRadius="md"
          >
            {type === 'playlist' ? 'Playlist' : `${total_tracks || '?'} tracks`}
          </Badge>
          
          {releaseYear && (
            <Text fontSize="sm" color="gray.500">
              {releaseYear}
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default AlbumCard; 