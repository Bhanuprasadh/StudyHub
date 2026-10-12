import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, BookOpen, Filter, ArrowRight, Layers } from 'lucide-react';

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

  return (
    <div className="app-container main-content">
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Course Catalog</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Explore academic learning paths, verify your knowledge with quizzes, and earn course completion.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by course title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Level Filter */}
        <div style={{ minWidth: '160px' }}>
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

        {/* Category Filter */}
        <div style={{ minWidth: '200px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <LoadingSpinner text="Searching course catalog..." />
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No courses match your filter
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Try resetting your search query or selecting a different category.
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
        <div className="grid-3">
          {courses.map((course) => (
            <div key={course.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
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
                <span className="badge badge-primary">{course.level}</span>
                {course.category && (
                  <span className="badge badge-neutral">{course.category.name}</span>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Link to={`/courses/${course.slug || course.id}`} style={{ color: 'var(--text-main)' }}>
                  {course.title}
                </Link>
              </h3>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem',
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                {course.short_description || 'Detailed full-stack curriculum with lessons and quizzes.'}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.85rem',
                  marginTop: 'auto',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {course.total_lessons || 0} Lessons • {course.total_enrollments || 0} Students
                </div>
                <Link to={`/courses/${course.slug || course.id}`} className="btn btn-primary btn-sm">
                  View Course <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
