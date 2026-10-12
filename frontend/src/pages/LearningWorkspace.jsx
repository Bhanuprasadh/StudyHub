import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Link as LinkIcon,
  Download,
  MessageSquare,
  Award,
  Send,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

const LearningWorkspace = () => {
  const { id: courseId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'lesson'); // 'lesson' or 'discussions'

  // Discussion forum state
  const [threads, setThreads] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [replyContents, setReplyContents] = useState({});
  const [postingThread, setPostingThread] = useState(false);

  useEffect(() => {
    fetchCourseAndProgress();
    fetchDiscussions();
  }, [courseId]);

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/progress/courses/${courseId}`),
      ]);

      setCourse(courseRes.data);
      setCompletedLessonIds(progRes.data.completed_lesson_ids || []);
      setProgressPct(progRes.data.progress_percentage || 0);

      // Select first lesson if none selected
      const firstModule = courseRes.data.modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
      }
    } catch (err) {
      console.error('Failed to load learning workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const res = await apiClient.get(`/discussions/courses/${courseId}`);
      setThreads(res.data);
    } catch (err) {
      console.error('Failed to load discussions:', err);
    }
  };

  const toggleLessonCompletion = async (lessonId) => {
    const isCompleted = !completedLessonIds.includes(lessonId);
    try {
      await apiClient.post(`/progress/lessons/${lessonId}`, { is_completed: isCompleted });

      setCompletedLessonIds((prev) =>
        isCompleted ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)
      );

      // Refresh progress
      const progRes = await apiClient.get(`/progress/courses/${courseId}`);
      setProgressPct(progRes.data.progress_percentage || 0);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handlePostThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    setPostingThread(true);
    try {
      const res = await apiClient.post(`/discussions/courses/${courseId}`, {
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
      });
      setThreads([res.data, ...threads]);
      setNewThreadTitle('');
      setNewThreadContent('');
    } catch (err) {
      console.error('Failed to post discussion thread:', err);
    } finally {
      setPostingThread(false);
    }
  };

  const handlePostReply = async (threadId) => {
    const replyText = replyContents[threadId];
    if (!replyText || !replyText.trim()) return;

    try {
      const res = await apiClient.post(`/discussions/threads/${threadId}/replies`, {
        content: replyText.trim(),
      });

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, replies: [...(t.replies || []), res.data] } : t
        )
      );
      setReplyContents({ ...replyContents, [threadId]: '' });
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    try {
      await apiClient.delete(`/discussions/threads/${threadId}`);
      setThreads(threads.filter((t) => t.id !== threadId));
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Opening learning workspace..." />;
  }

  if (!course) {
    return (
      <div className="app-container main-content" style={{ textAlign: 'center' }}>
        <h2>Course not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isCurrentLessonCompleted = activeLesson && completedLessonIds.includes(activeLesson.id);

  return (
    <div className="app-container main-content" style={{ maxWidth: '1400px' }}>
      {/* Top Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to={`/courses/${course.id}`} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Course Overview
          </Link>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{course.title}</h1>
        </div>

        {/* Workspace Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('lesson')}
            className={`btn btn-sm ${activeTab === 'lesson' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BookOpen size={16} /> Learning Material
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`btn btn-sm ${activeTab === 'discussions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MessageSquare size={16} /> Course Forum ({threads.length})
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: Curriculum Sidebar + Content Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        {/* Left Sidebar: Modules, Lessons & Progress */}
        <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600 }}>Course Progress</span>
              <strong style={{ color: 'var(--primary)' }}>{progressPct}%</strong>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Course Curriculum
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {course.modules?.map((mod) => (
              <div key={mod.id}>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  {mod.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {mod.lessons?.map((les) => {
                    const isDone = completedLessonIds.includes(les.id);
                    const isSelected = activeLesson?.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          setActiveLesson(les);
                          setActiveTab('lesson');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--primary-light)' : 'transparent',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.825rem',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} color="var(--accent)" />
                        ) : (
                          <Circle size={16} color="var(--text-muted)" />
                        )}
                        <span style={{ flex: 1 }}>{les.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div>
          {activeTab === 'lesson' ? (
            activeLesson ? (
              <div className="card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                      {activeLesson.content_type} • {activeLesson.duration_minutes} minutes
                    </span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                      {activeLesson.title}
                    </h2>
                  </div>

                  {/* Mark Complete Button */}
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`btn ${isCurrentLessonCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isCurrentLessonCompleted ? (
                      <>
                        <CheckCircle2 size={18} color="var(--accent)" /> Completed (Click to Undo)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> Mark as Complete
                      </>
                    )}
                  </button>
                </div>

                {/* Lesson Body Content */}
                <div
                  style={{
                    lineHeight: 1.8,
                    fontSize: '1rem',
                    color: 'var(--text-main)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1.5rem',
                    marginBottom: '2.5rem',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {activeLesson.content_text || 'No text content available for this lesson.'}
                </div>

                {/* Attached Learning Resources */}
                {activeLesson.resources?.length > 0 && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} /> Attached Learning Resources
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeLesson.resources.map((res) => (
                        <div
                          key={res.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.875rem' }}>{res.title}</strong>
                            <span className="badge badge-neutral" style={{ marginLeft: '0.5rem' }}>
                              {res.resource_type}
                            </span>
                          </div>
                          <a
                            href={res.file_path_or_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                          >
                            <Download size={14} /> Open Resource
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Select a lesson from the curriculum sidebar to start learning.</p>
              </div>
            )
          ) : (
            /* Discussions Tab */
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                Course Discussion Forum
              </h2>

              {/* Create Thread Form */}
              <form onSubmit={handlePostThread} style={{ marginBottom: '2.5rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Ask a Question or Start a Discussion
                </h4>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Discussion Topic / Question Title..."
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide details or paste relevant code snippets..."
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={postingThread}>
                  <Send size={14} /> {postingThread ? 'Posting...' : 'Post Thread'}
                </button>
              </form>

              {/* Threads List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {threads.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                    No discussion threads posted yet. Be the first to start a conversation!
                  </p>
                ) : (
                  threads.map((thread) => (
                    <div
                      key={thread.id}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{thread.title}</h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Posted by <strong>{thread.author?.full_name || 'Student'}</strong> ({thread.author?.role}) •{' '}
                            {new Date(thread.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {(user?.role === 'admin' || user?.id === thread.user_id) && (
                          <button
                            onClick={() => handleDeleteThread(thread.id)}
                            style={{ color: 'var(--danger)', cursor: 'pointer' }}
                            title="Delete thread"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                        {thread.content}
                      </p>

                      {/* Replies List */}
                      {thread.replies?.length > 0 && (
                        <div style={{ marginLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                          {thread.replies.map((reply) => (
                            <div key={reply.id} style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                                {reply.author?.full_name} ({reply.author?.role})
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Reply Box */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Write a reply..."
                          value={replyContents[thread.id] || ''}
                          onChange={(e) =>
                            setReplyContents({ ...replyContents, [thread.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePostReply(thread.id);
                          }}
                        />
                        <button
                          onClick={() => handlePostReply(thread.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningWorkspace;
