import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SessionInviteListener from './components/SessionInviteListener';

// Pages
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Sessions from './pages/Sessions';
import Dashboard from './pages/Dashboard';
import TokenHistory from './pages/TokenHistory';

// Components
import WatchDemo from './components2/WatchDemo';

// Learning Pages
import Session from './pages/Session';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
          <SessionInviteListener />
          <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/watchdemo" element={<WatchDemo />} />

            <Route path="/start-learning" element={<Navigate to="/dashboard" replace />} />
            <Route path="/session/:sessionId" element={<Session />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/token-history" element={<TokenHistory />} />

            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
