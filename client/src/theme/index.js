import { extendTheme } from '@chakra-ui/react';

// Color mode config
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
};

// Custom colors
const colors = {
  brand: {
    50: '#e6fffa',
    100: '#b2f5ea',
    200: '#81e6d9',
    300: '#4fd1c5',
    400: '#38b2ac',
    500: '#319795', // Primary brand color
    600: '#2c7a7b',
    700: '#285e61',
    800: '#234e52',
    900: '#1d4044',
  },
  spotify: {
    green: '#1DB954',
    black: '#191414',
    white: '#FFFFFF',
    gray: '#535353',
    lightGray: '#B3B3B3',
  },
};

// Component style overrides
const components = {
  Button: {
    variants: {
      spotify: {
        bg: 'spotify.green',
        color: 'white',
        _hover: {
          bg: 'green.400',
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        _active: {
          bg: 'green.600',
          transform: 'translateY(0)',
          boxShadow: 'none',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        _hover: {
          transform: 'translateY(-4px)',
          boxShadow: 'xl',
        },
      },
    },
  },
};

// Fonts
const fonts = {
  heading: "'Circular Std', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  body: "'Circular Std', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

// Breakpoints for responsive design
const breakpoints = {
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
};

// Create the theme
const theme = extendTheme({
  config,
  colors,
  components,
  fonts,
  breakpoints,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
});

export default theme; 