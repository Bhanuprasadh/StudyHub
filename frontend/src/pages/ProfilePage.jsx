import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  Bookmark,
  Calendar,
  Save,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [bookmarks, setBookmarks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await apiClient.get('/bookmarks');
      setBookmarks(res.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await apiClient.put('/users/me', {
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
      });
      updateUser(res.data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Update profile failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container main-content" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account & Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your personal credentials, bio, and bookmarked study resources.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Column: Avatar & Meta Card */}
        <div className="card" style={{ textAlign: 'center', height: 'fit-content', padding: '2rem' }}>
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              overflow: 'hidden',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #ffffff',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={40} color="var(--primary)" />
            )}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{user?.full_name}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {user?.email}
          </p>

          <span className="badge badge-primary" style={{ textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            {user?.role} Role
          </span>

          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1rem',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Permissions: Verified Active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bookmark size={14} /> Saved Courses: {bookmarks.length}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Bookmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Edit Profile Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Edit Profile Information
            </h3>

            {successMsg && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="avatar">Avatar Image URL</label>
                <input
                  id="avatar"
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bio">Academic Bio & Research Interests</label>
                <textarea
                  id="bio"
                  className="form-textarea"
                  rows={4}
                  placeholder="Tell peers about your academic background and interests..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Bookmarks Section */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Bookmarked Courses ({bookmarks.length})
            </h3>

            {bookmarks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                You have not saved any courses yet. Use the Bookmark button on course pages to save them for quick access.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookmarks.map((bm) => (
                  <div
                    key={bm.bookmark_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        <Link to={`/courses/${bm.course.slug || bm.course.id}`} style={{ color: 'var(--text-main)' }}>
                          {bm.course.title}
                        </Link>
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Instructor: {bm.course.instructor_name} • {bm.course.level}
                      </span>
                    </div>

                    <Link to={`/courses/${bm.course.slug || bm.course.id}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
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

export default ProfilePage;
