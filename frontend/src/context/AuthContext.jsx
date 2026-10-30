/**
 * AuthContext — Production-grade authentication state management
 *
 * Token strategy:
 * - Access token: in-memory only (not persisted), short-lived (15 min)
 * - Refresh token: HttpOnly cookie (set by server, never accessible to JS)
 * - On page reload: silent refresh via /auth/refresh (cookie auto-sent)
 * - Logout: calls server to revoke refresh token, then clears in-memory state
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient, { setAccessToken, clearAccessToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying session on mount

  /**
   * Attempt a silent token refresh on page load.
   * If the HttpOnly refresh cookie is still valid, we get a new access token
   * and restore the session without any user-visible action.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await apiClient.post('/auth/refresh', {});
        setAccessToken(data.access_token);
        setUser(data.user);
      } catch {
        // No valid refresh cookie — user is logged out, which is fine
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, full_name, role = 'student') => {
    const { data } = await apiClient.post('/auth/register', { email, password, full_name, role });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Revoke refresh token server-side (clears HttpOnly cookie too)
      await apiClient.post('/auth/logout');
    } catch {
      // Even if the call fails, clear client state
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
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
