import React from 'react';
import { GraduationCap, Code2, Server, Database } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="app-container">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <GraduationCap size={22} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>StudyHub</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              A centralized academic learning and collaboration web platform designed for M.Tech Full-Stack Web Engineering.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Technology Stack
              </h5>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-neutral"><Code2 size={12} /> React 18</span>
                <span className="badge badge-neutral"><Server size={12} /> FastAPI</span>
                <span className="badge badge-neutral"><Database size={12} /> PostgreSQL</span>
                <span className="badge badge-neutral">SQLAlchemy & Alembic</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            marginTop: '2rem',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>© {new Date().getFullYear()} StudyHub Academic Systems. All rights reserved.</div>
          <div>M.Tech Full-Stack Web Engineering Project</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
