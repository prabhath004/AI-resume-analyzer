import axios from 'axios';

// Change this to your real backend URL (set via .env or default)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const AI_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

const aiApi = axios.create({
  baseURL: AI_URL,
});

// Attach JWT automatically to main API
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Attach JWT to AI API if needed
aiApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api, aiApi };
