import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ documentId: '', text: '', title: '' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = filter === 'saved' ? '?saved=true' : '';
    axios.get(`/api/notes${q}`).then((r) => setNotes(r.data.notes || [])).catch(() => {});
    axios.get('/api/documents').then((r) => setDocuments(r.data.documents || [])).catch(() => {});
  }, [filter]);

  const generate = async (e) => {
    e.preventDefault(); setError(''); setGenerating(true);
    try {
      const { data } = await axios.post('/api/notes/generate', form);
      setNotes((prev) => [data.note, ...prev]);
      setShowForm(false); setForm({ documentId: '', text: '', title: '' });
    } catch (e) { setError(e.response?.data?.error || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const toggleSave = async (id) => {
    try {
      const { data } = await axios.patch(`/api/notes/${id}/save`);
      setNotes((prev) => prev.map((n) => (n._id === id ? data.note : n)));
    } catch {}
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try { await axios.delete(`/api/notes/${id}`); setNotes((prev) => prev.filter((n) => n._id !== id)); }
    catch {}
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Study Notes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>AI-generated notes from your documents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Generate Notes'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Generate New Notes</h3>
          <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="e.g. Chapter 3 Notes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
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
              {generating ? <><span className="spinner" /> Generating…</> : ' Generate Notes'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'saved'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Notes' : ' Saved'}
          </button>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>📝</p>
          <p>No notes yet. Click "Generate Notes" to create your first one!</p>
        </div>
      ) : (
        <div className="grid-2">
          {notes.map((note) => (
            <div key={note._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{note.title}</h3>
                <button onClick={() => toggleSave(note._id)} title={note.isSaved ? 'Unsave' : 'Save'} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>{note.isSaved ? '⭐' : '☆'}</button>
              </div>
              {note.documentId?.originalName && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📄 {note.documentId.originalName}</p>}
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{note.summary}</p>
              {note.keyPoints?.length > 0 && (
                <ul style={{ fontSize: 12, paddingLeft: 16, color: 'var(--color-text-muted)' }}>
                  {note.keyPoints.slice(0, 3).map((kp, i) => <li key={i}>{kp}</li>)}
                </ul>
              )}
              {note.tags?.length > 0 && <div>{note.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(note.createdAt).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to={`/notes/${note._id}`} className="btn btn-secondary btn-sm">View Full</Link>
                <button className="btn btn-danger btn-sm" onClick={() => deleteNote(note._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
