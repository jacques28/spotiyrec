import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Flex,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Skeleton,
  useColorModeValue,
  VStack,
  HStack,
  Select
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useSpotify } from '../context/SpotifyContext';
import useSpotifyAPI from '../hooks/useSpotifyAPI';
import AlbumCard from '../components/AlbumCard';

const DiscoverPage = () => {
  const { isAuthenticated, login } = useSpotify();
  const {
    searchAlbums,
    getNewReleases,
    getFeaturedPlaylists,
    getTopArtists,
    loading,
    error
  } = useSpotifyAPI();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [featuredPlaylistsMessage, setFeaturedPlaylistsMessage] = useState('');
  const [topArtists, setTopArtists] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [genre, setGenre] = useState('all');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthenticated) return;
      
      try {
        // Get new releases
        const releasesResponse = await getNewReleases({ limit: 12 });
        setNewReleases(releasesResponse.albums.items);
        
        // Get featured playlists - now with error handling in the hook
        const playlistsResponse = await getFeaturedPlaylists({ limit: 6 });
        console.log('Featured playlists response:', playlistsResponse);
        
        if (playlistsResponse && playlistsResponse.playlists) {
          setFeaturedPlaylists(playlistsResponse.playlists.items || []);
          // Store the message if available
          if (playlistsResponse.message) {
            setFeaturedPlaylistsMessage(playlistsResponse.message);
          }
        } else {
          console.warn('Featured playlists response was invalid:', playlistsResponse);
          setFeaturedPlaylists([]);
          setFeaturedPlaylistsMessage('Featured playlists are not available at this time.');
        }
        
        // Get user's top artists - with fallback
        try {
          const artistsResponse = await getTopArtists({ limit: 6 });
          setTopArtists(artistsResponse.items);
        } catch (artistErr) {
          console.error('Error fetching top artists:', artistErr);
          setTopArtists([]);
        }
      } catch (err) {
        console.error('Error fetching discover data:', err);
      }
    };
    
    fetchInitialData();
  }, [isAuthenticated, getNewReleases, getFeaturedPlaylists, getTopArtists]);
  
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const response = await searchAlbums(searchQuery, { limit: 24 });
      setSearchResults(response.albums.items);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Filter albums by genre
  const filterByGenre = (albums) => {
    if (genre === 'all') return albums;
    
    return albums.filter(album => {
      // This is a simplified approach since Spotify doesn't directly expose genres for albums
      // In a real app, you might need to check the artist's genres
      const albumName = album.name.toLowerCase();
      const artistName = album.artists.map(a => a.name.toLowerCase()).join(' ');
      const combinedText = `${albumName} ${artistName}`;
      
      switch (genre) {
        case 'rock':
          return combinedText.includes('rock');
        case 'pop':
          return combinedText.includes('pop');
        case 'hip-hop':
          return combinedText.includes('hip hop') || combinedText.includes('rap');
        case 'electronic':
          return combinedText.includes('electronic') || combinedText.includes('edm') || combinedText.includes('techno');
        case 'jazz':
          return combinedText.includes('jazz');
        case 'classical':
          return combinedText.includes('classical') || combinedText.includes('orchestra');
        default:
          return true;
      }
    });
  };
  
  if (!isAuthenticated) {
    return (
      <Box textAlign="center" py={10}>
        <Heading mb={6}>Sign in to discover music</Heading>
        <Text mb={6}>Connect with Spotify to explore new releases and find album highlights.</Text>
        <Button colorScheme="green" size="lg" onClick={login}>
          Connect with Spotify
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Search Section */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          boxShadow="md"
        >
          <Heading as="h1" size="xl" mb={6}>
            Discover Music
          </Heading>
          
          <form onSubmit={handleSearch}>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <InputGroup size="lg" flex="1">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search for albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="full"
                />
              </InputGroup>
              
              <Select
                size="lg"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                width={{ base: 'full', md: '200px' }}
                borderRadius="full"
              >
                <option value="all">All Genres</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="electronic">Electronic</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
              </Select>
              
              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                isLoading={searchLoading}
                px={8}
                borderRadius="full"
              >
                Search
              </Button>
            </Flex>
          </form>
          
          {searchError && (
            <Text color="red.500" mt={4}>
              {searchError}
            </Text>
          )}
        </Box>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Search Results
            </Heading>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {filterByGenre(searchResults).map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </SimpleGrid>
            
            {filterByGenre(searchResults).length === 0 && (
              <Text textAlign="center" py={10}>
                No results found for the selected genre. Try a different genre or search term.
              </Text>
            )}
          </Box>
        )}
        
        {/* Tabs for different discovery sections */}
        <Tabs colorScheme="green" isLazy>
          <TabList>
            <Tab>New Releases</Tab>
            <Tab>Featured</Tab>
            <Tab>Based on Your Taste</Tab>
          </TabList>
          
          <TabPanels>
            {/* New Releases Tab */}
            <TabPanel px={0}>
              {loading ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} height="300px" borderRadius="lg" />
                  ))}
                </SimpleGrid>
              ) : newReleases.length > 0 ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                  {filterByGenre(newReleases).map(album => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </SimpleGrid>
              ) : (
                <Text textAlign="center" py={10}>
                  No new releases found. Try again later.
                </Text>
              )}
            </TabPanel>
            
            {/* Featured Tab */}
            <TabPanel px={0}>
              {loading ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} height="300px" borderRadius="lg" />
                  ))}
                </SimpleGrid>
              ) : featuredPlaylists.length > 0 ? (
                <>
                  {featuredPlaylistsMessage && (
                    <Heading as="h3" size="md" mb={4}>
                      {featuredPlaylistsMessage}
                    </Heading>
                  )}
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {featuredPlaylists.map(playlist => (
                      <AlbumCard 
                        key={playlist.id} 
                        album={{
                          id: playlist.id,
                          name: playlist.name,
                          images: playlist.images,
                          artists: [{ name: playlist.owner.display_name }],
                          type: 'playlist'
                        }} 
                      />
                    ))}
                  </SimpleGrid>
                </>
              ) : (
                <Box textAlign="center" py={10} bg={bgColor} borderRadius="lg" p={6}>
                  <Heading as="h3" size="md" mb={4}>
                    Featured Playlists Not Available
                  </Heading>
                  <Text mb={4}>
                    {featuredPlaylistsMessage || 'Featured playlists might not be available in your region or with your current Spotify account type.'}
                  </Text>
                  <Text>
                    Try exploring New Releases or search for specific albums instead.
                  </Text>
                </Box>
              )}
            </TabPanel>
            
            {/* Based on Your Taste Tab */}
            <TabPanel px={0}>
              {loading ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} height="300px" borderRadius="lg" />
                  ))}
                </SimpleGrid>
              ) : topArtists.length > 0 ? (
                <>
                  <Text mb={4}>
                    Based on your listening history, you might enjoy these albums:
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                    {topArtists.map(artist => (
                      <Box
                        key={artist.id}
                        borderWidth="1px"
                        borderRadius="lg"
                        overflow="hidden"
                        bg={bgColor}
                        transition="all 0.3s"
                        _hover={{
                          transform: 'translateY(-8px)',
                          boxShadow: 'xl',
                          cursor: 'pointer'
                        }}
                      >
                        <Box position="relative" pb="100%">
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bgImage={`url(${artist.images[0]?.url})`}
                            bgSize="cover"
                            bgPosition="center"
                          />
                        </Box>
                        <Box p={4}>
                          <Heading as="h3" size="md" noOfLines={1}>
                            {artist.name}
                          </Heading>
                          <Text color="gray.500" mt={2}>
                            {artist.genres?.slice(0, 3).join(', ') || 'Artist'}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </SimpleGrid>
                </>
              ) : (
                <Box textAlign="center" py={10} bg={bgColor} borderRadius="lg" p={6}>
                  <Heading as="h3" size="md" mb={4}>
                    Personalized Recommendations Not Available
                  </Heading>
                  <Text mb={4}>
                    We need more listening history to provide personalized recommendations.
                  </Text>
                  <Text>
                    Try exploring New Releases or search for specific albums to build your profile.
                  </Text>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default DiscoverPage;