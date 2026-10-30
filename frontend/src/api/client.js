/**
 * Axios API client — Production-grade configuration
 *
 * Security model:
 * - Access token supported both in-memory and in localStorage
 * - Refresh token supported via payload and HttpOnly cookie
 * - On 401: automatically attempts silent token refresh with request queueing
 * - On refresh failure: redirects to /login with returnUrl
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
  if (token) {
    localStorage.setItem('studyhub_token', token);
  }
};

export const clearAccessToken = () => {
  _accessToken = null;
  localStorage.removeItem('studyhub_token');
  localStorage.removeItem('studyhub_refresh_token');
  localStorage.removeItem('studyhub_user');
};

export const getAccessToken = () => _accessToken || localStorage.getItem('studyhub_token');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: silent refresh on 401 ──────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
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

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
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

      const storedRefreshToken = localStorage.getItem('studyhub_refresh_token');

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          storedRefreshToken ? { refresh_token: storedRefreshToken } : {},
          { withCredentials: true }
        );

        const newToken = data.access_token;
        setAccessToken(newToken);
        if (data.refresh_token) {
          localStorage.setItem('studyhub_refresh_token', data.refresh_token);
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        if (typeof window !== 'undefined' && window.location) {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          if (!window.location.pathname.includes('/login')) {
            window.location.href = `/login?returnUrl=${returnUrl}`;
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
