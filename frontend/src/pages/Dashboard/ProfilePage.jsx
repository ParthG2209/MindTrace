// src/pages/Dashboard/ProfilePage.jsx - GLASSMORPHISM UPDATED
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Calendar, Award, Video, TrendingUp,
  Edit2, Save, X, Camera
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { sessionApi, evaluationApi } from '../../api/client';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    totalEvaluations: 0,
    joinDate: null
  });
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setFormData({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
        });
        fetchUserStats();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserStats = async () => {
    try {
      const [sessionsRes, evaluationsRes] = await Promise.all([
        sessionApi.getAll(),
        evaluationApi.getAll()
      ]);

      const avgScore = evaluationsRes.data.length > 0
        ? evaluationsRes.data.reduce((sum, e) => sum + e.overall_score, 0) / evaluationsRes.data.length
        : 0;

      setStats({
        totalSessions: sessionsRes.data.length,
        averageScore: avgScore,
        totalEvaluations: evaluationsRes.data.length,
        joinDate: auth.currentUser?.metadata?.creationTime
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (formData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: formData.displayName
        });
      }

      if (formData.email !== currentUser.email) {
        await updateEmail(currentUser, formData.email);
      }

      setUser({ ...currentUser, displayName: formData.displayName, email: formData.email });
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName || '',
      email: user.email || '',
    });
    setEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all">
        {/* Header Section with Gradient */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Content */}
        <div className="relative px-8 pb-8">
          {/* Avatar */}
          

          {/* Edit Button */}
          <div className="flex justify-end pt-4">
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user.displayName || 'Not set'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Member Since
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-white">{formatDate(stats.joinDate)}</span>
                </div>
              </div>

              {/* Email Verified */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Status
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  {user.emailVerified ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-white">Verified</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span className="text-white">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
              <Video className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400">Total Sessions</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
        </GlassCard>

        <GlassCard className="hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg backdrop-blur-sm">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Average Score</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.averageScore.toFixed(1)}</p>
        </GlassCard>

        <GlassCard className="hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">Evaluations</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalEvaluations}</p>
        </GlassCard>

        <GlassCard className="hover:bg-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm text-gray-400">Days Active</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.joinDate ? Math.floor((new Date() - new Date(stats.joinDate)) / (1000 * 60 * 60 * 24)) : 0}
          </p>
        </GlassCard>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm">
            <Award className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Account Information</h3>
            <p className="text-gray-300 mb-4">
              Your MindTrace account gives you access to powerful AI-powered mentor evaluation tools. 
              Keep your profile updated to personalize your experience.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400 backdrop-blur-sm">
                Premium Features
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400 backdrop-blur-sm">
                Unlimited Sessions
              </span>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-400 backdrop-blur-sm">
                AI Analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;