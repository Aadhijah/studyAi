import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function NoteDetail() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/notes/${id}`)
      .then((r) => setNote(r.data.note))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSave = async () => {
    try {
      const { data } = await axios.patch(`/api/notes/${id}/save`);
      setNote(data.note);
    } catch {}
  };

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner spinner-dark" /></div>;
  if (!note) return <div className="page-container"><p>Note not found.</p><Link to="/notes" className="btn btn-secondary" style={{ marginTop: 12 }}>← Back</Link></div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/notes" className="btn btn-secondary btn-sm">← Back</Link>
        <h1 style={{ flex: 1, fontSize: 24, fontWeight: 700 }}>{note.title}</h1>
        <button className="btn btn-secondary btn-sm" onClick={toggleSave}>{note.isSaved ? '⭐ Saved' : '☆ Save'}</button>
      </div>

      {note.documentId?.originalName && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>📄 From: {note.documentId.originalName}</p>
      )}

      {note.summary && (
        <div className="card" style={{ marginBottom: 20, background: '#f5f3ff', borderColor: '#c4b5fd' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 8 }}>Summary</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>{note.summary}</p>
        </div>
      )}

      {note.keyPoints?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Key Points</h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {note.keyPoints.map((kp, i) => <li key={i} style={{ fontSize: 14, lineHeight: 1.6 }}>{kp}</li>)}
          </ul>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Detailed Notes</h3>
        <div className="markdown-content"><ReactMarkdown>{note.content}</ReactMarkdown></div>
      </div>

      {note.tags?.length > 0 && (
        <div><span style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>Tags:</span>{note.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
      )}
    </div>
  );
}
