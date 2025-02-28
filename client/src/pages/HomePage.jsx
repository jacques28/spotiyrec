import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Image,
  useColorModeValue,
  Container,
  Flex,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';
import useSpotifyAPI from '../hooks/useSpotifyAPI';
import AlbumCard from '../components/AlbumCard';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useSpotify();
  const { getNewReleases, loading, error } = useSpotifyAPI();
  const [newReleases, setNewReleases] = useState([]);
  
  const bgGradient = useColorModeValue(
    'linear(to-b, green.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  useEffect(() => {
    const fetchNewReleases = async () => {
      if (isAuthenticated) {
        try {
          const response = await getNewReleases({ limit: 6 });
          setNewReleases(response.albums.items);
        } catch (err) {
          console.error('Error fetching new releases:', err);
        }
      }
    };
    
    fetchNewReleases();
  }, [isAuthenticated, getNewReleases]);
  
  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        pt={{ base: 10, md: 20 }}
        pb={{ base: 16, md: 24 }}
        px={8}
        borderRadius="lg"
        mb={10}
      >
        <Container maxW="container.xl">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            gap={8}
          >
            <VStack
              align={{ base: 'center', md: 'flex-start' }}
              spacing={6}
              maxW={{ base: 'full', md: '50%' }}
              textAlign={{ base: 'center', md: 'left' }}
            >
              <Heading
                as="h1"
                size="2xl"
                fontWeight="bold"
                color={useColorModeValue('gray.800', 'white')}
                lineHeight="shorter"
              >
                Discover the Best Moments in Music
              </Heading>
              <Text
                fontSize="xl"
                color={useColorModeValue('gray.600', 'gray.300')}
              >
                SpotiYRec helps you find and enjoy the most engaging parts of your favorite albums with our unique Highlights feature.
              </Text>
              <HStack spacing={4}>
                {!isAuthenticated ? (
                  <Button
                    size="lg"
                    colorScheme="green"
                    onClick={login}
                    px={8}
                  >
                    Connect with Spotify
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    colorScheme="green"
                    onClick={() => navigate('/discover')}
                    px={8}
                  >
                    Start Discovering
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/about')}
                >
                  Learn More
                </Button>
              </HStack>
            </VStack>
            
            <Box
              maxW={{ base: '300px', md: '400px' }}
              borderRadius="2xl"
              overflow="hidden"
              boxShadow="2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                alt="Music Discovery"
                objectFit="cover"
              />
            </Box>
          </Flex>
        </Container>
      </Box>
      
      {/* New Releases Section */}
      <Box mb={16}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h2" size="xl">
            New Releases
          </Heading>
          <Button
            variant="ghost"
            colorScheme="green"
            onClick={() => navigate('/discover')}
          >
            View All
          </Button>
        </Flex>
        
        {loading ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={6}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} borderRadius="lg" overflow="hidden" boxShadow="md">
                <Skeleton height="200px" />
                <Box p={4}>
                  <SkeletonText mt={2} noOfLines={2} spacing={4} />
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        ) : error ? (
          <Text color="red.500">Error loading new releases. Please try again later.</Text>
        ) : newReleases.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={6}>
            {newReleases.map(album => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </SimpleGrid>
        ) : (
          <Text>
            {isAuthenticated
              ? 'No new releases found. Try again later.'
              : 'Sign in with Spotify to see new releases.'}
          </Text>
        )}
      </Box>
      
      {/* Features Section */}
      <Box mb={16}>
        <Heading as="h2" size="xl" mb={8} textAlign="center">
          Features
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <VStack align="flex-start" spacing={4}>
            <Heading as="h3" size="md">
              Album Highlights
            </Heading>
            <Text>
              Our algorithm identifies the most engaging parts of songs, so you can enjoy the best moments of any album.
            </Text>
          </VStack>
          
          <VStack align="flex-start" spacing={4}>
            <Heading as="h3" size="md">
              Smart Recommendations
            </Heading>
            <Text>
              Get personalized music recommendations based on the highlights you enjoy the most.
            </Text>
          </VStack>
          
          <VStack align="flex-start" spacing={4}>
            <Heading as="h3" size="md">
              Beautiful Interface
            </Heading>
            <Text>
              Enjoy a clean, modern interface designed for music lovers, with dark and light modes.
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default HomePage; 