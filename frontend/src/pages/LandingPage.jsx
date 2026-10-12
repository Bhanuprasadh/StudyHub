import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Users,
  ShieldCheck,
  Award,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

const LandingPage = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, catsRes] = await Promise.all([
          apiClient.get('/courses?limit=3'),
          apiClient.get('/categories'),
        ]);
        setFeaturedCourses(coursesRes.data);
        setCategories(catsRes.data);
      } catch (err) {
        console.error('Failed to load landing page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)',
          padding: '5rem 0 4rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="app-container" style={{ textAlign: 'center', maxWidth: '880px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={16} /> M.Tech Academic Full-Stack Web Engineering Project
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--text-main)',
              marginBottom: '1.25rem',
            }}
          >
            Centralized Learning & Academic Collaboration Platform
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            StudyHub delivers a production-grade educational architecture featuring FastAPI backend REST services,
            normalized PostgreSQL storage, role-based authorization, and modern React components.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '3rem',
            }}
          >
            <Link to="/courses" className="btn btn-primary btn-lg">
              <BookOpen size={18} /> Browse Course Catalog
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In to Dashboard <ArrowRight size={18} />
            </Link>
          </div>

          {/* Quick Demo Credentials for Viva Evaluation */}
          <div
            className="card"
            style={{
              background: '#ffffff',
              border: '1px dashed var(--primary)',
              padding: '1.25rem',
              textAlign: 'left',
              display: 'inline-block',
              width: '100%',
              maxWidth: '720px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Academic Evaluation Credentials (Instant Sign-In):
              </strong>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Student:</strong> <code>student@studyhub.edu</code> / <code>Student@123</code>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Instructor:</strong> <code>instructor@studyhub.edu</code> / <code>Instructor@123</code>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Admin:</strong> <code>admin@studyhub.edu</code> / <code>Admin@123</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section style={{ padding: '4rem 0' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Built with Genuine Full-Stack Engineering
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Architected for clean separation of concerns, scalability, and robust security
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                FastAPI & OpenAPI REST
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                High-performance Python asynchronous endpoints with Pydantic type validation, structured error handlers, and interactive Swagger UI.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Database size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                PostgreSQL & Alembic
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Normalized 3NF relational schema with foreign key cascades, unique constraints, indexing, and migration version tracking.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--secondary-light)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Role-Based Access Control
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Strict backend enforcement ensuring Students, Instructors, and Administrators only access authorized operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Catalog Preview */}
      <section style={{ padding: '3rem 0 5rem', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
        <div className="app-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Explore Featured Courses</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Verified curriculum with structured modules, downloadable resources, and quizzes.
              </p>
            </div>
            <Link to="/courses" className="btn btn-outline btn-sm">
              View All Courses <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid-3">
            {featuredCourses.map((c) => (
              <div key={c.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                {c.thumbnail_url && (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                    }}
                  />
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{c.level}</span>
                  {c.category && <span className="badge badge-neutral">{c.category.name}</span>}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', flex: 1 }}>
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    lineHeight: 1.4,
                  }}
                >
                  {c.short_description || c.title}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                    marginTop: 'auto',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.total_lessons || 0} Lessons
                  </span>
                  <Link to={`/courses/${c.slug || c.id}`} className="btn btn-primary btn-sm">
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
