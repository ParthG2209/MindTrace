// frontend/src/pages/Dashboard/SessionDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Video, Clock, Calendar, User, 
  TrendingUp, Play, Loader, CheckCircle, RefreshCw, Trash2, AlertCircle
} from 'lucide-react';
import { sessionApi, evaluationApi, mentorApi } from '../../api/client';
import apiClient from '../../api/client';
import MetricCard from '../../components/MetricCard';
import SegmentList from '../../components/SegmentList';
import ExplanationGraph from '../../components/ExplanationGraph';
import EvidencePanel from '../../components/EvidencePanel';
import RewriteComparison from '../../components/RewriteComparison';
import CoherenceIssuesViewer from '../../components/CoherenceIssuesViewer';

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [coherence, setCoherence] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(() => {
      if (session?.status !== 'completed') {
        fetchSessionData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const sessionRes = await sessionApi.getById(sessionId);
      setSession(sessionRes.data);

      if (sessionRes.data.mentor_id) {
        const mentorRes = await mentorApi.getById(sessionRes.data.mentor_id);
        setMentor(mentorRes.data);
      }

      if (sessionRes.data.evaluation_id || sessionRes.data.status === 'completed') {
        try {
          const evalRes = await evaluationApi.getBySessionId(sessionId);
          setEvaluation(evalRes.data);
          
          try {
            const cohRes = await apiClient.get(`/api/coherence/${sessionId}`);
            setCoherence(cohRes.data);
          } catch (e) {
            console.log("Coherence data not available yet");
          }

        } catch (error) {
          console.error('Evaluation not found:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = async () => {
    try {
      setEvaluating(true);
      await evaluationApi.startEvaluation(sessionId);
      setTimeout(fetchSessionData, 2000);
    } catch (error) {
      console.error('Error starting evaluation:', error);
      alert('Failed to start evaluation: ' + (error.response?.data?.detail || error.message));
    } finally {
      setEvaluating(false);
    }
  };

  const handleRetryEvaluation = async () => {
    if (!window.confirm('Are you sure you want to retry the evaluation? This will re-process the entire session.')) {
      return;
    }
    
    try {
      setEvaluating(true);
      // Update session status back to uploaded
      await sessionApi.update(sessionId, { status: 'uploaded' });
      // Start new evaluation
      await evaluationApi.startEvaluation(sessionId);
      // Reset evaluation state
      setEvaluation(null);
      setTimeout(fetchSessionData, 2000);
    } catch (error) {
      console.error('Error retrying evaluation:', error);
      alert('Failed to retry evaluation: ' + (error.response?.data?.detail || error.message));
    } finally {
      setEvaluating(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      setDeleting(true);
      await sessionApi.delete(sessionId);
      setShowDeleteModal(false);
      navigate(`/dashboard/sessions?mentor=${session.mentor_id}`);
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session: ' + (error.response?.data?.detail || error.message));
      setDeleting(false);
    }
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      uploaded: 'from-gray-500 to-gray-600',
      transcribing: 'from-blue-500 to-blue-600',
      analyzing: 'from-purple-500 to-purple-600',
      completed: 'from-green-500 to-green-600',
      failed: 'from-red-500 to-red-600',
    };
    return colors[status] || colors.uploaded;
  };

  const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'segments', label: 'Segments', show: evaluation },
    { id: 'evidence', label: 'Evidence', show: evaluation },
    { id: 'rewrites', label: 'Rewrites', show: evaluation },
    { id: 'coherence', label: 'Coherence', show: evaluation },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <GlassCard className="text-center p-12">
          <Video className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Session not found</h3>
          <button
            onClick={() => navigate('/dashboard/sessions')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mt-4"
          >
            Back to Sessions
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <button
            onClick={() => navigate(`/dashboard/sessions?mentor=${session.mentor_id}`)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors mt-1 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{session.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>{session.topic}</span>
              </div>
              {mentor && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{mentor.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(session.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getStatusColor(session.status)} text-white font-semibold flex items-center gap-2 shadow-lg`}>
            {session.status === 'completed' && <CheckCircle className="w-5 h-5" />}
            {session.status === 'failed' && <AlertCircle className="w-5 h-5" />}
            {['transcribing', 'analyzing'].includes(session.status) && (
              <Loader className="w-5 h-5 animate-spin" />
            )}
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </div>
          
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
            title="Delete Session"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Evaluation Action */}
      {session.status === 'uploaded' && !evaluation && (
        <GlassCard className="hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Ready for Evaluation</h3>
              <p className="text-gray-300">Start AI-powered analysis of this teaching session</p>
            </div>
            <button
              onClick={handleStartEvaluation}
              disabled={evaluating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Evaluation
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Failed Status - Retry Option */}
      {session.status === 'failed' && (
        <GlassCard className="border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Evaluation Failed</h3>
                <p className="text-gray-300">
                  The evaluation process encountered an error. You can retry the evaluation or delete this session.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryEvaluation}
              disabled={evaluating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
            >
              {evaluating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Retry Evaluation
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Processing Status */}
      {['transcribing', 'analyzing'].includes(session.status) && (
        <GlassCard className="hover:bg-white/10 transition-all">
          <div className="flex items-center gap-4">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {session.status === 'transcribing' ? 'Transcribing Video...' : 'Analyzing Session...'}
              </h3>
              <p className="text-gray-300">
                This may take a few minutes. The page will update automatically.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              title="Overall Score"
              score={evaluation.overall_score}
              icon={TrendingUp}
            />
            <MetricCard
              title="Clarity"
              score={evaluation.metrics.clarity}
            />
            <MetricCard
              title="Structure"
              score={evaluation.metrics.structure}
            />
            <MetricCard
              title="Correctness"
              score={evaluation.metrics.correctness}
            />
            <MetricCard
              title="Pacing"
              score={evaluation.metrics.pacing}
            />
          </div>

          {/* Tabs */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {tabs.filter(tab => tab.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <ExplanationGraph 
                    segments={evaluation.segments} 
                    sessionId={sessionId}
                    coherenceData={coherence} 
                  />
                  
                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-500/10 border border-green-500/20 backdrop-blur-sm rounded-xl p-6 hover:bg-green-500/20 hover:border-green-500/30 transition-all">
                      <h3 className="text-lg font-bold text-green-400 mb-4">Strengths</h3>
                      <ul className="space-y-2">
                        {evaluation.segments
                          .filter(s => s.overall_segment_score >= 8)
                          .slice(0, 3)
                          .map((seg, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span>Segment {seg.segment_id + 1}: {seg.clarity.reason}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm rounded-xl p-6 hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all">
                      <h3 className="text-lg font-bold text-yellow-400 mb-4">Areas for Improvement</h3>
                      <ul className="space-y-2">
                        {evaluation.segments
                          .filter(s => s.overall_segment_score < 7)
                          .slice(0, 3)
                          .map((seg, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-300">
                              <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <span>Segment {seg.segment_id + 1}: {seg.clarity.reason}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'segments' && (
                <SegmentList segments={evaluation.segments} />
              )}

              {activeTab === 'evidence' && (
                <EvidencePanel
                  evaluationId={evaluation._id || evaluation.id}
                  sessionId={sessionId}
                />
              )}

              {activeTab === 'rewrites' && (
                <RewriteComparison
                  sessionId={sessionId}
                  evaluationId={evaluation._id || evaluation.id}
                />
              )}

              {activeTab === 'coherence' && (
                <CoherenceIssuesViewer
                  sessionId={sessionId}
                  evaluationId={evaluation._id || evaluation.id}
                />
              )}
            </div>
          </div>
        </>
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
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-300">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-gray-300 mt-2 ml-4 list-disc">
                <li>Video file</li>
                <li>Transcription data</li>
                <li>Evaluation results</li>
                <li>All associated analytics</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Session
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

export default SessionDetailPage;