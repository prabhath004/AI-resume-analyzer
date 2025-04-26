import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  signup: (userData) => api.post('/api/auth/signup', userData),
};

export const resumeAPI = {
  upload: (formData) => api.post('/api/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  analyze: (resumeId, jobDescription) => api.post(`/api/resumes/${resumeId}/analyze`, { jobDescription }),
  getAll: () => api.get('/api/resumes'),
  getOne: (id) => api.get(`/api/resumes/${id}`),
};

export const jobAPI = {
  create: (jobData) => api.post('/api/jobs', jobData),
  getAll: () => api.get('/api/jobs'),
  getOne: (id) => api.get(`/api/jobs/${id}`),
};

export default api;
