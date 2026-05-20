import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Named authAPI object (used by components) ─────────────
export const authAPI = {
  login:          (data)         => api.post('/auth/login', data),
  register:       (data)         => api.post('/auth/register', data),
  getMe:          ()             => api.get('/auth/me'),
  changePassword: (data)         => api.put('/auth/password', data),
  getAllUsers:     (params = {}) => api.get('/auth/users', { params }),
  updateUser:     (id, data)     => api.put(`/auth/users/${id}`, data),
  deleteUser:     (id)           => api.delete(`/auth/users/${id}`),
};

export default api;