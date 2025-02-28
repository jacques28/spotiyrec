import React from 'react';
import { Box, Container, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Flex direction="column" minH="100vh" bg={bgColor}>
      <Navbar />
      <Box flex="1" py={8}>
        <Container maxW="container.xl">
          <Outlet />
        </Container>
      </Box>
      <Box as="footer" py={6} textAlign="center" bg={useColorModeValue('white', 'gray.800')}>
        <Container maxW="container.xl">
          © {new Date().getFullYear()} SpotiYRec. All rights reserved.
        </Container>
      </Box>
    </Flex>
  );
};

export default Layout; 