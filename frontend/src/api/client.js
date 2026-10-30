/**
 * Axios API client — Production-grade configuration
 *
 * Security model:
 * - Access token stored in memory only (React state via AuthContext) — not localStorage
 * - Refresh token stored in HttpOnly cookie (managed by browser, inaccessible to JS)
 * - On 401: automatically attempts silent token refresh via /auth/refresh cookie endpoint
 * - On refresh failure: redirects to /login with the original URL as a return param
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// In-memory access token — not stored in localStorage or sessionStorage
let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

export const clearAccessToken = () => {
  _accessToken = null;
};

export const getAccessToken = () => _accessToken;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // Required so the HttpOnly refresh cookie is sent cross-origin
  withCredentials: true,
});

// ── Request interceptor: inject in-memory access token ──────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: silent refresh on 401 ─────────────────────────────
let _isRefreshing = false;
let _refreshQueue = []; // Queue of pending requests waiting for a new token

const processRefreshQueue = (error, newToken = null) => {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  _refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retried &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retried = true;

      if (_isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      _isRefreshing = true;
      try {
        // Cookie is sent automatically (withCredentials: true)
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.access_token;
        setAccessToken(newToken);
        processRefreshQueue(null, newToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processRefreshQueue(refreshError, null);
        clearAccessToken();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('studyhub_token');
          localStorage.removeItem('studyhub_user');
          if (window.location) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?returnUrl=${returnUrl}`;
          }
        }
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
