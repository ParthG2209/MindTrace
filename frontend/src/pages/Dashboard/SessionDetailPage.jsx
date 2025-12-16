// frontend/src/pages/Dashboard/SessionDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Video, Clock, Calendar, User, 
  TrendingUp, Play, Loader, CheckCircle
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
      alert('Failed to start evaluation');
    } finally {
      setEvaluating(false);
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

        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getStatusColor(session.status)} text-white font-semibold flex items-center gap-2 shadow-lg`}>
          {session.status === 'completed' && <CheckCircle className="w-5 h-5" />}
          {['transcribing', 'analyzing'].includes(session.status) && (
            <Loader className="w-5 h-5 animate-spin" />
          )}
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
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

          {/* Tabs - GLASSMORPHISM */}
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

            {/* Tab Content - ALL GLASSMORPHISM */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <ExplanationGraph 
                    segments={evaluation.segments} 
                    sessionId={sessionId}
                    coherenceData={coherence} 
                  />
                  
                  {/* Strengths & Weaknesses - GLASSMORPHISM */}
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
                <div className="space-y-3">
                  {evaluation.segments.map((segment) => (
                    <div
                      key={segment.segment_id}
                      className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="p-4 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="text-xs font-medium text-gray-400 mr-2">
                                Segment {segment.segment_id + 1}
                              </span>
                              <div className={`w-2 h-2 rounded-full ${
                                segment.overall_segment_score >= 8 ? 'bg-green-500' : 
                                segment.overall_segment_score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2">{segment.text}</p>
                          </div>
                          <div className="flex items-center ml-4">
                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                              segment.overall_segment_score >= 8 
                                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                : segment.overall_segment_score >= 5 
                                ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                : 'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>
                              {segment.overall_segment_score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};

export default SessionDetailPage;