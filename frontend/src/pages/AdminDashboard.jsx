import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  MessageSquare,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'courses'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/courses'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await apiClient.put(`/admin/users/${userId}/status`, {
        role: newRole,
      });
      setUsers(users.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Could not update role.');
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      const targetUser = users.find((u) => u.id === userId);
      const res = await apiClient.put(`/admin/users/${userId}/status`, {
        role: targetUser.role,
        is_active: !currentActive,
      });
      setUsers(users.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      alert('Could not update status.');
    }
  };

  const handleCourseStatusChange = async (courseId, newStatus) => {
    try {
      await apiClient.put(`/admin/courses/${courseId}/status?status_val=${newStatus}`);
      setCourses(
        courses.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update course status:', err);
      alert('Could not update course status.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading administration portal..." />;
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="app-container main-content">
      {/* Page Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} color="var(--primary)" /> Platform Administration Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Monitor system metrics, manage user roles, and moderate course publication status.
        </p>
      </div>

      {/* Platform Metrics */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats?.total_users || 0}
          subtitle={`${stats?.total_students || 0} Students, ${stats?.total_instructors || 0} Faculty`}
          color="var(--primary)"
        />
        <StatCard
          icon={BookOpen}
          title="Total Courses"
          value={stats?.total_courses || 0}
          subtitle="Curriculums published"
          color="var(--secondary)"
        />
        <StatCard
          icon={GraduationCap}
          title="Total Enrollments"
          value={stats?.total_enrollments || 0}
          subtitle="Active student tracks"
          color="var(--accent)"
        />
        <StatCard
          icon={Award}
          title="Assessments"
          value={stats?.total_quizzes || 0}
          subtitle={`${stats?.total_discussions || 0} Forum Threads`}
          color="var(--warning)"
        />
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={16} /> User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BookOpen size={16} /> Course Moderation ({courses.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' ? (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registered Users</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '300px', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                className="form-input"
                placeholder="Search user by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '120px' }}
                      >
                        <option value="student">student</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {u.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Disabled</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Courses Moderation Tab */
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            Course Catalog Moderation
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Course Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Instructor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Enrollments</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Publication Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{c.title}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{c.instructor_name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{c.category_name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{c.total_students}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={c.status}
                        onChange={(e) => handleCourseStatusChange(c.id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '130px' }}
                      >
                        <option value="published">published</option>
                        <option value="draft">draft</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
