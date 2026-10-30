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

// Response interceptor to handle session expiration cleanly and refresh JWT
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/forgot-password');

    if (error.response && error.response.status === 401 && !isAuthRoute && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('studyhub_refresh_token');

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = res.data;
          localStorage.setItem('studyhub_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('studyhub_refresh_token', newRefreshToken);
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          processQueue(null, access_token);
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('studyhub_token');
          localStorage.removeItem('studyhub_refresh_token');
          localStorage.removeItem('studyhub_user');
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
