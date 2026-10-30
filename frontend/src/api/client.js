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
    // Only clear token if an authenticated protected endpoint failed with 401
    // (do NOT clear on login attempt failures)
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      if (localStorage.getItem('studyhub_token')) {
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
