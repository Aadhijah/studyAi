import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const COLORS = ['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#e879f9'];

function Node({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const color = COLORS[depth % COLORS.length];

  return (
    <div style={{ position: 'relative', paddingLeft: depth > 0 ? 28 : 0 }}>
      {depth > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 18, width: 20, height: 1, background: color + '60' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)', padding: 0, width: 16, flexShrink: 0 }}>
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <span style={{ width: 16, flexShrink: 0 }} />}
        <div style={{
          display: 'inline-flex', alignItems: 'center', padding: depth === 0 ? '10px 20px' : '6px 14px',
          borderRadius: depth === 0 ? 12 : 8,
          background: color, color: '#fff',
          fontSize: depth === 0 ? 16 : depth === 1 ? 14 : 13,
          fontWeight: depth === 0 ? 700 : depth === 1 ? 600 : 500,
          boxShadow: depth <= 1 ? '0 2px 8px rgba(0,0,0,.15)' : 'none',
          maxWidth: 320, wordBreak: 'break-word',
        }}>
          {node.label}
        </div>
      </div>
      {hasChildren && expanded && (
        <div style={{ paddingLeft: 16, borderLeft: `2px solid ${color}30`, marginLeft: 16 }}>
          {node.children.map((child) => <Node key={child.id} node={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function MindMapView() {
  const { id } = useParams();
  const [mm, setMm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/mindmap/${id}`)
      .then((r) => setMm(r.data.mindMap))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSave = async () => {
    try { const { data } = await axios.patch(`/api/mindmap/${id}/save`); setMm(data.mindMap); }
    catch {}
  };

  if (loading) return <div className="page-container" style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner spinner-dark" /></div>;
  if (!mm) return <div className="page-container"><p>Mind map not found.</p><Link to="/mindmap" className="btn btn-secondary" style={{ marginTop: 12 }}>← Back</Link></div>;

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/mindmap" className="btn btn-secondary btn-sm">← Back</Link>
        <h1 style={{ flex: 1, fontSize: 22, fontWeight: 700 }}>{mm.title}</h1>
        <button className="btn btn-secondary btn-sm" onClick={toggleSave}>{mm.isSaved ? '⭐ Saved' : '☆ Save'}</button>
      </div>

      {mm.documentId?.originalName && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>📄 From: {mm.documentId.originalName}</p>
      )}

      <div className="card" style={{ overflowX: 'auto', padding: '28px 24px' }}>
        {mm.rootNode ? <Node node={mm.rootNode} /> : <p style={{ color: 'var(--color-text-muted)' }}>No mind map data available.</p>}
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12, textAlign: 'right' }}>
        Click ▾ / ▸ to expand or collapse branches
      </p>
    </div>
  );
}
