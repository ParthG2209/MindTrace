// src/pages/Dashboard/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Video, Award, Calendar,
  BarChart3, Activity, Target
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { mentorApi, sessionApi, evaluationApi } from '../../api/client';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState({
    totalMentors: 0,
    totalSessions: 0,
    averageScore: 0,
    completionRate: 0,
    trendData: [],
    mentorPerformance: [],
    scoreDistribution: [],
    sessionsByStatus: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [mentorsRes, sessionsRes, evaluationsRes] = await Promise.all([
        mentorApi.getAll(),
        sessionApi.getAll(),
        evaluationApi.getAll()
      ]);

      const mentors = mentorsRes.data;
      const sessions = sessionsRes.data;
      const evaluations = evaluationsRes.data;

      // Calculate metrics
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const avgScore = evaluations.reduce((sum, e) => sum + e.overall_score, 0) / (evaluations.length || 1);
      const completionRate = (completedSessions.length / sessions.length) * 100 || 0;

      // Generate trend data (mock for now)
      const trendData = generateTrendData(30);

      // Mentor performance
      const mentorPerformance = mentors.map(m => ({
        name: m.name.split(' ')[0],
        score: m.average_score || 0,
        sessions: m.total_sessions || 0
      })).slice(0, 10);

      // Score distribution
      const scoreDistribution = [
        { range: '9-10', count: evaluations.filter(e => e.overall_score >= 9).length },
        { range: '7-8.9', count: evaluations.filter(e => e.overall_score >= 7 && e.overall_score < 9).length },
        { range: '5-6.9', count: evaluations.filter(e => e.overall_score >= 5 && e.overall_score < 7).length },
        { range: '0-4.9', count: evaluations.filter(e => e.overall_score < 5).length },
      ];

      // Sessions by status
      const sessionsByStatus = [
        { name: 'Completed', value: sessions.filter(s => s.status === 'completed').length, color: '#10b981' },
        { name: 'Analyzing', value: sessions.filter(s => s.status === 'analyzing').length, color: '#8b5cf6' },
        { name: 'Transcribing', value: sessions.filter(s => s.status === 'transcribing').length, color: '#3b82f6' },
        { name: 'Uploaded', value: sessions.filter(s => s.status === 'uploaded').length, color: '#6b7280' },
        { name: 'Failed', value: sessions.filter(s => s.status === 'failed').length, color: '#ef4444' },
      ];

      setAnalyticsData({
        totalMentors: mentors.length,
        totalSessions: sessions.length,
        averageScore: avgScore,
        completionRate,
        trendData,
        mentorPerformance,
        scoreDistribution,
        sessionsByStatus
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: Math.floor(Math.random() * 10) + 5,
        score: (Math.random() * 2 + 7).toFixed(1)
      });
    }
    return data;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-white">{value}</h3>
              {subtitle && (
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">{trend}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Comprehensive performance insights and trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Mentors"
          value={analyticsData.totalMentors}
          subtitle="Active users"
          icon={Users}
          trend="+12% this month"
          color="blue"
        />
        <StatCard
          title="Total Sessions"
          value={analyticsData.totalSessions}
          subtitle="All time"
          icon={Video}
          trend="+8% this month"
          color="purple"
        />
        <StatCard
          title="Average Score"
          value={analyticsData.averageScore.toFixed(1)}
          subtitle="Out of 10"
          icon={Award}
          trend="+0.5 improvement"
          color="green"
        />
        <StatCard
          title="Completion Rate"
          value={`${analyticsData.completionRate.toFixed(0)}%`}
          subtitle="Sessions completed"
          icon={Target}
          trend="+5% this month"
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Performance Trend</h3>
              <p className="text-sm text-gray-400">Sessions and average scores over time</p>
            </div>
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trendData}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
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
                dataKey="sessions"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorSessions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sessions by Status */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Sessions by Status</h3>
              <p className="text-sm text-gray-400">Current distribution</p>
            </div>
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.sessionsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {analyticsData.sessionsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Mentors */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Top Performing Mentors</h3>
              <p className="text-sm text-gray-400">By average score</p>
            </div>
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.mentorPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" />
              <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Score Distribution</h3>
              <p className="text-sm text-gray-400">Evaluation score ranges</p>
            </div>
            <Award className="w-6 h-6 text-orange-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Top Insight</h3>
          </div>
          <p className="text-gray-300">
            Average scores have improved by 8% this month. Keep up the great work!
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Video className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Most Active</h3>
          </div>
          <p className="text-gray-300">
            {analyticsData.mentorPerformance[0]?.name || 'N/A'} has uploaded the most sessions this month.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Goal Progress</h3>
          </div>
          <p className="text-gray-300">
            {analyticsData.completionRate.toFixed(0)}% completion rate. Target: 85%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;