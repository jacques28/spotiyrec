import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  IconButton,
  HStack,
  Badge,
  Collapse,
  Button,
  Spinner,
  useColorModeValue,
  Tooltip,
  Flex,
  Divider
} from '@chakra-ui/react';
import { 
  FaPlay, 
  FaChevronDown, 
  FaChevronUp, 
  FaInfoCircle, 
  FaRegLightbulb, 
  FaThumbsUp, 
  FaClock 
} from 'react-icons/fa';
import TrackAnalysis from './TrackAnalysis';
import { findHighlightSegments, generateRecommendationReasons } from '../utils/trackAnalysis';

const EnhancedTrackList = ({ 
  tracks, 
  album,
  onPlayHighlight, 
  loadingHighlights, 
  currentTrackId,
  getTrackAnalysis,
  getTrackRecommendations
}) => {
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [trackAnalysisData, setTrackAnalysisData] = useState({});
  const [loadingAnalysis, setLoadingAnalysis] = useState({});
  const [recommendedTracks, setRecommendedTracks] = useState({});
  const [highlightSegments, setHighlightSegments] = useState({});
  const [userPreferences, setUserPreferences] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('green.500', 'green.300');
  
  // Format duration from ms to MM:SS
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Fetch user preferences on component mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        // This would typically come from an API call or local storage
        // For now, we'll use mock data
        setUserPreferences({
          favoriteGenres: ['Pop', 'Rock', 'Electronic'],
          preferredFeatures: {
            energy: 0.7,
            danceability: 0.6,
            valence: 0.5
          }
        });
      } catch (err) {
        console.error('Error fetching user preferences:', err);
      }
    };
    
    fetchUserPreferences();
  }, []);
  
  // Toggle expanded track
  const toggleTrackExpansion = async (trackId) => {
    // If clicking on the already expanded track, collapse it
    if (expandedTrack === trackId) {
      setExpandedTrack(null);
      return;
    }
    
    // Expand the clicked track
    setExpandedTrack(trackId);
    
    // If we don't have analysis data for this track yet, fetch it
    if (!trackAnalysisData[trackId]) {
      setLoadingAnalysis(prev => ({ ...prev, [trackId]: true }));
      
      try {
        // Get audio features and analysis
        const analysisData = await getTrackAnalysis(trackId);
        setTrackAnalysisData(prev => ({ ...prev, [trackId]: analysisData }));
        
        // Find highlight segments using our ML-based algorithm
        const highlights = findHighlightSegments(analysisData.analysis, analysisData.features);
        setHighlightSegments(prev => ({ ...prev, [trackId]: highlights }));
        
        // Get personalized recommendations
        const recommendations = await getTrackRecommendations(trackId);
        setRecommendedTracks(prev => ({ ...prev, [trackId]: recommendations }));
      } catch (err) {
        console.error('Error fetching track analysis:', err);
      } finally {
        setLoadingAnalysis(prev => ({ ...prev, [trackId]: false }));
      }
    }
  };
  
  // Find the best 30-second segment for preview
  const getBestPreviewSegment = (trackId) => {
    const highlights = highlightSegments[trackId];
    if (!highlights || highlights.length === 0) return null;
    
    // Return the highest scored segment
    return highlights[0];
  };
  
  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th width="50px">#</Th>
            <Th>Title</Th>
            <Th width="100px" textAlign="right">
              <FaClock />
            </Th>
            <Th width="120px">Preview</Th>
            <Th width="80px">Analysis</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tracks.map((track, index) => {
            const isExpanded = expandedTrack === track.id;
            const isLoading = loadingHighlights && currentTrackId === track.id;
            const isLoadingAnalysis = loadingAnalysis[track.id];
            const analysis = trackAnalysisData[track.id];
            const recommendations = recommendedTracks[track.id];
            const previewSegment = getBestPreviewSegment(track.id);
            
            // Generate recommendation reasons using our utility
            const recommendationReasons = analysis ? 
              generateRecommendationReasons(track, analysis.features, userPreferences) : [];
            
            // Determine if this track is recommended
            const isRecommended = analysis && (
              analysis.features.energy > 0.7 || 
              analysis.features.danceability > 0.7 || 
              track.popularity > 70
            );
            
            return (
              <React.Fragment key={track.id}>
                <Tr 
                  _hover={{ bg: hoverBg }}
                  bg={isExpanded ? hoverBg : 'inherit'}
                >
                  <Td>{index + 1}</Td>
                  <Td>
                    <HStack>
                      <Text fontWeight="medium">{track.name}</Text>
                      {isRecommended && (
                        <Tooltip label="Recommended for you based on your preferences">
                          <Badge colorScheme="green" variant="solid">
                            <HStack spacing={1}>
                              <FaThumbsUp size={10} />
                              <Text fontSize="xs">Recommended</Text>
                            </HStack>
                          </Badge>
                        </Tooltip>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </Text>
                  </Td>
                  <Td isNumeric>{formatDuration(track.duration_ms)}</Td>
                  <Td>
                    {track.preview_url ? (
                      <HStack spacing={2}>
                        <Tooltip label="Play 30-second preview">
                          <IconButton
                            aria-label="Play preview"
                            icon={<FaPlay />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            isLoading={isLoading}
                            onClick={() => onPlayHighlight(track)}
                          />
                        </Tooltip>
                        {previewSegment && (
                          <Tooltip label={`Best segment: ${previewSegment.start}s - ${previewSegment.start + previewSegment.duration}s`}>
                            <Badge colorScheme="purple" variant="outline">
                              {previewSegment.start}s
                            </Badge>
                          </Tooltip>
                        )}
                      </HStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">No preview</Text>
                    )}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label={isExpanded ? "Hide analysis" : "Show analysis"}
                      icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTrackExpansion(track.id)}
                      isLoading={isLoadingAnalysis}
                    />
                  </Td>
                </Tr>
                
                {/* Expanded analysis section */}
                <Tr>
                  <Td colSpan={5} p={0}>
                    <Collapse in={isExpanded} animateOpacity>
                      <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')}>
                        {isLoadingAnalysis ? (
                          <Flex justify="center" align="center" py={4}>
                            <Spinner size="md" color={accentColor} mr={3} />
                            <Text>Analyzing track...</Text>
                          </Flex>
                        ) : analysis ? (
                          <TrackAnalysis 
                            track={track} 
                            audioFeatures={analysis.features} 
                            recommendations={recommendationReasons}
                          />
                        ) : (
                          <Text>Analysis not available for this track.</Text>
                        )}
                      </Box>
                    </Collapse>
                  </Td>
                </Tr>
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default EnhancedTrackList; 