// frontend/src/services/api.js - REPLACE ENTIRE FILE
import axios from 'axios';

// ✅ FIX: No trailing slash on base URL
// With trailing slash: 'http://localhost:5000/' + '/subject' = 'http://localhost:5000//subject' ← BREAKS
// Without trailing slash: 'http://localhost:5000' + '/subject' = 'http://localhost:5000/subject' ← CORRECT
const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug: log every request URL
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} →`, response.status);
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`❌ API Error: ${url} → ${status} - ${message}`);

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;