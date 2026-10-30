/**
 * AuthContext — Production-grade authentication state management
 *
 * Token strategy:
 * - Access token and refresh token safely preserved
 * - On page reload: checks stored session and verifies silently with /auth/refresh
 * - Supports forgot password and reset password flows
 * - Seamless session persistence across browser reloads
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient, { setAccessToken, clearAccessToken, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('studyhub_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('studyhub_token');
      const storedRefreshToken = localStorage.getItem('studyhub_refresh_token');

      if (storedToken) {
        setAccessToken(storedToken);
      }

      if (storedRefreshToken || storedToken) {
        try {
          const { data } = await apiClient.post(
            '/auth/refresh',
            storedRefreshToken ? { refresh_token: storedRefreshToken } : {}
          );
          setAccessToken(data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('studyhub_refresh_token', data.refresh_token);
          }
          if (data.user) {
            localStorage.setItem('studyhub_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        } catch {
          // If refresh fails and we have no valid token, clean up
          if (!storedToken) {
            clearAccessToken();
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = data;
    setAccessToken(access_token);
    if (refresh_token) {
      localStorage.setItem('studyhub_refresh_token', refresh_token);
    }
    localStorage.setItem('studyhub_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (email, password, full_name, role = 'student') => {
    const { data } = await apiClient.post('/auth/register', { email, password, full_name, role });
    const { access_token, refresh_token, user: userData } = data;
    setAccessToken(access_token);
    if (refresh_token) {
      localStorage.setItem('studyhub_refresh_token', refresh_token);
    }
    localStorage.setItem('studyhub_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  }, []);

  const resetPassword = useCallback(async (resetToken, newPassword) => {
    const res = await apiClient.post('/auth/reset-password', {
      token: resetToken,
      new_password: newPassword,
    });
    return res.data;
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('studyhub_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token: getAccessToken(),
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
