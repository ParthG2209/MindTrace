// src/pages/Dashboard/DashboardHome.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Video, Award, ArrowRight,
  CheckCircle, Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { mentorApi, sessionApi, evaluationApi } from '../../api/client';
import { auth } from '../../lib/firebase';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalMentors: 0,
    totalSessions: 0,
    averageScore: 0,
    completedSessions: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample data for active users chart
  const activeUsersData = [
    { category: 'Mentors', value: 0 },
    { category: 'Sessions', value: 0 },
    { category: 'Completed', value: 0 },
    { category: 'Analyzing', value: 0 }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    fetchDashboardData();
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [mentorsRes, sessionsRes] = await Promise.all([
        mentorApi.getAll(),
        sessionApi.getAll()
      ]);

      const mentors = mentorsRes.data;
      const sessions = sessionsRes.data;
      
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const analyzingSessions = sessions.filter(s => ['analyzing', 'transcribing'].includes(s.status));
      const avgScore = mentors
        .filter(m => m.average_score)
        .reduce((sum, m) => sum + m.average_score, 0) / (mentors.filter(m => m.average_score).length || 1);

      setStats({
        totalMentors: mentors.length,
        totalSessions: sessions.length,
        averageScore: avgScore || 0,
        completedSessions: completedSessions.length
      });

      // Update active users data
      activeUsersData[0].value = mentors.length;
      activeUsersData[1].value = sessions.length;
      activeUsersData[2].value = completedSessions.length;
      activeUsersData[3].value = analyzingSessions.length;

      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, percentage, icon: Icon, trend = 'up', color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10 overflow-hidden group hover:border-white/20 transition-all">
        {/* Background Glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? '+' : '-'}{percentage}%
            </span>
            <span className="text-gray-500 text-sm">since last month</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Mentors"
          value={stats.totalMentors}
          percentage="5"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          percentage="4"
          icon={Video}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={stats.completedSessions}
          percentage="14"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Avg Score"
          value={stats.averageScore.toFixed(1)}
          percentage="8"
          icon={Award}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back,
            </h2>
            <h3 className="text-3xl font-bold text-white mb-3">
              {user?.displayName || 'User'}
            </h3>
            <p className="text-white/80 mb-6 max-w-md">
              Glad to see you again!<br />
              Ready to analyze teaching sessions?
            </p>
            <button
              onClick={() => navigate('/dashboard/sessions')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg"
            >
              View Sessions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* Decorative Brain Image Placeholder */}
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-30">
            <div className="w-full h-full bg-gradient-to-tr from-white/20 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Satisfaction Rate</h3>
          </div>
          <p className="text-gray-400 text-sm mb-8">From all evaluations</p>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* Circular Progress */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 80 * 0.95} ${2 * Math.PI * 80}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-4xl font-bold text-white">95%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">0%</span>
            <span className="text-gray-400">100%</span>
          </div>
        </div>
      </div>

      {/* Active Stats */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Platform Statistics</h3>
            <p className="text-green-400 text-sm font-medium">Overall performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activeUsersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {activeUsersData.map((item, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-400">{item.category}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;