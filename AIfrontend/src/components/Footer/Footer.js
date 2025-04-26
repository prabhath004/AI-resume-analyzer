// src/components/Footer/Footer.js
import React, { memo } from 'react';
import { Box, Container, Typography, useTheme } from '@mui/material';

const Footer = memo(() => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Smart Resume 
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          © {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
});

Footer.displayName = 'Footer';
export default Footer;
