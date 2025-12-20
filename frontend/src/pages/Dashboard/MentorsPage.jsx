// frontend/src/pages/Dashboard/MentorsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, TrendingUp, TrendingDown, Minus, Search, Filter, Trash2, Loader } from 'lucide-react';
import { mentorApi } from '../../api/client';

const MentorsPage = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [mentorStats, setMentorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMentor, setNewMentor] = useState({
    name: '',
    email: '',
    expertise: '',
    bio: '',
  });

  // NEW: Delete mentor state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mentorToDelete, setMentorToDelete] = useState(null);
  const [deletingMentor, setDeletingMentor] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await mentorApi.getAll();
      const mentorList = response.data;

      const normalizedMentors = mentorList.map(mentor => ({
        ...mentor,
        id: mentor.id || mentor._id
      }));

      setMentors(normalizedMentors);

      const statsPromises = normalizedMentors.map((mentor) =>
        mentorApi.getStats(mentor.id).catch(() => null)
      );
      const statsResults = await Promise.all(statsPromises);

      const statsMap = {};
      statsResults.forEach((result, idx) => {
        if (result && result.data) {
          statsMap[normalizedMentors[idx].id] = result.data;
        }
      });
      setMentorStats(statsMap);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    try {
      const mentorData = {
        ...newMentor,
        expertise: newMentor.expertise.split(',').map((s) => s.trim()).filter(s => s),
      };
      await mentorApi.create(mentorData);
      setShowAddModal(false);
      setNewMentor({ name: '', email: '', expertise: '', bio: '' });
      await fetchMentors();
    } catch (error) {
      console.error('Error adding mentor:', error);
      alert('Failed to add mentor: ' + (error.response?.data?.detail || error.message));
    }
  };

  // NEW: Delete mentor handler
  const handleDeleteMentor = async () => {
    if (!mentorToDelete) return;

    try {
      setDeletingMentor(mentorToDelete.id);
      await mentorApi.delete(mentorToDelete.id);
      setShowDeleteModal(false);
      setMentorToDelete(null);
      await fetchMentors();
    } catch (error) {
      console.error('Error deleting mentor:', error);
      alert('Failed to delete mentor: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDeletingMentor(null);
    }
  };

  // NEW: Open delete modal
  const openDeleteModal = (mentor, e) => {
    e.stopPropagation();
    setMentorToDelete(mentor);
    setShowDeleteModal(true);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-500 to-green-600';
    if (score >= 6) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  const MentorCard = ({ mentor, stats }) => (
    <div className="group bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => navigate(`/dashboard/sessions?mentor=${mentor.id}`)}
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {mentor.name}
              </h3>
              <p className="text-sm text-gray-400">{mentor.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats && getTrendIcon(stats.recent_trend)}
            {/* NEW: Delete Button */}
            <button
              onClick={(e) => openDeleteModal(mentor, e)}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 opacity-0 group-hover:opacity-100"
              title="Delete Mentor"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p 
            className="text-sm text-gray-400 mb-4 line-clamp-2 cursor-pointer"
            onClick={() => navigate(`/dashboard/sessions?mentor=${mentor.id}`)}
          >
            {mentor.bio}
          </p>
        )}

        {/* Expertise Tags */}
        {mentor.expertise && mentor.expertise.length > 0 && (
          <div 
            className="flex flex-wrap gap-2 mb-4 cursor-pointer"
            onClick={() => navigate(`/dashboard/sessions?mentor=${mentor.id}`)}
          >
            {mentor.expertise.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20"
              >
                {skill}
              </span>
            ))}
            {mentor.expertise.length > 3 && (
              <span className="px-3 py-1 text-xs font-medium bg-white/5 text-gray-400 rounded-full border border-white/10">
                +{mentor.expertise.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats Footer */}
        <div 
          className="flex items-center justify-between pt-4 border-t border-white/10 cursor-pointer"
          onClick={() => navigate(`/dashboard/sessions?mentor=${mentor.id}`)}
        >
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Sessions</p>
            <p className="text-xl font-bold text-white">
              {stats?.total_sessions || mentor.total_sessions || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Average Score</p>
            {stats?.average_score || mentor.average_score ? (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${getScoreColor(stats?.average_score || mentor.average_score)}`}>
                <span className="text-xl font-bold text-white">
                  {(stats?.average_score || mentor.average_score).toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="text-xl text-gray-500">N/A</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mentors</h1>
          <p className="text-gray-400 mt-1">Manage and track mentor performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-5 h-5" />
          Add Mentor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Total Mentors</p>
          <p className="text-4xl font-bold text-white">{mentors.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Total Sessions</p>
          <p className="text-4xl font-bold text-white">
            {mentors.reduce((sum, m) => sum + (m.total_sessions || 0), 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Average Score</p>
          <p className="text-4xl font-bold text-white">
            {mentors.filter((m) => m.average_score).length > 0
              ? (
                mentors
                  .filter((m) => m.average_score)
                  .reduce((sum, m) => sum + m.average_score, 0) /
                mentors.filter((m) => m.average_score).length
              ).toFixed(1)
              : 'N/A'}
          </p>
        </GlassCard>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          />
        </div>
        <button className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-colors backdrop-blur-sm">
          <Filter className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Mentors Grid */}
      {filteredMentors.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No mentors found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first mentor'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Mentor
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              stats={mentorStats[mentor.id]}
            />
          ))}
        </div>
      )}

      {/* Add Mentor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Mentor</h2>
            <form onSubmit={handleAddMentor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMentor.name}
                  onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                  placeholder="Enter mentor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newMentor.email}
                  onChange={(e) => setNewMentor({ ...newMentor, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                  placeholder="mentor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expertise (comma-separated)
                </label>
                <input
                  type="text"
                  value={newMentor.expertise}
                  onChange={(e) => setNewMentor({ ...newMentor, expertise: e.target.value })}
                  placeholder="Python, Machine Learning, Data Science"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={newMentor.bio}
                  onChange={(e) => setNewMentor({ ...newMentor, bio: e.target.value })}
                  rows="3"
                  placeholder="Tell us about this mentor..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Add Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Delete Confirmation Modal */}
      {showDeleteModal && mentorToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Delete Mentor</h2>
                <p className="text-gray-300">
                  Are you sure you want to delete <strong>{mentorToDelete.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-300">
                <strong>Warning:</strong> Deleting this mentor will:
              </p>
              <ul className="text-sm text-gray-300 mt-2 ml-4 list-disc">
                <li>Remove all mentor information</li>
                <li>Keep their sessions (but unlink the mentor)</li>
                <li>Remove them from analytics</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMentorToDelete(null);
                }}
                disabled={deletingMentor}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMentor}
                disabled={deletingMentor}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingMentor ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Mentor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorsPage;