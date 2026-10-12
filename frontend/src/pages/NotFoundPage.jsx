import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, BookOpen } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="app-container main-content" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
        <AlertTriangle size={56} color="var(--warning)" style={{ margin: '0 auto 1.25rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The requested resource, course, or route could not be found or has been moved.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-primary">
            <Home size={16} /> Home
          </Link>
          <Link to="/courses" className="btn btn-secondary">
            <BookOpen size={16} /> Courses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
