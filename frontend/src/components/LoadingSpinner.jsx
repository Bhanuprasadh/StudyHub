import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1rem',
        minHeight: '200px',
      }}
    >
      <div className="spinner" style={{ marginBottom: '1rem', width: '36px', height: '36px' }}></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;
