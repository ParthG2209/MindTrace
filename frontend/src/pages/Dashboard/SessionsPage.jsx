// frontend/src/pages/Dashboard/SessionsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, Video, ArrowLeft, Search, Filter,
  Clock, Calendar, CheckCircle, Loader, XCircle, User, Trash2, MoreVertical
} from 'lucide-react';
import { sessionApi, mentorApi } from '../../api/client';

const SessionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get('mentor');

  const [sessions, setSessions] = useState([]);
  const [allMentors, setAllMentors] = useState({});
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingSession, setDeletingSession] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    topic: '',
    video: null,
    selectedMentorId: mentorId || '',
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [mentorId]);

  const fetchData = async () => {
    await Promise.all([fetchSessions(), fetchAllMentors(), mentorId && fetchMentor()]);
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
    if (!mentorId) return;
    try {
      const response = await mentorApi.getById(mentorId);
      setMentor(response.data);
    } catch (error) {
      console.error('Error fetching mentor:', error);
    }
  };

  const fetchAllMentors = async () => {
    try {
      const response = await mentorApi.getAll();
      const mentorsMap = {};
      response.data.forEach(m => {
        const id = m.id || m._id;
        mentorsMap[id] = m.name;
      });
      setAllMentors(mentorsMap);
    } catch (error) {
      console.error('Error fetching all mentors:', error);
    }
  };

  const handleUploadSession = async (e) => {
    e.preventDefault();

    if (!uploadForm.video) {
      setUploadError('Please select a video file');
      return;
    }

    if (!uploadForm.selectedMentorId) {
      setUploadError('Please select a mentor');
      return;
    }

    const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(uploadForm.video.type)) {
      setUploadError('Please select a valid video file (MP4, MOV, AVI, MKV)');
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (uploadForm.video.size > maxSize) {
      setUploadError('Video file is too large. Maximum size is 500MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('mentor_id', uploadForm.selectedMentorId);
      formData.append('title', uploadForm.title);
      formData.append('topic', uploadForm.topic);
      formData.append('video', uploadForm.video);

      const response = await sessionApi.create(formData);

      if (response.data && response.data.id) {
        setShowUploadModal(false);
        setUploadForm({ title: '', topic: '', video: null, selectedMentorId: mentorId || '' });
        setUploadError('');
        await fetchSessions();
        alert('Session uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading session:', error);
      if (error.response) {
        setUploadError(error.response.data.detail || 'Failed to upload session');
      } else if (error.request) {
        setUploadError('Network error. Please check your connection');
      } else {
        setUploadError('Failed to upload session');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      setDeletingSession(sessionToDelete);
      await sessionApi.delete(sessionToDelete);
      setShowDeleteModal(false);
      setSessionToDelete(null);
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDeletingSession(null);
    }
  };

  const openDeleteModal = (sessionId, e) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  };

  const getStatusConfig = (status) => {
    const configs = {
      uploaded: { icon: Video, text: 'Uploaded', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' },
      transcribing: { icon: Loader, text: 'Transcribing', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', animate: true },
      analyzing: { icon: Loader, text: 'Analyzing', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', animate: true },
      completed: { icon: CheckCircle, text: 'Completed', bgColor: 'bg-green-500/10', textColor: 'text-green-400', borderColor: 'border-green-500/20' },
      failed: { icon: XCircle, text: 'Failed', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20' },
    };
    return configs[status] || configs.uploaded;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  const SessionCard = ({ session }) => {
    const statusConfig = getStatusConfig(session.status);
    const StatusIcon = statusConfig.icon;
    const sessionIdStr = session.id || session._id;

    return (
      <div className="group bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/dashboard/sessions/${sessionIdStr}`)}
            >
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                {session.title}
              </h3>
              <p className="text-sm text-gray-400">{session.topic}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.textColor} ${statusConfig.animate ? 'animate-spin' : ''}`} />
                <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                  {statusConfig.text}
                </span>
              </div>
              <button
                onClick={(e) => openDeleteModal(sessionIdStr, e)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 opacity-0 group-hover:opacity-100"
                title="Delete Session"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div 
            className="flex items-center gap-4 text-sm text-gray-400 mb-4 cursor-pointer"
            onClick={() => navigate(`/dashboard/sessions/${sessionIdStr}`)}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(session.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(session.created_at)}</span>
            </div>
          </div>

          {/* Mentor Info */}
          {allMentors[session.mentor_id] && (
            <div 
              className="pt-3 border-t border-white/10 flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(`/dashboard/sessions/${sessionIdStr}`)}
            >
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-300">{allMentors[session.mentor_id]}</span>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {mentorId && (
              <button
                onClick={() => navigate('/dashboard/mentors')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {mentor ? `${mentor.name}'s Sessions` : 'All Sessions'}
            </h1>
          </div>
          <p className="text-gray-400 ml-14">Upload and manage teaching session videos</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Upload className="w-5 h-5" />
          Upload Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Total Sessions</p>
          <p className="text-4xl font-bold text-white">{sessions.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Completed</p>
          <p className="text-4xl font-bold text-green-400">
            {sessions.filter(s => s.status === 'completed').length}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Processing</p>
          <p className="text-4xl font-bold text-blue-400">
            {sessions.filter(s => ['transcribing', 'analyzing'].includes(s.status)).length}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-400 mb-2">Failed</p>
          <p className="text-4xl font-bold text-red-400">
            {sessions.filter(s => s.status === 'failed').length}
          </p>
        </GlassCard>
      </div>

      {/* Search and Filter - FIXED OPACITY */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="analyzing">Analyzing</option>
          <option value="transcribing">Transcribing</option>
          <option value="uploaded">Uploaded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Video className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {searchQuery || filterStatus !== 'all' ? 'No sessions found' : 'No sessions yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first teaching session to get started'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Session
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard key={session.id || session._id} session={session} />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Upload Teaching Session</h2>
            <form onSubmit={handleUploadSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Mentor *
                </label>
                <select
                  required
                  value={uploadForm.selectedMentorId}
                  onChange={(e) => setUploadForm({ ...uploadForm, selectedMentorId: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                >
                  <option value="">Choose a mentor...</option>
                  {Object.entries(allMentors).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g., Python Decorators Explained"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.topic}
                  onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                  placeholder="e.g., Python Programming"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video File *
                </label>
                <input
                  type="file"
                  required
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/x-matroska"
                  onChange={(e) => setUploadForm({ ...uploadForm, video: e.target.files[0] })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer transition-all backdrop-blur-sm"
                />
                {uploadForm.video && (
                  <p className="text-sm text-gray-400 mt-2">
                    Selected: {uploadForm.video.name}
                    <span className="text-gray-500 ml-2">
                      ({(uploadForm.video.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Supported: MP4, MOV, AVI, MKV (Max 500MB)
                </p>
              </div>

              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {uploadError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ title: '', topic: '', video: null, selectedMentorId: mentorId || '' });
                    setUploadError('');
                  }}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium disabled:opacity-50 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadForm.video}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Delete Session</h2>
                <p className="text-gray-300">
                  Are you sure you want to delete this session? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                disabled={deletingSession}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deletingSession}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingSession ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
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

export default SessionsPage;