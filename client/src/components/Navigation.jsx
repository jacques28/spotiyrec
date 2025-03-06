import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Flex, IconButton, useColorModeValue, Stack, HStack, Container } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { FaGithub } from 'react-icons/fa';

const NavLink = ({ children, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to}>
      <Box
        px={4}
        py={2}
        rounded={'md'}
        position="relative"
        fontWeight="medium"
        color={isActive ? 'green.500' : 'gray.600'}
        _hover={{
          textDecoration: 'none',
          color: 'green.500',
          _after: {
            width: '100%',
          },
        }}
        _after={{
          content: '""',
          position: 'absolute',
          width: isActive ? '100%' : '0%',
          height: '2px',
          bottom: '-2px',
          left: '0',
          bg: 'green.500',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {children}
      </Box>
    </Link>
  );
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg={bg}
      boxShadow="sm"
      borderBottom="1px"
      borderColor={borderColor}
      zIndex={1000}
    >
      <Container maxW="7xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Link to="/">
            <Box
              fontSize="xl"
              fontWeight="bold"
              bgGradient="linear(to-r, green.400, green.600)"
              bgClip="text"
              _hover={{
                bgGradient: 'linear(to-r, green.500, green.700)',
              }}
            >
              Spotiyrec
            </Box>
          </Link>

          <HStack spacing={8} alignItems="center">
            <HStack
              as="nav"
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              <NavLink to="/spotify">Spotify</NavLink>
              <NavLink to="/apple-music">Apple Music</NavLink>
              <NavLink to="/discover">Discover</NavLink>
            </HStack>
          </HStack>

          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={() => setIsOpen(!isOpen)}
          />
        </Flex>

        {isOpen && (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as="nav" spacing={4}>
              <NavLink to="/spotify">Spotify</NavLink>
              <NavLink to="/apple-music">Apple Music</NavLink>
              <NavLink to="/discover">Discover</NavLink>
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Navigation; 