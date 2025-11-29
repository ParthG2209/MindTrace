import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MentorDashboard from './pages/MentorDashboard.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import SessionDetailPage from './pages/SessionDetailPage.jsx';
import DemoOne from './pages/DemoOne.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<MentorDashboard />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/demo-one" element={<DemoOne />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;