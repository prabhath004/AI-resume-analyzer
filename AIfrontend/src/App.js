// src/App.js
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Debug from './components/Debug/Debug';

// Add error logging for production
const logError = (componentName, error) => {
  console.error(`Error loading ${componentName} component:`, error);
  if (process.env.NODE_ENV === 'production') {
    // You can add error reporting service here
    console.error('Production error:', error);
  }
};

// Lazy load components with enhanced error handling
const Home = lazy(() => import('./pages/Home/Home').catch(err => {
  logError('Home', err);
  return { default: () => <div>Error loading Home page</div> };
}));
const Login = lazy(() => import('./pages/Login/Login').catch(err => {
  logError('Login', err);
  return { default: () => <div>Error loading Login page</div> };
}));
const Signup = lazy(() => import('./pages/Signup/Signup').catch(err => {
  logError('Signup', err);
  return { default: () => <div>Error loading Signup page</div> };
}));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').catch(err => {
  logError('Dashboard', err);
  return { default: () => <div>Error loading Dashboard page</div> };
}));
const Upload = lazy(() => import('./pages/Upload/Upload').catch(err => {
  logError('Upload', err);
  return { default: () => <div>Error loading Upload page</div> };
}));

function App() {
  useEffect(() => {
    // Log environment and base URL for debugging
    console.log('App component mounted');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Base URL:', window.location.origin);
    console.log('Current path:', window.location.pathname);
    console.log('Hash:', window.location.hash);
  }, []);

  return (
    <ErrorBoundary>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Router>
              <Debug />
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        <PrivateRoute>
                          <Upload />
                        </PrivateRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}

export default App;