import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Video, Award, CheckCircle, Activity, 
  ArrowUpRight, Clock, Calendar, MoreVertical
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { mentorApi, sessionApi } from '../../api/client';
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

  // Chart Data
  const [activeUsersData, setActiveUsersData] = useState([
    { category: 'Mentors', value: 0, color: '#3b82f6' },
    { category: 'Sessions', value: 0, color: '#8b5cf6' },
    { category: 'Completed', value: 0, color: '#10b981' },
    { category: 'Processing', value: 0, color: '#f59e0b' }
  ]);

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
      const sessions = sessionsRes.data; // Assuming this is an array of session objects
      
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const analyzingSessions = sessions.filter(s => ['analyzing', 'transcribing'].includes(s.status));
      
      // Calculate Average Score
      const mentorsWithScores = mentors.filter(m => m.average_score);
      const avgScore = mentorsWithScores.length > 0
        ? mentorsWithScores.reduce((sum, m) => sum + m.average_score, 0) / mentorsWithScores.length
        : 0;

      setStats({
        totalMentors: mentors.length,
        totalSessions: sessions.length,
        averageScore: avgScore,
        completedSessions: completedSessions.length
      });

      // Update Chart Data
      setActiveUsersData([
        { category: 'Mentors', value: mentors.length, color: '#3b82f6' }, // Blue
        { category: 'Sessions', value: sessions.length, color: '#8b5cf6' }, // Purple
        { category: 'Completed', value: completedSessions.length, color: '#10b981' }, // Emerald
        { category: 'Processing', value: analyzingSessions.length, color: '#f59e0b' } // Amber
      ]);

      // Sort by date (newest first) and take top 5
      const sortedSessions = [...sessions].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentSessions(sortedSessions.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Status Colors in Recent Sessions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'analyzing': 
      case 'transcribing': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => (
    <GlassCard className="relative overflow-hidden group hover:bg-white/10 transition-colors">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-400">{title}</span>
        </div>
        <div className="flex items-end gap-3">
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <div className={`flex items-center text-xs font-medium mb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : null}
            <span>{trendValue}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">
            Welcome back, <span className="text-white font-medium">{user?.displayName || 'User'}</span>. Here's what's happening today.
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/sessions')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2 w-fit"
        >
          <Video className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* 1. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mentors"
          value={stats.totalMentors}
          icon={Users}
          trend="up"
          trendValue="+12%"
          colorClass="text-blue-500"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={Video}
          trend="up"
          trendValue="+5%"
          colorClass="text-purple-500"
        />
        <StatCard
          title="Avg. Score"
          value={stats.averageScore.toFixed(1)}
          icon={Award}
          trend="up"
          trendValue="+0.4"
          colorClass="text-amber-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.totalSessions ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%`}
          icon={CheckCircle}
          trend="up"
          trendValue="+2%"
          colorClass="text-emerald-500"
        />
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Platform Activity</h3>
              <p className="text-sm text-gray-400">Overview of current system metrics</p>
            </div>
            <div className="flex gap-2">
               {/* Legend */}
               {activeUsersData.map((item, i) => (
                 <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.category}
                 </div>
               ))}
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeUsersData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {activeUsersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Satisfaction / Gauge Chart */}
        <GlassCard className="flex flex-col items-center justify-center relative">
          <h3 className="absolute top-6 left-6 text-lg font-semibold text-white">Satisfaction</h3>
          <div className="relative w-48 h-48 mt-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="url(#satisfaction-gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70 * 0.92} ${2 * Math.PI * 70}`}
                strokeLinecap="round"
                className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
              <defs>
                <linearGradient id="satisfaction-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white tracking-tighter">92%</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mt-1">Excellent</span>
            </div>
          </div>
          <div className="w-full mt-8 px-4">
             <div className="flex justify-between text-xs text-gray-400 mb-2">
               <span>Based on last 30 days</span>
               <span className="text-green-400">+2.4%</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-[92%] rounded-full"></div>
             </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Recent Sessions List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          <button 
            onClick={() => navigate('/dashboard/sessions')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-300 font-medium">
              <tr>
                <th className="px-6 py-4">Session Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {session.title || 'Untitled Session'}
                      <div className="text-xs text-gray-500 font-normal mt-0.5">{session.topic || 'No topic'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                         {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/dashboard/sessions/${session.id}`)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No recent sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardHome;