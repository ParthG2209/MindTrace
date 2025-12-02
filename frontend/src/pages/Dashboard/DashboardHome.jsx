// src/pages/Dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Video, Award, ArrowRight,
  CheckCircle, AlertCircle, Activity
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

  // Sample data for charts
  const salesOverviewData = [
    { month: 'Jan', value1: 250, value2: 180 },
    { month: 'Feb', value1: 300, value2: 220 },
    { month: 'Mar', value1: 280, value2: 240 },
    { month: 'Apr', value1: 400, value2: 320 },
    { month: 'May', value1: 380, value2: 300 },
    { month: 'Jun', value1: 450, value2: 380 },
    { month: 'Jul', value1: 420, value2: 360 },
    { month: 'Aug', value1: 500, value2: 420 },
    { month: 'Sep', value1: 480, value2: 400 },
    { month: 'Oct', value1: 550, value2: 460 },
    { month: 'Nov', value1: 600, value2: 500 },
    { month: 'Dec', value1: 650, value2: 540 }
  ];

  const activeUsersData = [
    { category: 'Users', value: 32000 },
    { category: 'Clicks', value: 2400 },
    { category: 'Sales', value: 2400 },
    { category: 'Items', value: 320 }
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
      const avgScore = mentors
        .filter(m => m.average_score)
        .reduce((sum, m) => sum + m.average_score, 0) / (mentors.filter(m => m.average_score).length || 1);

      setStats({
        totalMentors: mentors.length,
        totalSessions: sessions.length,
        averageScore: avgScore || 0,
        completedSessions: completedSessions.length
      });

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
              Ask me anything.
            </p>
            <button
              onClick={() => navigate('/dashboard/sessions')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg"
            >
              Tap to record
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
          <p className="text-gray-400 text-sm mb-8">From all projects</p>
          
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Tracking */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Referral Tracking</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Invited</p>
              <p className="text-2xl font-bold text-white">145 people</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Bonus</p>
              <p className="text-2xl font-bold text-white">1,465</p>
            </div>
          </div>

          {/* Score Circle */}
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradientGreen)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70 * 0.93} ${2 * Math.PI * 70}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm text-gray-400 mb-1">Safety</span>
                <span className="text-3xl font-bold text-white">9.3</span>
                <span className="text-xs text-gray-400">Total Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview Chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Sales overview</h3>
              <p className="text-green-400 text-sm font-medium">(+5) more in 2021</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesOverviewData}>
              <defs>
                <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="value1"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorValue1)"
              />
              <Area
                type="monotone"
                dataKey="value2"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#colorValue2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Active Users</h3>
            <p className="text-green-400 text-sm font-medium">(+23) than last week</p>
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