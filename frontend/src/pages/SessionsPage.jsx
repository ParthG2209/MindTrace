import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Video, ArrowLeft } from 'lucide-react';
import SessionCard from '../components/SessionCard.jsx';
import { sessionApi, mentorApi } from '../api/client.js';

const SessionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get('mentor');

  const [sessions, setSessions] = useState([]);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    topic: '',
    video: null,
  });

  useEffect(() => {
    fetchData();
    // Poll for session updates every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [mentorId]);

  const fetchData = async () => {
    await Promise.all([fetchSessions(), fetchMentor()]);
  };

  const fetchSessions = async () => {
    try {
      const params = mentorId ? { mentor_id: mentorId } : {};
      const response = await sessionApi.getAll(params);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentor = async () => {
    if (mentorId) {
      try {
        const response = await mentorApi.getById(mentorId);
        setMentor(response.data);
      } catch (error) {
        console.error('Error fetching mentor:', error);
      }
    }
  };

  const handleUploadSession = async (e) => {
    e.preventDefault();
    if (!uploadForm.video || !mentorId) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('mentor_id', mentorId);
      formData.append('title', uploadForm.title);
      formData.append('topic', uploadForm.topic);
      formData.append('video', uploadForm.video);

      await sessionApi.create(formData);
      setShowUploadModal(false);
      setUploadForm({ title: '', topic: '', video: null });
      fetchSessions();
    } catch (error) {
      console.error('Error uploading session:', error);
      alert('Failed to upload session');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Video className="w-8 h-8 mr-3 text-blue-600" />
                {mentor ? `${mentor.name}'s Sessions` : 'All Sessions'}
              </h1>
              <p className="text-gray-600 mt-2">
                Upload and manage teaching session videos
              </p>
            </div>
            {mentorId && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Session
              </button>
            )}
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-600 mb-6">
              {mentorId
                ? 'Upload your first teaching session to get started'
                : 'Select a mentor to upload sessions'}
            </p>
            {mentorId && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Session
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => navigate(`/sessions/${session.id}`)}
              />
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Upload Teaching Session
              </h2>
              <form onSubmit={handleUploadSession}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, title: e.target.value })
                      }
                      placeholder="e.g., Python Decorators Explained"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.topic}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, topic: e.target.value })
                      }
                      placeholder="e.g., Python Programming"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video File *
                    </label>
                    <input
                      type="file"
                      required
                      accept="video/*"
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, video: e.target.files[0] })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {uploadForm.video && (
                      <p className="text-sm text-gray-500 mt-1">
                        Selected: {uploadForm.video.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;