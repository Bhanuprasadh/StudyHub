import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, AlertCircle, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="app-container main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Sign in to StudyHub</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Access courses, manage studies, or view platform analytics
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@studyhub.edu"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={14} color="var(--primary)" /> Demo Viva Accounts (Click to Fill):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('student@studyhub.edu', 'Student@123')}
            >
              Student
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('instructor@studyhub.edu', 'Instructor@123')}
            >
              Instructor
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('admin@studyhub.edu', 'Admin@123')}
            >
              Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register as a Student or Instructor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
