import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Sessions from './pages/Sessions';

// Components
import WatchDemo from './components2/WatchDemo';

// Learning Pages
import StartLearning from './pages/StartLearning';
import Session from './pages/Session';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/watchdemo" element={<WatchDemo />} />

          <Route path="/start-learning" element={<StartLearning />} />
          <Route path="/session/:sessionId" element={<Session />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/sessions" element={<Sessions />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
