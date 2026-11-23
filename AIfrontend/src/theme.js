import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#234E70',
      light: '#5B7F9D',
      dark: '#17364F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#287A72',
      light: '#5A9D96',
      dark: '#1D5A54',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F3F6F8',
      paper: '#ffffff',
    },
    text: {
      primary: '#172B3A',
      secondary: '#5B6B78',
    },
    divider: '#D8E1E8',
    success: {
      main: '#2E7458',
    },
    warning: {
      main: '#A56A24',
    },
    error: {
      main: '#B34B4B',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 650,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(35, 78, 112, 0.18)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(35, 78, 112, 0.24)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 6px 20px rgba(23, 54, 79, 0.07)',
        },
      },
    },
  },
});

export default theme;
