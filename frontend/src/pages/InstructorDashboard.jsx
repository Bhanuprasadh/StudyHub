import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpen,
  Users,
  PlusCircle,
  Edit,
  Trash2,
  FileQuestion,
  ExternalLink,
} from 'lucide-react';

const InstructorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      const res = await apiClient.get('/users/instructor/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load instructor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course and all its modules/lessons?')) return;
    try {
      await apiClient.delete(`/courses/${courseId}`);
      setData((prev) => ({
        ...prev,
        courses: prev.courses.filter((c) => c.id !== courseId),
        stats: {
          ...prev.stats,
          total_courses: prev.stats.total_courses - 1,
        },
      }));
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.response?.data?.detail || 'Failed to delete course');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading instructor studio..." />;
  }

  const { stats, courses } = data || {
    stats: { total_courses: 0, total_students_enrolled: 0 },
    courses: [],
  };

  return (
    <div className="app-container main-content">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Instructor Studio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
            Design course curriculum, organize learning resources, and monitor student enrollments.
          </p>
        </div>

        <Link to="/instructor/courses/new" className="btn btn-primary">
          <PlusCircle size={18} /> Create New Course
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        <StatCard
          icon={BookOpen}
          title="Courses Authored"
          value={stats.total_courses}
          subtitle="Curriculum published"
          color="var(--primary)"
        />
        <StatCard
          icon={Users}
          title="Total Student Enrollments"
          value={stats.total_students_enrolled}
          subtitle="Across all your courses"
          color="var(--secondary)"
        />
      </div>

      {/* Authored Courses Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Your Managed Courses
        </h2>

        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You haven't authored any courses yet.
            </p>
            <Link to="/instructor/courses/new" className="btn btn-primary">
              <PlusCircle size={16} /> Create Your First Course
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Course Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lessons</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Students</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Quizzes</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <Link to={`/courses/${c.slug || c.id}`} style={{ color: 'var(--text-main)' }}>
                        {c.title}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-primary">{c.level}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{c.total_lessons}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {c.total_students}
                    </td>
                    <td style={{ padding: '1rem' }}>{c.total_quizzes}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          to={`/instructor/courses/${c.id}/quizzes/new`}
                          className="btn btn-secondary btn-sm"
                          title="Add Quiz Assessment"
                        >
                          <FileQuestion size={15} /> Quiz
                        </Link>
                        <Link
                          to={`/courses/${c.slug || c.id}`}
                          className="btn btn-secondary btn-sm"
                          title="View Course Public Page"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Course"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
