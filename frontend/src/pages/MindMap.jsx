import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function MindMap() {
  const [maps, setMaps] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ documentId: '', text: '', title: '' });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = filter === 'saved' ? '?saved=true' : '';
    axios.get(`/api/mindmap${q}`).then((r) => setMaps(r.data.mindMaps || [])).catch(() => {});
    axios.get('/api/documents').then((r) => setDocuments(r.data.documents || [])).catch(() => {});
  }, [filter]);

  const generate = async (e) => {
    e.preventDefault(); setError(''); setGenerating(true);
    try {
      const { data } = await axios.post('/api/mindmap/generate', form);
      setMaps((prev) => [data.mindMap, ...prev]);
      setShowForm(false); setForm({ documentId: '', text: '', title: '' });
    } catch (e) { setError(e.response?.data?.error || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const toggleSave = async (id) => {
    try { const { data } = await axios.patch(`/api/mindmap/${id}/save`); setMaps((prev) => prev.map((m) => m._id === id ? data.mindMap : m)); }
    catch {}
  };

  const deleteMindMap = async (id) => {
    if (!confirm('Delete this mind map?')) return;
    try { await axios.delete(`/api/mindmap/${id}`); setMaps((prev) => prev.filter((m) => m._id !== id)); }
    catch {}
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Mind Maps</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>AI-generated visual concept maps</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Create Mind Map'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Generate New Mind Map</h3>
          <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="e.g. Biology Chapter 5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
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
              {generating ? <><span className="spinner" /> Generating…</> : ' Generate Mind Map'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'saved'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Maps' : ' Saved'}
          </button>
        ))}
      </div>

      {maps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🗺</p>
          <p>No mind maps yet. Click "Create Mind Map" to generate your first one!</p>
        </div>
      ) : (
        <div className="grid-2">
          {maps.map((mm) => (
            <div key={mm._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{mm.title}</h3>
                <button onClick={() => toggleSave(mm._id)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>{mm.isSaved ? '⭐' : '☆'}</button>
              </div>
              {mm.documentId?.originalName && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📄 {mm.documentId.originalName}</p>}
              {mm.rootNode?.children && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {mm.rootNode.children.slice(0, 4).map((c) => (
                    <span key={c.id} className="badge badge-purple" style={{ background: c.color + '22', color: c.color }}>{c.label}</span>
                  ))}
                  {mm.rootNode.children.length > 4 && <span className="badge badge-purple">+{mm.rootNode.children.length - 4} more</span>}
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(mm.createdAt).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to={`/mindmap/${mm._id}`} className="btn btn-secondary btn-sm">View Map</Link>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMindMap(mm._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
