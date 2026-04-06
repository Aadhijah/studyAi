import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ documentId: '', text: '', title: '', numQuestions: 10 });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = filter === 'saved' ? '?saved=true' : '';
    axios.get(`/api/quiz${q}`).then((r) => setQuizzes(r.data.quizzes || [])).catch(() => {});
    axios.get('/api/documents').then((r) => setDocuments(r.data.documents || [])).catch(() => {});
  }, [filter]);

  const generate = async (e) => {
    e.preventDefault(); setError(''); setGenerating(true);
    try {
      const { data } = await axios.post('/api/quiz/generate', form);
      setQuizzes((prev) => [data.quiz, ...prev]);
      setShowForm(false); setForm({ documentId: '', text: '', title: '', numQuestions: 10 });
    } catch (e) { setError(e.response?.data?.error || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const toggleSave = async (id) => {
    try { const { data } = await axios.patch(`/api/quiz/${id}/save`); setQuizzes((prev) => prev.map((q) => q._id === id ? data.quiz : q)); }
    catch {}
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    try { await axios.delete(`/api/quiz/${id}`); setQuizzes((prev) => prev.filter((q) => q._id !== id)); }
    catch {}
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Quizzes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>AI-generated multiple choice quizzes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Create Quiz'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Generate New Quiz</h3>
          <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Quiz Title *</label>
              <input className="input" placeholder="e.g. Chapter 3 Quiz" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Number of Questions (3–20)</label>
              <input className="input" type="number" min={3} max={20} value={form.numQuestions} onChange={(e) => setForm({ ...form, numQuestions: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Source — pick a document OR paste text</label>
              <select className="input" value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value, text: '' })}>
                <option value="">— Select a document —</option>
                {documents.map((d) => <option key={d._id} value={d._id}>{d.originalName}</option>)}
              </select>
            </div>
            {!form.documentId && (
              <div className="form-group">
                <label>Or paste text directly</label>
                <textarea className="input" rows={5} placeholder="Paste your text here…" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
            )}
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" disabled={generating || (!form.documentId && !form.text) || !form.title} style={{ alignSelf: 'flex-start' }}>
              {generating ? <><span className="spinner" /> Generating…</> : ' Generate Quiz'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'saved'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Quizzes' : ' Saved'}
          </button>
        ))}
      </div>

      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🎯</p>
          <p>No quizzes yet. Click "Create Quiz" to generate your first one!</p>
        </div>
      ) : (
        <div className="grid-2">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{quiz.title}</h3>
                <button onClick={() => toggleSave(quiz._id)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>{quiz.isSaved ? '⭐' : '☆'}</button>
              </div>
              {quiz.documentId?.originalName && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📄 {quiz.documentId.originalName}</p>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{quiz.questions?.length} questions</span>
                <span className="badge badge-green">{quiz.attempts} attempts</span>
                {quiz.bestScore > 0 && <span className="badge badge-purple">Best: {Math.round(quiz.bestScore)}%</span>}
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(quiz.createdAt).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to={`/quiz/${quiz._id}/play`} className="btn btn-primary btn-sm">▶ Take Quiz</Link>
                <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(quiz._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
