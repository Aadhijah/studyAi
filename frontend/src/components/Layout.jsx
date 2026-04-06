import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/upload',  label: 'Upload' },
  { to: '/notes',  label: 'Notes' },
  { to: '/quiz',  label: 'Quizzes' },
  { to: '/mindmap',  label: 'Mind Maps' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">StudyAI</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%', marginTop: 10 }}>Sign Out</button>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
