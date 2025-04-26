// src/pages/Signup/Signup.js

import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import './signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate fields
  const validateForm = () => {
    const errs = {};
    if (!formData.firstName.trim())  errs.firstName      = 'First name is required';
    if (!formData.lastName.trim())   errs.lastName       = 'Last name is required';
    if (!formData.email.trim())      errs.email          = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email is invalid';
    if (!formData.password)          errs.password       = 'Password is required';
    else if (formData.password.length < 8)
                                      errs.password       = 'Password must be ≥ 8 characters';
    if (!formData.confirmPassword)   errs.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
                                      errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const copy = { ...prev }; delete copy[name]; return copy; });
    }
  };

  // Submit form
  const handleSubmit = async e => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data } = await api.post('/api/auth/signup', {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email.trim(),
        password:  formData.password
      });

      if (data.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setApiError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center">
          Create Account
        </Typography>

        {apiError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            name="firstName"
            label="First Name"
            fullWidth
            required
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
          />
          <TextField
            name="lastName"
            label="Last Name"
            fullWidth
            required
            sx={{ mt: 2 }}
            value={formData.lastName}
            onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
          />
          <TextField
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            required
            sx={{ mt: 2 }}
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            fullWidth
            required
            sx={{ mt: 2 }}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
          />
          <TextField
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            fullWidth
            required
            sx={{ mt: 2 }}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </Button>

          <Typography align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
