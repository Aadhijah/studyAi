import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Upload() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      const { data } = await axios.get('/api/documents');
      setDocuments(data.documents || []);
    } catch {}
  };

  useEffect(() => { loadDocuments(); }, []);

  const uploadFile = async (file) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { setError('Unsupported file type. Use PDF, DOC, DOCX, PPT, PPTX, or TXT.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('File too large. Max size is 20MB.'); return; }
    setError(''); setSuccess(''); setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await axios.post('/api/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setSuccess(`"${file.name}" uploaded successfully!`);
      loadDocuments();
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); setProgress(0); }
  };

  const handleFileInput = (e) => { if (e.target.files[0]) uploadFile(e.target.files[0]); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); };

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await axios.delete(`/api/documents/${id}`); setDocuments(docs => docs.filter(d => d._id !== id)); }
    catch (e) { setError(e.response?.data?.error || 'Delete failed'); }
  };

  const fmtSize = (b) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  return (
    <div className="page-container">
      <h1 className="page-title">Upload Document</h1>
      <p className="page-sub">Upload PDF, DOCX, PPTX, or TXT files to generate study materials</p>

      <div className="card" style={{ marginBottom: 28 }}>
        <div
          className="drop-zone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f5f3ff' : 'transparent', transition: 'all .2s' }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}></div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Drag & drop a file here, or click to browse</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Supported: PDF, DOC, DOCX, PPT, PPTX, TXT · Max 20MB</p>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style={{ display: 'none' }} onChange={handleFileInput} />
        </div>

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Uploading & extracting text…</span><span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-primary)', borderRadius: 99, transition: 'width .2s' }} />
            </div>
          </div>
        )}
        {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}
        {success && <p className="success-msg" style={{ marginTop: 12 }}>{success}</p>}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Documents ({documents.length})</h2>
      {documents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}></p>
          <p>No documents yet. Upload one above to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {documents.map((doc) => (
            <div key={doc._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{doc.fileType === 'pdf' ? '📕' : doc.fileType === 'txt' ? '📃' : '📘'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {doc.fileType.toUpperCase()} · {fmtSize(doc.fileSize)} · {doc.textLength?.toLocaleString()} chars extracted · {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
