import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search,
  BookOpen,
  Filter,
  ArrowRight,
  Layers,
  Database,
  Palette,
  Cloud,
  Shield,
  Compass,
  Star,
  CheckCircle2,
  Award,
  Clock,
  Users,
  X,
  Sparkles,
} from 'lucide-react';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, selectedCategory, selectedLevel]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedLevel) params.level = selectedLevel;

      const res = await apiClient.get('/courses', { params });
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (slug) => {
    if (slug?.includes('ai') || slug?.includes('research')) return <Sparkles size={15} />;
    if (slug?.includes('database')) return <Database size={15} />;
    if (slug?.includes('ui-ux')) return <Palette size={15} />;
    if (slug?.includes('cloud') || slug?.includes('devops')) return <Cloud size={15} />;
    if (slug?.includes('security') || slug?.includes('system')) return <Shield size={15} />;
    return <Layers size={15} />;
  };


  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return { label: 'Beginner', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'advanced':
        return { label: 'Advanced', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
      default:
        return { label: 'Intermediate', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
  };

  return (
    <div className="app-container main-content">
      {/* Hero Banner Section */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 35px -10px rgba(30, 27, 75, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#93c5fd',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={14} color="#93c5fd" /> Accredited M.Tech Curriculum
          </div>

          <h1
            style={{
              fontSize: '2.35rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '0.75rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Explore Professional Engineering Courses
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: '#cbd5e1',
              marginBottom: '1.75rem',
            }}
          >
            Academic courses built with production-grade engineering principles. Every curriculum features Section 0 interactive roadmaps, official documentation matrices, real architecture code, and server-graded certification assessments.
          </p>

          {/* Quick Metrics Strip */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '1.25rem',
              fontSize: '0.85rem',
              color: '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#34d399" /> <span>5 Accredited Disciplines</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={16} color="#60a5fa" /> <span>Section 0 Visual Roadmaps</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} color="#c084fc" /> <span>Official Docs Matrix</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} color="#fbbf24" /> <span>Automated Certification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            background: selectedCategory === '' ? 'var(--primary)' : 'var(--bg-card)',
            color: selectedCategory === '' ? '#ffffff' : 'var(--text-secondary)',
            border: selectedCategory === '' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            boxShadow: selectedCategory === '' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'var(--shadow-xs)',
          }}
        >
          <Layers size={15} /> All Disciplines
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === String(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? '' : String(cat.id))}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'var(--shadow-xs)',
              }}
            >
              {getCategoryIcon(cat.slug)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search courses by title, topic, or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingRight: searchQuery ? '2.5rem' : '0.85rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Level Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            className="form-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {(selectedCategory || selectedLevel || searchQuery) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedCategory('');
              setSelectedLevel('');
              setSearchQuery('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <X size={14} /> Reset Filters
          </button>
        )}
      </div>

      {/* Course Grid Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Available Curriculums {courses.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>({courses.length})</span>}
        </h2>
      </div>

      {/* Course Grid */}
      {loading ? (
        <LoadingSpinner text="Searching course catalog..." />
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No courses match your filter
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Try resetting your search query or selecting a different engineering category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedLevel('');
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '1.75rem' }}>
          {courses.map((course) => {
            const diff = getDifficultyBadge(course.level);
            return (
              <div
                key={course.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* Course Thumbnail with Overlay Badges */}
                <div style={{ position: 'relative', width: '100%', height: '190px', background: '#0f172a' }}>
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                      }}
                    >
                      <BookOpen size={40} />
                    </div>
                  )}

                  {/* Gradient overlay for readability */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, transparent 60%)',
                    }}
                  />

                  {/* Badges on image */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      right: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {course.category && (
                      <span
                        style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#f8fafc',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {getCategoryIcon(course.category.slug)}
                        {course.category.name}
                      </span>
                    )}

                    <span
                      style={{
                        background: diff.bg,
                        color: diff.color,
                        border: `1px solid ${diff.border}`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {diff.label}
                    </span>
                  </div>

                  {/* Bottom Image Stats (Rating & Price) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '12px',
                      right: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#fef08a',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      <Star size={13} fill="#facc15" color="#facc15" /> 4.9
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>(120+ reviews)</span>
                    </div>

                    {course.price > 0 ? (
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}
                      >
                        Premium ₹{course.price}
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        Free Track
                      </span>
                    )}
                  </div>
                </div>


                {/* Course Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.65rem' }}>
                    <Link
                      to={`/courses/${course.slug || course.id}`}
                      style={{ color: 'var(--text-main)', transition: 'color 0.15s ease' }}
                    >
                      {course.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.short_description || 'Detailed full-stack curriculum with lessons and quizzes.'}
                  </p>

                  {/* Highlights Pill Strip */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    <span
                      style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        color: '#0284c7',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Compass size={12} /> Section 0 Roadmap
                    </span>
                    <span
                      style={{
                        background: 'rgba(79, 70, 229, 0.08)',
                        color: 'var(--primary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <BookOpen size={12} /> Official Docs
                    </span>
                  </div>

                  {/* Instructor metadata */}
                  {course.instructor && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginBottom: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <img
                        src={course.instructor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                        alt={course.instructor.full_name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Instructor: <strong style={{ color: 'var(--text-main)' }}>{course.instructor.full_name}</strong>
                      </div>
                    </div>
                  )}

                  {/* Card Footer with CTA */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <strong>{course.total_lessons || 0} Lessons</strong> • {course.total_enrollments || 0} Students
                    </div>
                    <Link
                      to={`/courses/${course.slug || course.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Explore Syllabus <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
