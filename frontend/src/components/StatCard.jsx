import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'var(--primary)' }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-md)',
          background: `rgba(79, 70, 229, 0.08)`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={26} />}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
