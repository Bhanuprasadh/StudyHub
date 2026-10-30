import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import LessonContentRenderer from '../components/LessonContentRenderer';
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

const LearningWorkspace = () => {
  const { id: courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
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

  // Scroll to top when active lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLesson?.id]);

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progRes, quizRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/progress/courses/${courseId}`),
        apiClient.get(`/quizzes/courses/${courseId}`),
      ]);

      setCourse(courseRes.data);
      setCompletedLessonIds(progRes.data.completed_lesson_ids || []);
      setProgressPct(progRes.data.progress_percentage || 0);
      setQuizzes(quizRes.data || []);

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

  // Flatten all lessons across all modules to calculate prev / next navigation
  const allLessons = [];
  course?.modules?.forEach((mod) => {
    mod.lessons?.forEach((les) => {
      allLessons.push({ ...les, moduleTitle: mod.title, isRoadmap: mod.order_index === 0 });
    });
  });

  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  const isCurrentLessonCompleted = activeLesson && completedLessonIds.includes(activeLesson.id);

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

  return (
    <div className="app-container main-content" style={{ maxWidth: '1440px' }}>
      {/* Top Workspace Header */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to={`/courses/${course.slug || course.id}`}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={15} /> Syllabus Overview
          </Link>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              {course.category?.name || 'Full-Stack Curriculum'}
            </span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {course.title}
            </h1>
          </div>
        </div>

        {/* Workspace Tab Switcher & Progress Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {completedLessonIds.length} of {allLessons.length} Completed
              </div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{progressPct}%</strong>
            </div>
            <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), #0ea5e9)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setActiveTab('lesson')}
              className={`btn btn-sm ${activeTab === 'lesson' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <BookOpen size={15} /> Lesson Material
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`btn btn-sm ${activeTab === 'discussions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MessageSquare size={15} /> Discussions ({threads.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: Curriculum Sidebar (Left) + Content (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '330px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Sticky Sidebar: Modules, Lessons & Progress */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'sticky',
            top: '85px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Curriculum Roadmap
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {allLessons.length} Lessons
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {course.modules?.map((mod) => {
              const isRoadmap =
                mod.order_index === 0 ||
                mod.title.toLowerCase().includes('roadmap') ||
                mod.title.toLowerCase().includes('section 0');

              return (
                <div
                  key={mod.id}
                  style={{
                    background: isRoadmap ? 'linear-gradient(135deg, rgba(240, 249, 255, 0.8) 0%, rgba(224, 242, 254, 0.4) 100%)' : 'transparent',
                    padding: isRoadmap ? '0.75rem' : '0',
                    borderRadius: 'var(--radius-md)',
                    border: isRoadmap ? '1px solid rgba(14, 165, 233, 0.25)' : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isRoadmap ? '#0284c7' : 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {isRoadmap ? <Compass size={14} color="#0284c7" /> : <Layers size={14} color="var(--primary)" />}
                    <span>{mod.title}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                            gap: '0.65rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected
                              ? 'var(--primary)'
                              : isRoadmap
                              ? '#ffffff'
                              : 'transparent',
                            color: isSelected
                              ? '#ffffff'
                              : isRoadmap
                              ? '#0369a1'
                              : 'var(--text-main)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.825rem',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.15s ease',
                            border: isSelected
                              ? '1px solid var(--primary)'
                              : isRoadmap
                              ? '1px solid rgba(14, 165, 233, 0.15)'
                              : '1px solid transparent',
                            boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                          }}
                        >
                          {isDone ? (
                            <CheckCircle2 size={16} color={isSelected ? '#86efac' : '#10b981'} style={{ flexShrink: 0 }} />
                          ) : (
                            <Circle size={16} color={isSelected ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          )}
                          <span style={{ flex: 1, lineHeight: 1.35 }}>{les.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assessment Quiz Link in Sidebar */}
          {quizzes.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Assessment
              </div>
              {quizzes.map((q) => (
                <Link
                  key={q.id}
                  to={`/quiz/${q.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                    color: '#854d0e',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                  }}
                >
                  <Award size={16} color="#eab308" />
                  <span style={{ flex: 1 }}>{q.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Content Area: Active Lesson Reader or Discussion Forum */}
        <div>
          {activeTab === 'lesson' ? (
            activeLesson ? (
              <div className="card" style={{ padding: '2.5rem', minHeight: '700px', display: 'flex', flexDirection: 'column' }}>
                {/* Lesson Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {activeLesson.content_type || 'Article'} • {activeLesson.duration_minutes} mins
                      </span>
                      {activeLesson.order_index === 1 && currentLessonIndex === 0 && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem', color: '#0284c7', background: '#e0f2fe' }}>
                          🗺️ Section 0 Pathway
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                      {activeLesson.title}
                    </h2>
                  </div>

                  {/* Mark Complete Header Toggle */}
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`btn ${isCurrentLessonCompleted ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    {isCurrentLessonCompleted ? (
                      <>
                        <CheckCircle2 size={17} color="#10b981" /> Completed (Click to Undo)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} /> Mark as Complete
                      </>
                    )}
                  </button>
                </div>

                {/* Lesson Body Content with Structured Renderer */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1.75rem',
                    marginBottom: '2.5rem',
                  }}
                >
                  <LessonContentRenderer
                    content={activeLesson.content_text}
                    lessonTitle={activeLesson.title}
                    isCompleted={isCurrentLessonCompleted}
                    onToggleComplete={() => toggleLessonCompletion(activeLesson.id)}
                    onNextLesson={nextLesson ? () => setActiveLesson(nextLesson) : null}
                    nextLessonTitle={nextLesson?.title}
                    quizId={quizzes.length > 0 ? quizzes[0].id : null}
                  />
                </div>

                {/* Attached Learning Resources & Official Documentation */}
                {activeLesson.resources?.length > 0 && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '2.5rem',
                    }}
                  >
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                      <BookOpen size={18} color="var(--primary)" /> Official Documentation & Standards
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {activeLesson.resources.map((res) => {
                        const isOfficialDoc =
                          res.title.toLowerCase().includes('official') ||
                          res.title.toLowerCase().includes('documentation') ||
                          res.title.toLowerCase().includes('manual') ||
                          res.title.toLowerCase().includes('spec');

                        return (
                          <div
                            key={res.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#ffffff',
                              padding: '0.85rem 1.15rem',
                              borderRadius: 'var(--radius-sm)',
                              border: isOfficialDoc ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--border-color)',
                              boxShadow: isOfficialDoc ? '0 2px 8px rgba(14, 165, 233, 0.08)' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {isOfficialDoc ? (
                                <BookOpen size={16} color="var(--primary)" />
                              ) : (
                                <FileText size={16} color="var(--text-muted)" />
                              )}
                              <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{res.title}</strong>
                              <span className={`badge ${isOfficialDoc ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                                {isOfficialDoc ? 'Official Docs' : res.resource_type}
                              </span>
                            </div>
                            <a
                              href={res.file_path_or_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <ExternalLink size={14} /> Open Docs
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lesson Navigation Footer (Previous, Mark Complete, Next / Quiz) */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Previous Lesson */}
                  {prevLesson ? (
                    <button
                      type="button"
                      onClick={() => setActiveLesson(prevLesson)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <ChevronLeft size={16} /> Previous Lesson
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Mark Complete Toggle */}
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`btn btn-sm ${isCurrentLessonCompleted ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <CheckCircle2 size={16} color={isCurrentLessonCompleted ? '#10b981' : '#ffffff'} />
                    {isCurrentLessonCompleted ? 'Marked Completed' : 'Mark Lesson Complete'}
                  </button>

                  {/* Next Lesson or Take Quiz */}
                  {nextLesson ? (
                    <button
                      type="button"
                      onClick={() => setActiveLesson(nextLesson)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Next Lesson <ChevronRight size={16} />
                    </button>
                  ) : quizzes.length > 0 ? (
                    <Link
                      to={`/quiz/${quizzes[0].id}`}
                      className="btn btn-primary btn-sm"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Award size={16} /> Take Final Assessment Quiz
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                <p>Select a lesson from the curriculum sidebar to start learning.</p>
              </div>
            )
          ) : (
            /* Discussions Tab */
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                    Course Discussion Forum
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Ask questions, share code snippets, and collaborate with course peers and instructors.
                  </p>
                </div>
              </div>

              {/* Create Thread Form */}
              <form onSubmit={handlePostThread} style={{ marginBottom: '2.5rem', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                  Ask a Question or Share Architecture Thoughts
                </h4>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Discussion Title / Question (e.g. How does MVCC prevent dirty reads in PostgreSQL?)"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide context or paste relevant code blocks..."
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={postingThread} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={14} /> {postingThread ? 'Posting...' : 'Post Thread'}
                </button>
              </form>

              {/* Threads List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {threads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No discussion threads posted yet. Be the first to start a conversation!</p>
                  </div>
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
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{thread.title}</h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Posted by <strong>{thread.author?.full_name || 'Student'}</strong> ({thread.author?.role}) •{' '}
                            {new Date(thread.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {(user?.role === 'admin' || user?.id === thread.user_id) && (
                          <button
                            onClick={() => handleDeleteThread(thread.id)}
                            style={{ color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}
                            title="Delete thread"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
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
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-line', margin: 0 }}>
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
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                          placeholder="Write a peer reply..."
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
