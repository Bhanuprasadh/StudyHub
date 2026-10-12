import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const CourseEditor = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('beginner');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        setCategoryId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Title and Detailed Description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim(),
        description: description.trim(),
        category_id: categoryId ? parseInt(categoryId) : null,
        level,
        status: 'published',
        thumbnail_url: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      };

      const res = await apiClient.post('/courses', payload);
      navigate(`/courses/${res.data.slug || res.data.id}`);
    } catch (err) {
      console.error('Course creation error:', err);
      setError(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container main-content" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/instructor"
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginBottom: '0.5rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Instructor Studio
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Create New Academic Course</h1>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Course Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Distributed Systems & Microservices in Go"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="shortDesc">Brief Summary (One or two sentences)</label>
            <input
              id="shortDesc"
              type="text"
              className="form-input"
              placeholder="e.g. Master distributed consensus, gRPC streaming, and fault tolerance."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cat">Category</label>
              <select
                id="cat"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lvl">Difficulty Level</label>
              <select
                id="lvl"
                className="form-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="thumb">Cover Thumbnail Image URL</label>
            <input
              id="thumb"
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/photo-..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="desc">Detailed Curriculum Description</label>
            <textarea
              id="desc"
              className="form-textarea"
              rows={8}
              placeholder="Provide course learning objectives, syllabus breakdown, and prerequisites..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Link to="/instructor" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? 'Publishing Course...' : 'Publish Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditor;
