import React, { memo } from 'react';
import { Box, useTheme, Container } from '@mui/material';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './layout.css';

const Layout = memo(({ children }) => {
  const theme = useTheme();

  return (
    <Box 
      className="layout"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("/pattern.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />
      <Box 
        component="main" 
        className="main-content"
        sx={{
          flex: 1,
          py: { xs: 2, md: 4 },
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)',
            zIndex: 0,
          },
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            flex: 1,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
});

Layout.displayName = 'Layout';

export default Layout; 