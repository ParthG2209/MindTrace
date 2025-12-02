import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Video, ArrowLeft, AlertCircle } from 'lucide-react';
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
  const [uploadError, setUploadError] = useState('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    topic: '',
    video: null,
  });

  useEffect(() => {
    // Check if mentor ID is provided
    if (!mentorId) {
      console.error('No mentor ID provided');
      navigate('/dashboard');
      return;
    }
    
    console.log('Mentor ID from URL:', mentorId);
    fetchData();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [mentorId, navigate]);

  const fetchData = async () => {
    await Promise.all([fetchSessions(), fetchMentor()]);
  };

  const fetchSessions = async () => {
    if (!mentorId) return;
    
    try {
      const params = { mentor_id: mentorId };
      console.log('Fetching sessions with params:', params);
      const response = await sessionApi.getAll(params);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentor = async () => {
    if (!mentorId) return;
    
    try {
      console.log('Fetching mentor with ID:', mentorId);
      const response = await mentorApi.getById(mentorId);
      setMentor(response.data);
    } catch (error) {
      console.error('Error fetching mentor:', error);
      if (error.response?.status === 404 || error.response?.status === 400) {
        alert('Mentor not found. Redirecting to dashboard...');
        navigate('/dashboard');
      }
    }
  };

  const handleUploadSession = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.video) {
      setUploadError('Please select a video file');
      return;
    }
    
    if (!mentorId) {
      setUploadError('No mentor selected. Please go back and select a mentor.');
      return;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(uploadForm.video.type)) {
      setUploadError('Please select a valid video file (MP4, MOV, AVI, MKV)');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (uploadForm.video.size > maxSize) {
      setUploadError('Video file is too large. Maximum size is 500MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      
      console.log('Uploading session for mentor:', mentorId);
      
      const formData = new FormData();
      formData.append('mentor_id', mentorId);
      formData.append('title', uploadForm.title);
      formData.append('topic', uploadForm.topic);
      formData.append('video', uploadForm.video);

      const response = await sessionApi.create(formData);
      
      console.log('Upload response:', response.data);
      
      if (response.data && response.data.id) {
        setShowUploadModal(false);
        setUploadForm({ title: '', topic: '', video: null });
        setUploadError('');
        await fetchSessions();
        alert('Session uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading session:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        const errorDetail = error.response.data.detail;
        if (typeof errorDetail === 'string') {
          setUploadError(errorDetail);
        } else {
          setUploadError('Failed to upload session. Please try again.');
        }
      } else if (error.request) {
        setUploadError('Network error. Please check your connection and try again.');
      } else {
        setUploadError('Failed to upload session. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      setUploadForm({ ...uploadForm, video: file });
      setUploadError('');
    }
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setUploadForm({ title: '', topic: '', video: null });
    setUploadError('');
  };

  // Show error if no mentor ID
  if (!mentorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Mentor Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select a mentor from the dashboard to view sessions.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Video className="w-8 h-8 mr-3 text-blue-600" />
                {mentor ? `${mentor.name}'s Sessions` : 'Sessions'}
              </h1>
              <p className="text-gray-600 mt-2">
                Upload and manage teaching session videos
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Session
            </button>
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
              Upload your first teaching session to get started
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Session
            </button>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video File *
                    </label>
                    <input
                      type="file"
                      required
                      accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/x-matroska"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {uploadForm.video && (
                      <p className="text-sm text-gray-600 mt-2">
                        Selected: {uploadForm.video.name}
                        <span className="text-gray-400 ml-2">
                          ({(uploadForm.video.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: MP4, MOV, AVI, MKV (Max 500MB)
                    </p>
                  </div>
                  
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {uploadError}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.video}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Upload'
                    )}
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