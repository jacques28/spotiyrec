import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Heading, Text, SimpleGrid, VStack, Icon, useColorModeValue, Button, Flex, keyframes } from '@chakra-ui/react';
import { FaSpotify, FaMusic, FaHeadphones } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ServiceCard = ({ name, icon: IconComponent, description, path, color, isAvailable = true }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <MotionBox
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        bg={cardBg}
        p={8}
        borderRadius="xl"
        boxShadow="xl"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        transition="all 0.3s"
        _hover={{ bg: hoverBg }}
        height="100%"
        position="relative"
        overflow="hidden"
      >
        <VStack spacing={4}>
          <Icon as={IconComponent} w={12} h={12} color={color} />
          <Heading size="md" textAlign="center">{name}</Heading>
          <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
            {description}
          </Text>
          {isAvailable ? (
            <Button
              as={Link}
              to={path}
              colorScheme={color.split('.')[0]}
              size="lg"
              width="full"
              mt="auto"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
            >
              Connect with {name}
            </Button>
          ) : (
            <Button
              isDisabled
              size="lg"
              width="full"
              mt="auto"
              opacity={0.7}
            >
              Coming Soon
            </Button>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
};

const FeatureCard = ({ icon: IconComponent, title, description }) => (
  <Box
    p={6}
    borderRadius="lg"
    bg={useColorModeValue('white', 'gray.800')}
    boxShadow="md"
    border="1px"
    borderColor={useColorModeValue('gray.200', 'gray.700')}
    transition="all 0.3s"
    _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
  >
    <VStack spacing={4}>
      <Icon as={IconComponent} w={8} h={8} color="green.500" />
      <Heading size="md">{title}</Heading>
      <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
        {description}
      </Text>
    </VStack>
  </Box>
);

const LandingPage = () => {
  const bgGradient = useColorModeValue(
    'linear(to-b, gray.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="7xl" pt={{ base: 20, md: 28 }} pb={20}>
        <VStack spacing={16}>
          {/* Hero Section */}
          <VStack spacing={6} textAlign="center" animation={`${fadeIn} 1s ease-out`}>
            <Heading
              as="h1"
              size="3xl"
              bgGradient="linear(to-r, green.400, green.600)"
              bgClip="text"
              letterSpacing="tight"
            >
              Welcome to Spotiyrec
            </Heading>
            <Text
              fontSize="xl"
              color={useColorModeValue('gray.600', 'gray.400')}
              maxW="2xl"
            >
              Your universal music companion. Connect with your favorite music services and discover new tracks across platforms.
            </Text>
          </VStack>

          {/* Services Section */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            <ServiceCard
              name="Spotify"
              icon={FaSpotify}
              color="green.500"
              description="Access your Spotify library, discover personalized recommendations, and enjoy seamless playback."
              path="/spotify"
            />
            <ServiceCard
              name="Apple Music"
              icon={FaMusic}
              color="red.500"
              description="Browse the Apple Music catalog, get personalized playlists, and listen to high-quality previews."
              path="/apple-music"
            />
            <ServiceCard
              name="Deezer"
              icon={FaHeadphones}
              color="blue.500"
              description="Coming soon! Connect with Deezer to access millions of tracks and exclusive content."
              path="/deezer"
              isAvailable={false}
            />
          </SimpleGrid>

          {/* Features Section */}
          <Box w="full">
            <Heading textAlign="center" mb={12} size="xl">
              Why Choose Spotiyrec?
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <FeatureCard
                icon={FaMusic}
                title="Cross-Platform"
                description="Access multiple music services in one place, seamlessly switching between platforms."
              />
              <FeatureCard
                icon={FaHeadphones}
                title="Smart Recommendations"
                description="Get personalized music suggestions based on your listening habits across services."
              />
              <FeatureCard
                icon={FaSpotify}
                title="Unified Experience"
                description="Enjoy a consistent interface while exploring different music platforms."
              />
            </SimpleGrid>
          </Box>

          {/* Footer */}
          <Flex
            as="footer"
            width="full"
            justify="center"
            py={8}
            borderTop="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              © {new Date().getFullYear()} Spotiyrec. All rights reserved.
            </Text>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default LandingPage; 