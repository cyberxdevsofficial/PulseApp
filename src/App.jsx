import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Join from './pages/Join';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { motion } from 'framer-motion';
import BulkStickerUpload from './components/BulkStickerUpload';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', background: '#900' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: 'radial-gradient(circle at center, #0f172a, #020617)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          {/* Pulsing Logo */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 120, height: 120, borderRadius: 36, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          >
            <img src="/logo.png" style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'drop-shadow(0 0 15px var(--primary))' }} PulseApp" />
          </motion.div>
          
          {/* Animated Spinner & Text */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="flex-center" style={{ gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite 0s' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite 0.2s' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite 0.4s' }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', letterSpacing: '4px', opacity: 0.6, textTransform: 'uppercase' }}>PulseApp</div>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.5); opacity: 1; filter: blur(1px); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={!user ? <Landing /> : <Navigate to="/" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/stickers" element={<BulkStickerUpload />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/join/:type/:id" element={<Join />} />
      <Route path="/" element={user ? <Home /> : <Navigate to="/welcome" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
