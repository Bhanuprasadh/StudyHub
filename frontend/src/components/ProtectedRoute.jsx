import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Admin always has access to all routes
    const hasRole = allowedRoles.includes(user?.role) || user?.role === 'admin';
    if (!hasRole) {
      return (
        <div className="app-container main-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>
              Access Forbidden (403)
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your account role (<strong>{user?.role}</strong>) does not have authorization to view this resource.
            </p>
            <a href="/" className="btn btn-primary">
              Return to Home
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
