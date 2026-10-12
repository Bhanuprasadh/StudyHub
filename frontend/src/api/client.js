import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to automatically inject Authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studyhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected calls, clear stale auth state
      if (localStorage.getItem('studyhub_token')) {
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
