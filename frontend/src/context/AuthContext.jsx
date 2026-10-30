import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('studyhub_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('studyhub_token') || null);
  const [loading, setLoading] = useState(false);

  // Revalidate auth state in background without jarring logout on transient network glitch
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('studyhub_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('studyhub_user', JSON.stringify(res.data));
        } catch (err) {
          // Only clear session if token is explicitly rejected as unauthorized (401)
          if (err.response && err.response.status === 401) {
            console.warn('Session expired or unauthorized token:', err);
            logout();
          } else {
            console.warn('Could not revalidate user via /auth/me (backend may be reloading); keeping local session:', err);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('studyhub_token', access_token);
    if (refresh_token) {
      localStorage.setItem('studyhub_refresh_token', refresh_token);
    }
    localStorage.setItem('studyhub_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name, role = 'student') => {
    const res = await apiClient.post('/auth/register', {
      email,
      password,
      full_name,
      role,
    });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('studyhub_token', access_token);
    if (refresh_token) {
      localStorage.setItem('studyhub_refresh_token', refresh_token);
    }
    localStorage.setItem('studyhub_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_refresh_token');
    localStorage.removeItem('studyhub_user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (resetToken, newPassword) => {
    const res = await apiClient.post('/auth/reset-password', {
      token: resetToken,
      new_password: newPassword,
    });
    return res.data;
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('studyhub_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
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
