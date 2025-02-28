import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  IconButton,
  useColorModeValue,
  useColorMode,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  HStack,
  Link
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useSpotify } from '../context/SpotifyContext';

const NavLink = ({ children, to }) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, isAuthenticated, login, logout } = useSpotify();
  
  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4} boxShadow="sm">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems={'center'}>
          <Box fontWeight="bold" fontSize="xl">
            <Text as={RouterLink} to="/" color="spotify.green">
              SpotiYRec
            </Text>
          </Box>
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/discover">Discover</NavLink>
            <NavLink to="/albums">Albums</NavLink>
            {isAuthenticated && <NavLink to="/library">My Library</NavLink>}
          </HStack>
        </HStack>
        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            <IconButton
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              aria-label={`Toggle ${colorMode === 'light' ? 'Dark' : 'Light'} Mode`}
              variant="ghost"
            />

            {isAuthenticated ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <Avatar
                    size={'sm'}
                    src={user?.images?.[0]?.url}
                    name={user?.display_name || 'User'}
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={logout}>Sign Out</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                variant={'solid'}
                colorScheme={'green'}
                size={'sm'}
                onClick={login}
              >
                Sign In with Spotify
              </Button>
            )}
          </Stack>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/discover">Discover</NavLink>
            <NavLink to="/albums">Albums</NavLink>
            {isAuthenticated && <NavLink to="/library">My Library</NavLink>}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navbar; 