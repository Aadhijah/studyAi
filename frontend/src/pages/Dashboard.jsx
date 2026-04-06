import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const StatCard = ({ label, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{
      width: 52,
      height: 52,
      borderRadius: 12,
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: 28, fontWeight: 700 }}>{value}</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  </div>
);

const typeInfo = {
  note: { icon: '📝', color: '#dbeafe', label: 'Note' },
  quiz: { icon: '🎯', color: '#d1fae5', label: 'Quiz' },
  mindmap: { icon: '🗺', color: '#ede9fe', label: 'Mind Map' },
  document: { icon: '📄', color: '#ffedd5', label: 'Document' }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/dashboard/stats'),
      axios.get('/api/dashboard/recent')
    ])
      .then(([s, r]) => {
        setStats(s.data);
        setActivity(r.data.activity || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div className="page-container">
      

      {/* ✅ FIXED GRID */}
      {stats && (
        <div className="grid-2" style={{ marginBottom: 32 }}>
          <StatCard label="Documents" value={stats.totalDocuments} icon="📄" color="#ffedd5" />
          <StatCard label="Study Notes" value={stats.totalNotes} icon="📝" color="#dbeafe" />
          <StatCard label="Mind Maps" value={stats.totalMindMaps} icon="🗺" color="#ede9fe" />
          <StatCard label="Quizzes" value={stats.totalQuizzes} icon="🎯" color="#d1fae5" />
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Recent Activity
        </h3>

        {activity.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            No activity yet. Upload a document to get started!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activity.map((item, i) => {
              const info = typeInfo[item.type] || typeInfo.document;

              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < activity.length - 1
                    ? '1px solid var(--color-border)'
                    : 'none'
                }}>
                  <span style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: info.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {info.icon}
                  </span>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {info.label} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}