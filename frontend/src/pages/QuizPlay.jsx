import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function QuizPlay() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`/api/quiz/${id}`)
      .then((r) => setQuiz(r.data.quiz))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner spinner-dark" /></div>;
  if (!quiz) return <div className="page-container"><p>Quiz not found.</p><Link to="/quiz" className="btn btn-secondary" style={{ marginTop: 12 }}>← Back</Link></div>;

  const q = quiz.questions[current];
  const total = quiz.questions.length;

  const handleSelect = (idx) => { if (selected === null) setSelected(idx); };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    if (current + 1 < total) {
      setAnswers(newAnswers); setSelected(null); setCurrent(current + 1);
    } else {
      const correct = newAnswers.filter((a, i) => a === quiz.questions[i].correctAnswer).length;
      const pct = Math.round((correct / total) * 100);
      setScore(pct); setAnswers(newAnswers); setShowResult(true);
      if (!submitted) {
        axios.post(`/api/quiz/${id}/attempt`, { score: pct }).catch(() => {});
        setSubmitted(true);
      }
    }
  };

  if (showResult) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 60, marginBottom: 12 }}>{score >= 80 ? '🏆' : score >= 60 ? '😊' : '📚'}</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{score}%</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>{answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length} out of {total} correct</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => { setAnswers([]); setSelected(null); setCurrent(0); setShowResult(false); setSubmitted(false); }}>Try Again</button>
            <Link to="/quiz" className="btn btn-secondary">← Back to Quizzes</Link>
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Review Answers</h3>
        {quiz.questions.map((q, i) => {
          const correct = answers[i] === q.correctAnswer;
          return (
            <div key={i} className="card" style={{ marginBottom: 12, borderColor: correct ? 'var(--color-success)' : 'var(--color-error)' }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>{i + 1}. {q.question}</p>
              {q.options.map((opt, j) => (
                <div key={j} style={{ padding: '6px 12px', borderRadius: 6, marginBottom: 4, fontSize: 14,
                  background: j === q.correctAnswer ? '#d1fae5' : j === answers[i] && !correct ? '#fee2e2' : 'transparent' }}>
                  {j === q.correctAnswer ? '✅' : j === answers[i] && !correct ? '❌' : '  '} {opt}
                </div>
              ))}
              {q.explanation && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>💡 {q.explanation}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link to="/quiz" className="btn btn-secondary btn-sm">← Back</Link>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>Question {current + 1} / {total}</span>
      </div>

      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, marginBottom: 28 }}>
        <div style={{ height: '100%', width: `${((current + 1) / total) * 100}%`, background: 'var(--color-primary)', borderRadius: 99, transition: 'width .3s' }} />
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, lineHeight: 1.5 }}>{q.question}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, j) => {
            let bg = 'var(--color-bg)'; let border = 'var(--color-border)';
            if (selected !== null) {
              if (j === q.correctAnswer) { bg = '#d1fae5'; border = 'var(--color-success)'; }
              else if (j === selected) { bg = '#fee2e2'; border = 'var(--color-error)'; }
            } else if (selected === j) { bg = '#ede9fe'; border = 'var(--color-primary)'; }
            return (
              <button key={j} onClick={() => handleSelect(j)} style={{ padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg, textAlign: 'left', fontSize: 14, cursor: selected !== null ? 'default' : 'pointer', transition: 'all .15s' }}>
                <span style={{ fontWeight: 700, marginRight: 10, color: 'var(--color-text-muted)' }}>{String.fromCharCode(65 + j)}.</span>{opt}
              </button>
            );
          })}
        </div>
        {selected !== null && q.explanation && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '10px 14px', borderRadius: 8 }}>💡 {q.explanation}</p>
        )}
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={selected === null} onClick={handleNext}>
          {current + 1 < total ? 'Next →' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  );
}
