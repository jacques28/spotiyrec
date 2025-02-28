import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Center, Text, VStack } from '@chakra-ui/react';
import { useSpotify } from '../context/SpotifyContext';

const CallbackPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSpotify();

  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
    }
    
    // The SpotifyContext will handle token extraction from URL
    // This component just provides a loading UI while that happens
    
    // Add a fallback redirect in case something goes wrong
    const timeoutId = setTimeout(() => {
      if (!isAuthenticated) {
        console.error('Authentication timeout - redirecting to home');
        navigate('/');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, navigate]);

  return (
    <Center h="100vh">
      <VStack spacing={6}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="green.500"
          size="xl"
        />
        <Text fontSize="xl">Connecting to Spotify...</Text>
        <Text color="gray.500">Please wait while we complete the authentication process.</Text>
      </VStack>
    </Center>
  );
};

export default CallbackPage; 