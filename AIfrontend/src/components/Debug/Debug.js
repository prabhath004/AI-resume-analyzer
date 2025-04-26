import React, { useEffect } from 'react';

const Debug = () => {
  useEffect(() => {
    console.log('Debug component mounted');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Base URL:', window.location.origin);
    console.log('Current path:', window.location.pathname);
    console.log('Hash:', window.location.hash);
  }, []);

  return null;
};

export default Debug; 