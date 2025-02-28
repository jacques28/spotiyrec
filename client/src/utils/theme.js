/**
 * Utility functions for handling theme and color operations
 */
import { extendTheme } from '@chakra-ui/react';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage';

// Default theme colors
export const themeColors = {
  light: {
    primary: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff',
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
    secondary: {
      50: '#f2f2f2',
      100: '#d9d9d9',
      200: '#bfbfbf',
      300: '#a6a6a6',
      400: '#8c8c8c',
      500: '#737373',
      600: '#595959',
      700: '#404040',
      800: '#262626',
      900: '#0d0d0d',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#e0e0e0',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4d4d4d',
      tertiary: '#737373',
    },
  },
  dark: {
    primary: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80caff',
      300: '#4db3ff',
      400: '#1a9dff',
      500: '#0080ff',
      600: '#0066cc',
      700: '#004d99',
      800: '#003366',
      900: '#001a33',
    },
    secondary: {
      50: '#f2f2f2',
      100: '#d9d9d9',
      200: '#bfbfbf',
      300: '#a6a6a6',
      400: '#8c8c8c',
      500: '#737373',
      600: '#595959',
      700: '#404040',
      800: '#262626',
      900: '#0d0d0d',
    },
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      tertiary: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      tertiary: '#808080',
    },
  },
};

// Default theme config
const defaultThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Custom component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorMode === 'dark' ? 'primary.500' : 'primary.500',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'primary.400' : 'primary.600',
        },
      }),
      outline: (props) => ({
        borderColor: props.colorMode === 'dark' ? 'primary.500' : 'primary.500',
        color: props.colorMode === 'dark' ? 'primary.500' : 'primary.500',
        _hover: {
          bg: props.colorMode === 'dark' ? 'rgba(0, 128, 255, 0.1)' : 'rgba(0, 128, 255, 0.1)',
        },
      }),
      ghost: (props) => ({
        color: props.colorMode === 'dark' ? 'primary.500' : 'primary.500',
        _hover: {
          bg: props.colorMode === 'dark' ? 'rgba(0, 128, 255, 0.1)' : 'rgba(0, 128, 255, 0.1)',
        },
      }),
    },
  },
  Card: {
    baseStyle: (props) => ({
      container: {
        bg: props.colorMode === 'dark' ? 'background.secondary' : 'white',
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
      },
    }),
  },
  Heading: {
    baseStyle: (props) => ({
      color: props.colorMode === 'dark' ? 'text.primary' : 'text.primary',
    }),
  },
  Text: {
    baseStyle: (props) => ({
      color: props.colorMode === 'dark' ? 'text.secondary' : 'text.secondary',
    }),
  },
};

// Create the base theme
export const baseTheme = extendTheme({
  config: defaultThemeConfig,
  colors: {
    primary: themeColors.dark.primary,
    secondary: themeColors.dark.secondary,
    background: themeColors.dark.background,
    text: themeColors.dark.text,
  },
  components,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'background.primary' : 'background.primary',
        color: props.colorMode === 'dark' ? 'text.primary' : 'text.primary',
      },
    }),
  },
});

/**
 * Get the current theme mode
 * @returns {string} 'light' or 'dark'
 */
export const getThemeMode = () => {
  return getStorageItem(STORAGE_KEYS.THEME, 'dark');
};

/**
 * Set the theme mode
 * @param {string} mode - 'light' or 'dark'
 */
export const setThemeMode = (mode) => {
  if (mode !== 'light' && mode !== 'dark') {
    console.error('Invalid theme mode. Use "light" or "dark".');
    return;
  }
  
  setStorageItem(STORAGE_KEYS.THEME, mode);
};

/**
 * Generate a theme based on album colors
 * @param {Array} colors - RGB color values
 * @returns {Object} Theme object
 */
export const generateAlbumTheme = (colors) => {
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    return baseTheme;
  }
  
  // Extract primary and secondary colors
  const primaryColor = colors[0] || [0, 128, 255]; // Default blue if no color
  const secondaryColor = colors[1] || [128, 128, 128]; // Default gray if no secondary color
  
  // Generate color shades
  const primaryShades = generateColorShades(primaryColor);
  const secondaryShades = generateColorShades(secondaryColor);
  
  // Determine if colors are dark
  const isPrimaryDark = isColorDark(primaryColor);
  const mode = isPrimaryDark ? 'dark' : 'light';
  
  // Create background and text colors based on primary color darkness
  const background = {
    primary: isPrimaryDark ? darken(primaryColor, 0.8) : lighten(primaryColor, 0.9),
    secondary: isPrimaryDark ? darken(primaryColor, 0.7) : lighten(primaryColor, 0.8),
    tertiary: isPrimaryDark ? darken(primaryColor, 0.6) : lighten(primaryColor, 0.7),
  };
  
  const text = {
    primary: isPrimaryDark ? lighten(secondaryColor, 0.9) : darken(secondaryColor, 0.8),
    secondary: isPrimaryDark ? lighten(secondaryColor, 0.7) : darken(secondaryColor, 0.6),
    tertiary: isPrimaryDark ? lighten(secondaryColor, 0.5) : darken(secondaryColor, 0.4),
  };
  
  // Create custom theme
  return extendTheme({
    config: defaultThemeConfig,
    colors: {
      primary: primaryShades,
      secondary: secondaryShades,
      background,
      text,
    },
    components,
    styles: {
      global: {
        body: {
          bg: background.primary,
          color: text.primary,
        },
      },
    },
  });
};

