import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Shield,
  User as UserIcon,
  LogOut,
  Bell,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationsRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Handle outside click for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" style={{ position: 'relative' }}>
      <div className="app-container navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <GraduationCap size={28} />
          <span>StudyHub</span>
          <span className="navbar-brand-badge">Academic</span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ul className="navbar-links">
            <li>
              <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
                <BookOpen size={16} /> Course Catalog
              </Link>
            </li>

            {isAuthenticated && (
              <li>
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  <LayoutDashboard size={16} /> Student Dashboard
                </Link>
              </li>
            )}

            {isInstructor && (
              <li>
                <Link
                  to="/instructor"
                  className={`nav-link ${isActive('/instructor') ? 'active' : ''}`}
                >
                  <PlusCircle size={16} /> Instructor Studio
                </Link>
              </li>
            )}

            {isAdmin && (
              <li>
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  <Shield size={16} /> Admin Portal
                </Link>
              </li>
            )}
          </ul>

          {/* Right Action Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div style={{ position: 'relative' }} ref={notificationsRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="btn btn-secondary btn-sm"
                    style={{ position: 'relative', padding: '0.5rem' }}
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'var(--danger)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationsOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '40px',
                        width: '320px',
                        background: '#fff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-xl)',
                        zIndex: 60,
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '0.5rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              style={{
                                padding: '0.5rem',
                                borderBottom: '1px solid #f1f5f9',
                                background: n.is_read ? 'transparent' : 'var(--primary-light)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{n.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile link */}
                <Link
                  to="/profile"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <UserIcon size={16} />
                  <span>{user?.full_name?.split(' ')[0] || 'Profile'}</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </span>
                </Link>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm mobile-nav-toggle"
              id="mobile-nav-toggle"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <ul className="mobile-drawer-links">
            <li>
              <Link
                to="/courses"
                className={isActive('/courses') ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen size={18} /> Course Catalog
              </Link>
            </li>

            {isAuthenticated && (
              <li>
                <Link
                  to="/dashboard"
                  className={isActive('/dashboard') ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} /> Student Dashboard
                </Link>
              </li>
            )}

            {isInstructor && (
              <li>
                <Link
                  to="/instructor"
                  className={isActive('/instructor') ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle size={18} /> Instructor Studio
                </Link>
              </li>
            )}

            {isAdmin && (
              <li>
                <Link
                  to="/admin"
                  className={isActive('/admin') ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield size={18} /> Admin Portal
                </Link>
              </li>
            )}

            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/profile"
                    className={isActive('/profile') ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserIcon size={18} /> Profile ({user?.role})
                  </Link>
                </li>
                <li style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)' }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </li>
              </>
            ) : (
              <li style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Link
                  to="/login"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
