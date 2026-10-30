import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BookOpen,
  Award,
  CheckCircle,
  Clock,
  ArrowRight,
  GraduationCap,
  PlayCircle,
  FileQuestion,
  CreditCard,
  Receipt,
  QrCode,
  Building2,
  Wallet,
  FileText,
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [resDash, resTx] = await Promise.all([
        apiClient.get('/users/me/dashboard'),
        apiClient.get('/payments/my-transactions').catch(() => ({ data: [] })),
      ]);
      setDashboardData(resDash.data);
      setTransactions(resTx.data || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your academic dashboard..." />;
  }

  const { stats, enrolled_courses, recent_quizzes } = dashboardData || {
    stats: { enrolled_count: 0, completed_courses_count: 0, total_quizzes_taken: 0 },
    enrolled_courses: [],
    recent_quizzes: [],
  };

  return (
    <div className="app-container main-content">
      {/* Welcome Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.full_name}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Track your progress, continue lessons, and review quiz performance.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <StatCard
          icon={BookOpen}
          title="Enrolled Courses"
          value={stats.enrolled_count}
          subtitle="Active learning tracks"
          color="var(--primary)"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Courses"
          value={stats.completed_courses_count}
          subtitle="100% curriculum completed"
          color="var(--accent)"
        />
        <StatCard
          icon={Award}
          title="Quizzes Attempted"
          value={stats.total_quizzes_taken}
          subtitle="Assessments completed"
          color="var(--secondary)"
        />
      </div>

      {/* Main Grid: Enrolled Courses & Recent Quizzes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Enrolled Courses Section */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>In-Progress Learning Tracks</h2>
            <Link to="/courses" className="btn btn-outline btn-sm">
              Explore More Courses <ArrowRight size={14} />
            </Link>
          </div>

          {enrolled_courses.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff' }}
            >
              <GraduationCap size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                No active courses enrolled yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Discover our curated courses in Full-Stack Web Engineering, Database Systems, and UI/UX Architecture.
              </p>
              <Link to="/courses" className="btn btn-primary">
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {enrolled_courses.map((course) => (
                <div key={course.course_id} className="card card-hover" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      style={{
                        width: '160px',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                        <Link to={`/learn/${course.course_id}`} style={{ color: 'var(--text-main)' }}>
                          {course.title}
                        </Link>
                      </h3>
                      {course.progress_percentage >= 100 ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-primary">In Progress</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Instructor: <strong>{course.instructor_name}</strong>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {course.completed_lessons} of {course.total_lessons} lessons completed
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>{course.progress_percentage}%</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${course.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link to={`/learn/${course.course_id}`} className="btn btn-primary btn-sm">
                        <PlayCircle size={15} /> Continue Learning
                      </Link>
                      <Link to={`/courses/${course.slug || course.course_id}`} className="btn btn-secondary btn-sm">
                        Course Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Recent Quiz Performance */}
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Quiz Performance
          </h2>

          <div className="card">
            {recent_quizzes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                No assessments taken yet. Quizzes appear in each course curriculum!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recent_quizzes.map((quiz) => (
                  <div
                    key={quiz.attempt_id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      paddingBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {quiz.quiz_title}
                      </strong>
                      <span className={`badge ${quiz.passed ? 'badge-success' : 'badge-danger'}`}>
                        {quiz.score}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      <span>Status: {quiz.passed ? 'Passed' : 'Needs Review'}</span>
                      <Link to={`/quiz/${quiz.quiz_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Retake <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Order & Payment Receipts */}
      <div style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Razorpay Payment Receipts & Tax Invoices
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Official transaction statements, payment mode breakdowns, and GST invoices
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {transactions.length} Verified {transactions.length === 1 ? 'Transaction' : 'Transactions'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>No Razorpay transactions found for this account.</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>When you enroll in premium courses with Razorpay, your tax receipts and transaction records will appear here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="lesson-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Course Track</th>
                    <th>Amount (INR)</th>
                    <th>Payment Method</th>
                    <th>Account / Channel</th>
                    <th>Transaction Ref</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const method = tx.payment_method?.toLowerCase() || 'card';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                            {tx.invoice_number || `INV-2026-${tx.id.toString().padStart(4, '0')}`}
                          </strong>
                        </td>
                        <td>
                          <strong>{tx.course_title}</strong>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>₹{tx.amount} INR</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background:
                                method === 'upi'
                                  ? 'rgba(79, 70, 229, 0.1)'
                                  : method === 'netbanking'
                                  ? 'rgba(2, 132, 199, 0.1)'
                                  : method === 'wallet'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : 'rgba(234, 88, 12, 0.1)',
                              color:
                                method === 'upi'
                                  ? '#4f46e5'
                                  : method === 'netbanking'
                                  ? '#0284c7'
                                  : method === 'wallet'
                                  ? '#059669'
                                  : '#ea580c',
                            }}
                          >
                            {method === 'upi' && <QrCode size={11} />}
                            {method === 'netbanking' && <Building2 size={11} />}
                            {method === 'wallet' && <Wallet size={11} />}
                            {method === 'card' && <CreditCard size={11} />}
                            {method}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {tx.bank_or_vpa || 'Visa / Mastercard'}
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {tx.payment_id || tx.order_id}
                          </code>
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                            <CheckCircle size={11} /> Paid
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(tx);
                              setShowInvoiceModal(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                            title="View / Print Official Tax Invoice"
                          >
                            <FileText size={12} /> Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tax Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
          invoiceId={selectedInvoice.invoice_number || selectedInvoice.payment_id}
          initialData={{
            invoice_number: selectedInvoice.invoice_number || `INV-2026-${selectedInvoice.id.toString().padStart(4, '0')}`,
            order_id: selectedInvoice.order_id,
            payment_id: selectedInvoice.payment_id,
            course_id: selectedInvoice.course_id,
            course_title: selectedInvoice.course_title,
            student_name: user?.full_name || 'Enrolled Scholar',
            student_email: user?.email || '',
            amount: selectedInvoice.amount,
            total_amount: selectedInvoice.amount,
            payment_method: selectedInvoice.payment_method || 'card',
            bank_or_vpa: selectedInvoice.bank_or_vpa,
            status: selectedInvoice.status || 'paid',
            issued_at: selectedInvoice.created_at,
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