/**
 * Generate color shades from a base RGB color
 * @param {Array} rgb - RGB color values [r, g, b]
 * @returns {Object} Object with color shades from 50 to 900
 */
const generateColorShades = (rgb) => {
  const [r, g, b] = rgb;
  
  return {
    50: rgbToHex(...lighten([r, g, b], 0.9)),
    100: rgbToHex(...lighten([r, g, b], 0.8)),
    200: rgbToHex(...lighten([r, g, b], 0.6)),
    300: rgbToHex(...lighten([r, g, b], 0.4)),
    400: rgbToHex(...lighten([r, g, b], 0.2)),
    500: rgbToHex(r, g, b),
    600: rgbToHex(...darken([r, g, b], 0.2)),
    700: rgbToHex(...darken([r, g, b], 0.4)),
    800: rgbToHex(...darken([r, g, b], 0.6)),
    900: rgbToHex(...darken([r, g, b], 0.8)),
  };
};

/**
 * Convert RGB color to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color code
 */
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

/**
 * Lighten a color by a certain amount
 * @param {Array} rgb - RGB color values [r, g, b]
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {Array} Lightened RGB color
 */
const lighten = (rgb, amount) => {
  return rgb.map(c => Math.min(255, c + (255 - c) * amount));
};

/**
 * Darken a color by a certain amount
 * @param {Array} rgb - RGB color values [r, g, b]
 * @param {number} amount - Amount to darken (0-1)
 * @returns {Array} Darkened RGB color
 */
const darken = (rgb, amount) => {
  return rgb.map(c => Math.max(0, c * (1 - amount)));
};

/**
 * Check if a color is dark
 * @param {Array} rgb - RGB color values [r, g, b]
 * @returns {boolean} True if color is dark
 */
const isColorDark = (rgb) => {
  const [r, g, b] = rgb;
  // Calculate perceived brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness < 0.5;
};

/**
 * Get contrasting text color (black or white) for a background color
 * @param {Array} rgb - RGB color values [r, g, b]
 * @returns {string} '#ffffff' or '#000000'
 */
export const getContrastColor = (rgb) => {
  return isColorDark(rgb) ? '#ffffff' : '#000000';
};

/**
 * Extract dominant colors from an image
 * @param {string} imageUrl - URL of the image
 * @param {number} colorCount - Number of colors to extract
 * @returns {Promise<Array>} Promise resolving to array of RGB colors
 */
export const extractColorsFromImage = (imageUrl, colorCount = 3) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      resolve([[0, 128, 255], [128, 128, 128]]); // Default colors
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to a reasonable sampling size
        canvas.width = 50;
        canvas.height = 50;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Simple color extraction - collect all pixels and find most common
        const colorMap = {};
        
        // Sample pixels (every 4th pixel to improve performance)
        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          
          // Skip transparent pixels
          if (imageData[i + 3] < 128) continue;
          
          // Simplify colors to reduce variations (divide by 8 to get 32 levels per channel)
          const key = `${Math.floor(r/8)},${Math.floor(g/8)},${Math.floor(b/8)}`;
          
          if (!colorMap[key]) {
            colorMap[key] = {
              count: 0,
              r: r,
              g: g,
              b: b
            };
          }
          
          colorMap[key].count++;
        }
        
        // Convert to array and sort by count
        const colors = Object.values(colorMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, colorCount)
          .map(color => [color.r, color.g, color.b]);
        
        resolve(colors);
      } catch (error) {
        console.error('Error extracting colors:', error);
        resolve([[0, 128, 255], [128, 128, 128]]); // Default colors on error
      }
    };
    
    img.onerror = () => {
      console.error('Error loading image for color extraction');
      resolve([[0, 128, 255], [128, 128, 128]]); // Default colors on error
    };
    
    img.src = imageUrl;
  });
}; 