// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './components/ui/animated-characters-login-page.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import DashboardHome from './pages/Dashboard/DashboardHome.jsx';
import MentorsPage from './pages/Dashboard/MentorsPage.jsx';
import SessionsPage from './pages/Dashboard/SessionsPage.jsx';
import SessionDetailPage from './pages/Dashboard/SessionDetailPage.jsx';
import AnalyticsPage from './pages/Dashboard/AnalyticsPage.jsx';
import ProfilePage from './pages/Dashboard/ProfilePage.jsx';
import SettingsPage from './pages/Dashboard/SettingsPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;