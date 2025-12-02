import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, LogIn } from 'lucide-react';
import MentorCard from '../components/MentorCard.jsx';
import MindTraceFooter from '../components/ui/mindtrace-footer.jsx';
import { mentorApi } from '../api/client.js';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [mentorStats, setMentorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMentor, setNewMentor] = useState({
    name: '',
    email: '',
    expertise: '',
    bio: '',
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await mentorApi.getAll();
      const mentorList = response.data;
      
      // Normalize mentor IDs - handle both 'id' and '_id'
      const normalizedMentors = mentorList.map(mentor => ({
        ...mentor,
        id: mentor.id || mentor._id
      }));
      
      console.log('Fetched mentors:', normalizedMentors);
      setMentors(normalizedMentors);

      // Fetch stats for each mentor
      const statsPromises = normalizedMentors.map((mentor) =>
        mentorApi.getStats(mentor.id).catch((err) => {
          console.error(`Error fetching stats for mentor ${mentor.id}:`, err);
          return null;
        })
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
      const response = await mentorApi.create(mentorData);
      console.log('Mentor created:', response.data);
      setShowAddModal(false);
      setNewMentor({ name: '', email: '', expertise: '', bio: '' });
      await fetchMentors();
    } catch (error) {
      console.error('Error adding mentor:', error);
      alert('Failed to add mentor: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Mentor Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage mentors and track their teaching performance
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Mentor
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Mentors</p>
            <p className="text-3xl font-bold text-gray-900">{mentors.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900">
              {mentors.reduce((sum, m) => sum + (m.total_sessions || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {mentors.filter((m) => m.average_score).length > 0
                ? (
                    mentors
                      .filter((m) => m.average_score)
                      .reduce((sum, m) => sum + m.average_score, 0) /
                    mentors.filter((m) => m.average_score).length
                  ).toFixed(1)
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Mentor Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading mentors...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No mentors yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first mentor</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Mentor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                stats={mentorStats[mentor.id]}
                onClick={() => {
                  console.log('Navigating to sessions for mentor:', mentor.id);
                  if (!mentor.id) {
                    console.error('Mentor ID is missing!', mentor);
                    alert('Error: Mentor ID is missing');
                    return;
                  }
                  navigate(`/sessions?mentor=${mentor.id}`);
                }}
              />
            ))}
          </div>
        )}

        {/* Add Mentor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Mentor</h2>
              <form onSubmit={handleAddMentor}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMentor.name}
                      onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newMentor.email}
                      onChange={(e) => setNewMentor({ ...newMentor, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expertise (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newMentor.expertise}
                      onChange={(e) => setNewMentor({ ...newMentor, expertise: e.target.value })}
                      placeholder="Python, Machine Learning, Data Science"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={newMentor.bio}
                      onChange={(e) => setNewMentor({ ...newMentor, bio: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Mentor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <MindTraceFooter />
    </div>
  );
};

export default MentorDashboard;