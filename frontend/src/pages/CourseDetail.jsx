import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpen,
  CheckCircle,
  Bookmark,
  PlayCircle,
  HelpCircle,
  Users,
  Clock,
  Layers,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const res = await apiClient.get(`/courses/${id}`);
      setCourse(res.data);
      setBookmarked(res.data.is_bookmarked);

      // Fetch course quizzes
      const qRes = await apiClient.get(`/quizzes/courses/${res.data.id}`);
      setQuizzes(qRes.data);
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await apiClient.post(`/enrollments/courses/${course.id}`);
      setCourse((prev) => ({ ...prev, is_enrolled: true }));
      navigate(`/learn/${course.id}`);
    } catch (err) {
      console.error('Enrollment error:', err);
      alert(err.response?.data?.detail || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiClient.post(`/bookmarks/courses/${course.id}`);
      setBookmarked(res.data.bookmarked);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading course curriculum..." />;
  }

  if (!course) {
    return (
      <div className="app-container main-content" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Course not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="app-container main-content">
      {/* Course Header Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2.5rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <span className="badge badge-primary">{course.level}</span>
            {course.category && <span className="badge badge-neutral">{course.category.name}</span>}
            <button
              onClick={toggleBookmark}
              className={`btn btn-sm ${bookmarked ? 'btn-primary' : 'btn-secondary'}`}
              style={{ marginLeft: 'auto' }}
              title="Bookmark Course"
            >
              <Bookmark size={14} /> {bookmarked ? 'Saved' : 'Bookmark'}
            </button>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            {course.title}
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {course.short_description || course.title}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <div>Instructor: <strong style={{ color: 'var(--text-main)' }}>{course.instructor?.full_name || 'Instructor'}</strong></div>
            <div>Enrolled: <strong style={{ color: 'var(--text-main)' }}>{course.total_enrollments || 0} students</strong></div>
            <div>Lessons: <strong style={{ color: 'var(--text-main)' }}>{course.total_lessons || 0} items</strong></div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {course.is_enrolled ? (
              <Link to={`/learn/${course.id}`} className="btn btn-primary btn-lg">
                <PlayCircle size={20} /> Continue Learning
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn btn-primary btn-lg"
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course (Free)'}
              </button>
            )}

            <Link to={`/learn/${course.id}?tab=discussions`} className="btn btn-secondary btn-lg">
              <MessageSquare size={18} /> Discussion Forum
            </Link>
          </div>
        </div>

        {/* Thumbnail Preview */}
        {course.thumbnail_url && (
          <div>
            <img
              src={course.thumbnail_url}
              alt={course.title}
              style={{
                width: '100%',
                maxHeight: '260px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          </div>
        )}
      </div>

      {/* Curriculum & Quizzes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Curriculum & Learning Modules
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {course.modules?.map((module, mIdx) => (
              <div key={module.id} className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  {module.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {module.lessons?.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={16} color="var(--text-secondary)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {lesson.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lesson.duration_minutes} mins
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Quizzes & Assessments */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Assessments & Quizzes
          </h2>

          <div className="card">
            {quizzes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No assessments configured for this course yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '1rem',
                    }}
                  >
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {q.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {q.description || 'Test your understanding of the curriculum.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Passing: {q.passing_score}% • {q.time_limit_minutes}m limit
                      </span>
                      {course.is_enrolled ? (
                        <Link to={`/quiz/${q.id}`} className="btn btn-primary btn-sm">
                          Take Quiz
                        </Link>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Enroll to take
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
