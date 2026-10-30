import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(email.trim().toLowerCase(), password, fullName.trim(), role);
      localStorage.setItem('studyhub_saved_email', email.trim().toLowerCase());
      if (user.role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const detail = err.response?.data?.detail || 'Registration failed. Please check your information.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' }}>
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
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Join StudyHub as a student or course instructor
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Bhanu Prasad"
              required
              autoComplete="name"
            />
          </div>

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
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password (min 6 characters)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: 0,
                }}
              >
                {showPassword ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Account Role</label>
            <select
              id="role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student (Learn, take quizzes, track progress)</option>
              <option value="instructor">Instructor (Create courses, manage quizzes)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Registering...' : <><UserPlus size={18} /> Complete Registration</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
