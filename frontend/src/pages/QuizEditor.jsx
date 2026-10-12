import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

const QuizEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([
    {
      prompt: '',
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        prompt: '',
        options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionPromptChange = (idx, text) => {
    const updated = [...questions];
    updated[idx].prompt = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx, optIdx, text) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx].text = text;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
      ...opt,
      is_correct: i === optIdx,
    }));
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Quiz Title is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].prompt.trim()) {
        setError(`Question ${i + 1} prompt cannot be empty.`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].text.trim()) {
          setError(`Option ${j + 1} in Question ${i + 1} cannot be empty.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        course_id: parseInt(courseId),
        title: title.trim(),
        description: description.trim(),
        time_limit_minutes: parseInt(timeLimit),
        passing_score: parseFloat(passingScore),
        questions: questions.map((q, idx) => ({
          prompt: q.prompt.trim(),
          order_index: idx + 1,
          question_type: 'multiple_choice',
          options: q.options.map((opt) => ({
            text: opt.text.trim(),
            is_correct: opt.is_correct,
          })),
        })),
      };

      await apiClient.post(`/quizzes/courses/${courseId}`, payload);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Quiz creation error:', err);
      setError(err.response?.data?.detail || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container main-content" style={{ maxWidth: '850px' }}>
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
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Create Quiz Assessment</h1>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Metadata */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">Quiz Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Midterm Assessment: Relational Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="desc">Instructions / Description</label>
            <input
              id="desc"
              type="text"
              className="form-input"
              placeholder="e.g. Complete all multiple-choice questions within the allotted time."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="time">Time Limit (Minutes)</label>
              <input
                id="time"
                type="number"
                min="1"
                max="180"
                className="form-input"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pass">Passing Score (%)</label>
              <input
                id="pass"
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Question Builder */}
          <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Questions & Answer Key</h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} /> Add Another Question
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      Question #{qIdx + 1}
                    </strong>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        style={{ color: 'var(--danger)', cursor: 'pointer' }}
                        title="Remove question"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter question prompt..."
                      value={q.prompt}
                      onChange={(e) => handleQuestionPromptChange(qIdx, e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Options (Select radio for the correct answer):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: opt.is_correct ? 'var(--accent-light)' : '#ffffff',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${opt.is_correct ? 'var(--accent)' : 'var(--border-color)'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct_q_${qIdx}`}
                          checked={opt.is_correct}
                          onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                          title="Mark this option as correct"
                          style={{ cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.875rem' }}
                          placeholder={`Option ${optIdx + 1} text...`}
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/instructor" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} /> {submitting ? 'Creating Assessment...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizEditor;
