import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
=======
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SessionInviteListener from './components/SessionInviteListener';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

// Pages
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Sessions from './pages/Sessions';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
=======
import TokenHistory from './pages/TokenHistory';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

// Components
import WatchDemo from './components2/WatchDemo';

// Learning Pages
<<<<<<< HEAD
import StartLearning from './pages/StartLearning';
=======
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
import Session from './pages/Session';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
<<<<<<< HEAD
=======
          <SessionInviteListener />
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
          <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/watchdemo" element={<WatchDemo />} />

<<<<<<< HEAD
            <Route path="/start-learning" element={<StartLearning />} />
=======
            <Route path="/start-learning" element={<Navigate to="/dashboard" replace />} />
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
            <Route path="/session/:sessionId" element={<Session />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/sessions" element={<Sessions />} />
<<<<<<< HEAD
=======
            <Route path="/token-history" element={<TokenHistory />} />
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
