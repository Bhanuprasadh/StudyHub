import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Clock,
  CheckCircle,
  XCircle,
  Award,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

const QuizInterface = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { question_id: option_id }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0 || result) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, result]);

  const fetchQuiz = async () => {
    try {
      const res = await apiClient.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
      setSecondsRemaining(res.data.time_limit_minutes * 60);
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    if (result) return; // Prevent changing after submission
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionId,
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting || result) return;

    // Check if unanswered questions exist
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < totalQuestions) {
      if (!window.confirm(`You answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(selectedAnswers).map(([qId, optId]) => ({
          question_id: parseInt(qId),
          selected_option_id: optId,
        })),
      };

      const res = await apiClient.post(`/quizzes/${quizId}/submit`, payload);
      setResult(res.data);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert(err.response?.data?.detail || 'Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading) {
    return <LoadingSpinner text="Preparing quiz assessment..." />;
  }

  if (!quiz) {
    return (
      <div className="app-container main-content" style={{ textAlign: 'center' }}>
        <h2>Quiz not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="app-container main-content" style={{ maxWidth: '850px' }}>
      {/* Top Header & Timer */}
      <div
        className="card"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Link
            to={`/courses/${quiz.course_id}`}
            style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}
          >
            <ArrowLeft size={14} /> Back to Course
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{quiz.title}</h1>
        </div>

        {!result && secondsRemaining !== null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: secondsRemaining < 120 ? 'var(--danger-light)' : 'var(--primary-light)',
              color: secondsRemaining < 120 ? 'var(--danger)' : 'var(--primary)',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            <Clock size={18} />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>
        )}
      </div>

      {/* Result Display Summary */}
      {result && (
        <div
          className="card"
          style={{
            padding: '2.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            background: result.passed ? 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)' : 'linear-gradient(180deg, #fef2f2 0%, #ffffff 100%)',
            border: `2px solid ${result.passed ? 'var(--accent)' : 'var(--danger)'}`,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: result.passed ? 'var(--accent-light)' : 'var(--danger-light)',
              color: result.passed ? 'var(--accent)' : 'var(--danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            {result.passed ? <CheckCircle size={36} /> : <XCircle size={36} />}
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {result.passed ? 'Congratulations! You Passed!' : 'Assessment Incomplete'}
          </h2>

          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: result.passed ? 'var(--accent)' : 'var(--danger)', margin: '0.5rem 0' }}>
            {result.score}%
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Required passing score: <strong>{quiz.passing_score}%</strong>. Review the answer breakdown below.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => {
                setResult(null);
                setSelectedAnswers({});
                setSecondsRemaining(quiz.time_limit_minutes * 60);
              }}
              className="btn btn-secondary"
            >
              <RotateCcw size={16} /> Retake Assessment
            </button>
            <Link to={`/learn/${quiz.course_id}`} className="btn btn-primary">
              Return to Course
            </Link>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {quiz.questions.map((question, qIdx) => {
            const breakdownItem = result?.breakdown?.find((b) => b.question_id === question.id);

            return (
              <div
                key={question.id}
                className="card"
                style={{
                  padding: '1.75rem',
                  border: breakdownItem
                    ? breakdownItem.is_correct
                      ? '1px solid var(--accent)'
                      : '1px solid var(--danger)'
                    : '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4 }}>
                    Question {qIdx + 1}: {question.prompt}
                  </h3>

                  {breakdownItem && (
                    <span className={`badge ${breakdownItem.is_correct ? 'badge-success' : 'badge-danger'}`}>
                      {breakdownItem.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {question.options.map((opt) => {
                    const isSelected = selectedAnswers[question.id] === opt.id;
                    const isCorrectAnswer = breakdownItem && breakdownItem.correct_option_id === opt.id;

                    let optionBg = '#ffffff';
                    let optionBorder = 'var(--border-color)';

                    if (result) {
                      if (isCorrectAnswer) {
                        optionBg = 'var(--accent-light)';
                        optionBorder = 'var(--accent)';
                      } else if (isSelected && !breakdownItem?.is_correct) {
                        optionBg = 'var(--danger-light)';
                        optionBorder = 'var(--danger)';
                      }
                    } else if (isSelected) {
                      optionBg = 'var(--primary-light)';
                      optionBorder = 'var(--primary)';
                    }

                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(question.id, opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: optionBg,
                          border: `1px solid ${optionBorder}`,
                          cursor: result ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                          fontSize: '0.925rem',
                        }}
                      >
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(question.id, opt.id)}
                          disabled={!!result}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>{opt.text}</span>
                        {result && isCorrectAnswer && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
                            (Correct Answer)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {!result && (
          <div style={{ textAlign: 'right' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Grading Assessment...' : 'Submit Answers for Grading'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuizInterface;
