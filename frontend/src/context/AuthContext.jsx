import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studyhub_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('studyhub_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('studyhub_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('studyhub_token', access_token);
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
    const { access_token, user: userData } = res.data;
    localStorage.setItem('studyhub_token', access_token);
    localStorage.setItem('studyhub_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('studyhub_token');
    localStorage.removeItem('studyhub_user');
    setToken(null);
    setUser(null);
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
