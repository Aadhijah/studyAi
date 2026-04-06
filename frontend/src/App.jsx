import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import Notes from './pages/Notes.jsx';
import NoteDetail from './pages/NoteDetail.jsx';
import Quiz from './pages/Quiz.jsx';
import QuizPlay from './pages/QuizPlay.jsx';
import MindMap from './pages/MindMap.jsx';
import MindMapView from './pages/MindMapView.jsx';
import Layout from './components/Layout.jsx';

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner spinner-dark" /></div>;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="notes" element={<Notes />} />
            <Route path="notes/:id" element={<NoteDetail />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="quiz/:id/play" element={<QuizPlay />} />
            <Route path="mindmap" element={<MindMap />} />
            <Route path="mindmap/:id" element={<MindMapView />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
