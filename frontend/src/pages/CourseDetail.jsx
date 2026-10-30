import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Bookmark,
  PlayCircle,
  HelpCircle,
  Users,
  Clock,
  Layers,
  ArrowRight,
  MessageSquare,
  Compass,
  Award,
  ExternalLink,
  Star,
  ShieldCheck,
  Sparkles,
  FileText,
  CreditCard,
  Shield,
  X,
  AlertCircle,
} from 'lucide-react';
import { processCourseEnrollment } from '../utils/payment';

const CourseDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [sandboxModal, setSandboxModal] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState('');

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
    setPaymentError('');

    const res = await processCourseEnrollment({
      course,
      user,
      onOrderCreated: (order) => {
        console.log('Razorpay order generated:', order);
      },
      onSuccess: (paymentData) => {
        setEnrolling(false);
        setCourse((prev) => ({ ...prev, is_enrolled: true }));
        setPaymentSuccess(paymentData);
      },
      onError: (errMessage) => {
        setEnrolling(false);
        setPaymentError(errMessage);
      },
      onCancel: () => {
        setEnrolling(false);
      },
    });

    if (res && res.isSandbox) {
      setEnrolling(false);
      setSandboxModal(res.orderData);
    }
  };

  const handleConfirmSandboxPayment = async () => {
    if (!sandboxModal) return;
    setEnrolling(true);
    try {
      const mockPaymentId = `pay_demo_${Date.now().toString().slice(-8)}`;
      const mockSignature = `demo_sig_${Date.now()}`;
      const verifyRes = await apiClient.post('/payments/verify', {
        course_id: course.id,
        razorpay_order_id: sandboxModal.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });
      setSandboxModal(null);
      setCourse((prev) => ({ ...prev, is_enrolled: true }));
      setPaymentSuccess(verifyRes.data);
    } catch (err) {
      setPaymentError(err.response?.data?.detail || 'Sandbox payment verification failed');
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
    return <LoadingSpinner text="Loading course curriculum & architecture..." />;
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

  // Derive key technical outcomes based on course category
  const getCourseOutcomes = () => {
    if (course.category?.slug?.includes('database')) {
      return [
        'Master 1NF, 2NF, 3NF, and BCNF normalization to eliminate data anomalies',
        'Profile query plans with EXPLAIN ANALYZE and eliminate costly sequential scans',
        'Architect high-performance B-Tree, GIN, and Partial index structures',
        'Manage ACID transactions and Multi-Version Concurrency Control (MVCC)',
      ];
    }
    if (course.category?.slug?.includes('ui-ux')) {
      return [
        'Build scalable design systems with CSS Custom Properties and unified design tokens',
        'Achieve WCAG 2.1 Level AA accessibility with 4.5:1 color contrast and ARIA landmarks',
        'Implement accessible keyboard navigation, focus management, and screen reader announcements',
        'Develop responsive grid and flexbox layouts with fluid typography',
      ];
    }
    if (course.category?.slug?.includes('cloud') || course.category?.slug?.includes('devops')) {
      return [
        'Engineer multi-stage production Dockerfiles with non-root security',
        'Build automated CI/CD workflows with automated testing and artifact caching',
        'Configure health checks, graceful shutdown signals, and restart policies',
        'Manage environment configurations and secrets following 12-factor principles',
      ];
    }
    if (course.category?.slug?.includes('security') || course.category?.slug?.includes('system')) {
      return [
        'Design horizontally scalable distributed systems with stateless service tiers',
        'Implement resilient caching with Redis, cache-aside pattern, and TTL jitter',
        'Mitigate OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, Broken Auth)',
        'Architect high-availability clusters with database read replicas and health probes',
      ];
    }
    return [
      'Architect robust RESTful APIs with FastAPI and Pydantic schema validation',
      'Implement secure JWT Bearer authentication with bcrypt password salting',
      'Model relational databases using SQLAlchemy 2.0 ORM and Alembic migrations',
      'Build responsive Single Page Applications with React and design tokens',
    ];
  };

  // Extract official docs links from lesson resources if present
  const docResources = [];
  course.modules?.forEach((mod) => {
    mod.lessons?.forEach((les) => {
      if (les.resources) {
        les.resources.forEach((r) => {
          if (r.resource_type === 'link' || r.title?.toLowerCase().includes('doc')) {
            docResources.push(r);
          }
        });
      }
    });
  });

  return (
    <div className="app-container main-content">
      {/* Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
        }}
      >
        <Link to="/courses" style={{ color: 'var(--primary)', fontWeight: 500 }}>
          Courses
        </Link>
        <span>/</span>
        <span>{course.category?.name || 'Curriculum'}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{course.title}</span>
      </div>

      {/* Course Hero Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #172554 100%)',
          color: '#ffffff',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.2fr',
          gap: '2.5rem',
          alignItems: 'center',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
        }}
      >
        <div>
          {/* Top Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {course.level} Track
            </span>
            {course.category && (
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {course.category.name}
              </span>
            )}
            <button
              onClick={toggleBookmark}
              style={{
                background: bookmarked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                color: bookmarked ? '#a5b4fc' : '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: 'auto',
                cursor: 'pointer',
              }}
            >
              <Bookmark size={13} fill={bookmarked ? '#a5b4fc' : 'none'} />
              {bookmarked ? 'Saved to Bookmarks' : 'Bookmark'}
            </button>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '0.85rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            {course.title}
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#cbd5e1',
              marginBottom: '1.5rem',
            }}
          >
            {course.short_description || course.title}
          </p>

          {/* Instructor & Meta Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
              marginBottom: '1.75rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {course.instructor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img
                  src={course.instructor.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                  alt={course.instructor.full_name}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Course Author</div>
                  <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{course.instructor.full_name}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#facc15', fontSize: '0.85rem', fontWeight: 700 }}>
              <Star size={14} fill="#facc15" color="#facc15" /> 4.9 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(120+ ratings)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd', fontSize: '0.85rem' }}>
              <Users size={14} /> <span>{course.total_enrollments || 0} enrolled students</span>
            </div>

            {/* Price Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                background: course.price > 0 ? 'rgba(79, 70, 229, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.875rem',
              }}
            >
              <CreditCard size={15} />
              <span>{course.price > 0 ? `₹${course.price} INR` : 'Free Curriculum'}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {course.is_enrolled ? (
              <Link
                to={`/learn/${course.id}`}
                className="btn btn-primary btn-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <PlayCircle size={20} /> Continue Learning
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="btn btn-primary btn-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {enrolling ? (
                  'Processing...'
                ) : course.price > 0 ? (
                  <>
                    <CreditCard size={20} /> Enroll with Razorpay (₹{course.price})
                  </>
                ) : (
                  <>
                    <PlayCircle size={20} /> Enroll in Track (Free)
                  </>
                )}
              </button>
            )}

            <Link
              to={`/learn/${course.id}?tab=discussions`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              <MessageSquare size={17} /> Peer Discussion
            </Link>
          </div>
        </div>

        {/* Thumbnail Preview Card */}
        {course.thumbnail_url && (
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <img
              src={course.thumbnail_url}
              alt={course.title}
              style={{
                width: '100%',
                maxHeight: '290px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1rem',
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#cbd5e1',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color="#38bdf8" /> {course.total_lessons || 0} Lessons
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={14} color="#facc15" /> Verified Certificate
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        {/* Left Column: Syllabus, Outcomes, Roadmap */}
        <div>
          {/* Key Learning Outcomes */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} color="var(--primary)" /> What You Will Master in this Curriculum
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {getCourseOutcomes().map((outcome, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 0 Engineering Roadmap Spotlight */}
          <div
            className="card"
            style={{
              padding: '1.75rem',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.8) 0%, #ffffff 100%)',
              border: '1px solid rgba(14, 165, 233, 0.35)',
              boxShadow: '0 4px 20px -2px rgba(14, 165, 233, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={22} color="#0284c7" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0369a1', margin: 0 }}>
                  Section 0: Interactive Architectural Roadmap
                </h3>
              </div>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                🗺️ Core Pathway
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              Every StudyHub course begins with <strong>Section 0</strong>: a visual architectural blueprint mapping core concepts, system prerequisites, and learning milestones. Explore the interactive diagram before diving into code implementations.
            </p>

            <Link
              to={`/learn/${course.id}`}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#0284c7',
                borderColor: '#bae6fd',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              Open Section 0 Blueprint <ArrowRight size={14} />
            </Link>
          </div>

          {/* Curriculum Syllabus Modules */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Curriculum & Syllabus
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {course.modules?.length || 0} Modules • {course.total_lessons || 0} Lessons
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {course.modules?.map((module, mIdx) => {
                const isRoadmap =
                  module.order_index === 0 ||
                  module.title.toLowerCase().includes('roadmap') ||
                  module.title.toLowerCase().includes('section 0');

                return (
                  <div
                    key={module.id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      border: isRoadmap ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid var(--border-color)',
                      background: isRoadmap ? 'linear-gradient(135deg, rgba(240, 249, 255, 0.6) 0%, #ffffff 100%)' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: isRoadmap ? '#0284c7' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: 0,
                        }}
                      >
                        {isRoadmap ? <Compass size={18} color="#0284c7" /> : <Layers size={18} color="var(--primary)" />}
                        {module.title}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {module.lessons?.length || 0} lessons
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {module.lessons?.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.7rem 0.85rem',
                            background: isRoadmap ? '#ffffff' : 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-md)',
                            border: isRoadmap ? '1px solid rgba(14, 165, 233, 0.15)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {isRoadmap ? (
                              <Compass size={16} color="#0284c7" />
                            ) : (
                              <BookOpen size={16} color="var(--text-secondary)" />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {lesson.title}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={12} /> {lesson.duration_minutes} mins
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Documentation Matrix */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="var(--primary)" /> Official Documentation & Engineering References
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This course is aligned with current official specifications. Explore the official documentation alongside lesson guides:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {docResources.length > 0 ? (
                docResources.map((res, rIdx) => (
                  <a
                    key={rIdx}
                    href={res.file_path_or_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.825rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span>{res.title}</span>
                    <ExternalLink size={13} color="var(--primary)" />
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="https://fastapi.tiangolo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.825rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <span>Official FastAPI Guide</span>
                    <ExternalLink size={13} color="var(--primary)" />
                  </a>
                  <a
                    href="https://react.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.825rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <span>React 18 / 19 Documentation</span>
                    <ExternalLink size={13} color="var(--primary)" />
                  </a>
                  <a
                    href="https://www.postgresql.org/docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.825rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <span>PostgreSQL Documentation</span>
                    <ExternalLink size={13} color="var(--primary)" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <div>
          <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Enrollment / Quick Action Box */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
                Course Curriculum Overview
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Format</span>
                  <strong>Self-Paced Architecture</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Lessons</span>
                  <strong>{course.total_lessons || 0} Lessons</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Level</span>
                  <strong style={{ textTransform: 'capitalize' }}>{course.level}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Assessments</span>
                  <strong>{quizzes.length} Auto-Graded Quiz</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Curriculum Fee</span>
                  <strong style={{ color: course.price > 0 ? 'var(--primary)' : '#059669', fontSize: '1.05rem' }}>
                    {course.price > 0 ? `₹${course.price} INR` : 'Free'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Certification</span>
                  <strong style={{ color: '#059669' }}>Included (75% Score)</strong>
                </div>
              </div>

              {paymentError && (
                <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <AlertCircle size={15} />
                  <span>{paymentError}</span>
                </div>
              )}

              {course.is_enrolled ? (
                <Link
                  to={`/learn/${course.id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <PlayCircle size={18} /> Continue Learning
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  {enrolling ? (
                    'Processing...'
                  ) : course.price > 0 ? (
                    <>
                      <CreditCard size={18} /> Pay with Razorpay (₹{course.price})
                    </>
                  ) : (
                    'Enroll in Track (Free)'
                  )}
                </button>
              )}

              {course.price > 0 && !course.is_enrolled && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Shield size={13} color="#10b981" /> 256-bit encrypted • Razorpay verified
                </div>
              )}
            </div>

            {/* Assessment Quizzes Card */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Award size={20} color="#f59e0b" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Assessment Quizzes
                </h3>
              </div>

              {quizzes.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No assessment quizzes active for this track.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {quizzes.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '1rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {q.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                        {q.description || 'Auto-evaluated quiz testing core engineering competencies.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Pass: <strong>{q.passing_score}%</strong> • {q.time_limit_minutes}m</span>
                        {course.is_enrolled ? (
                          <Link to={`/quiz/${q.id}`} className="btn btn-primary btn-sm">
                            Take Quiz
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Enroll to take
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructor Card */}
            {course.instructor && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.85rem', letterSpacing: '0.05em' }}>
                  Course Instructor
                </h4>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <img
                    src={course.instructor.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                    alt={course.instructor.full_name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                      {course.instructor.full_name}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Faculty & Systems Specialist
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {course.instructor.bio || 'Senior engineering faculty passionate about distributed web architecture.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Interactive Checkout Modal (Sandbox / Test Mode Dialog) */}
      {sandboxModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #4f46e5',
            }}
          >
            {/* Modal Header with Razorpay Branding */}
            <div style={{ background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)', padding: '1.5rem', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ background: '#3b82f6', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                    RAZORPAY
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600 }}>Checkout Gateway</span>
                </div>
                <button
                  onClick={() => setSandboxModal(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Order Total</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
                  ₹{sandboxModal.amount}.00 <span style={{ fontSize: '0.9rem', color: '#38bdf8' }}>INR</span>
                </div>
              </div>
            </div>

            {/* Modal Body: Course & Billing Info */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Course Enrollment
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {course.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Order ID: <code>{sandboxModal.order_id}</code>
                </div>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <strong>Student:</strong> {user?.full_name || 'Enrolled Student'} ({user?.email})
                </p>
                <p style={{ margin: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={14} /> Instant verification • Automated email receipt upon completion
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSandboxModal(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSandboxPayment}
                  disabled={enrolling}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}
                >
                  {enrolling ? 'Verifying...' : `Pay ₹${sandboxModal.amount} (Simulate)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Dialog */}
      {paymentSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
              Enrollment Confirmed!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Your enrollment in <strong>{course.title}</strong> is active. An official confirmation email with your transaction receipt has been dispatched.
            </p>

            {paymentSuccess.payment_id && (
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div><strong>Transaction ID:</strong> <code>{paymentSuccess.payment_id}</code></div>
                <div><strong>Order ID:</strong> <code>{paymentSuccess.order_id}</code></div>
              </div>
            )}

            <button
              onClick={() => navigate(`/learn/${course.id}`)}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            >
              <PlayCircle size={18} /> Enter Learning Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
