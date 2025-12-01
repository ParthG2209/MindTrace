import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Award, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import MetricCard from '../components/MetricCard.jsx';
import SegmentList from '../components/SegmentList.jsx';
import ExplanationGraph from '../components/ExplanationGraph.jsx';
import EvidencePanel from '../components/EvidencePanel.jsx';
import RewriteComparison from '../components/RewriteComparison.jsx';
import CoherenceIssuesViewer from '../components/CoherenceIssuesViewer.jsx';
import { sessionApi, evaluationApi } from '../api/client.js';

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const sessionResponse = await sessionApi.getById(sessionId);
      setSession(sessionResponse.data);

      if (sessionResponse.data.status === 'completed' && sessionResponse.data.evaluation_id) {
        try {
          const evalResponse = await evaluationApi.getBySessionId(sessionId);
          setEvaluation(evalResponse.data);
        } catch (error) {
          console.error('Error fetching evaluation:', error);
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
      const pollInterval = setInterval(async () => {
        const response = await sessionApi.getById(sessionId);
        setSession(response.data);
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          clearInterval(pollInterval);
          setEvaluating(false);
          fetchSessionData();
        }
      }, 3000);
    } catch (error) {
      console.error('Error starting evaluation:', error);
      alert('Failed to start evaluation');
      setEvaluating(false);
    }
  };

  const getOverallScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <button
            onClick={() => navigate('/sessions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sessions
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
            onClick={() => navigate('/sessions')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sessions
          </button>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.title}</h1>
                <p className="text-gray-600">{session.topic}</p>
                <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
                  <span>Created: {new Date(session.created_at).toLocaleDateString()}</span>
                  {session.duration && <span>Duration: {Math.floor(session.duration / 60)}m</span>}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {session.status === 'uploaded' && (
                  <button
                    onClick={handleStartEvaluation}
                    disabled={evaluating}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {evaluating ? 'Starting...' : 'Start Evaluation'}
                  </button>
                )}
                {session.status === 'completed' && (
                  <button
                    onClick={handleStartEvaluation}
                    className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Re-run Evaluation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {(session.status === 'transcribing' || session.status === 'analyzing') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {session.status === 'transcribing' ? 'Transcribing...' : 'Analyzing...'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {session.status === 'transcribing'
                    ? 'Converting your video to text transcript'
                    : 'Evaluating teaching quality with AI'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Failed Status */}
        {session.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Evaluation Failed</h3>
                <p className="text-red-700 text-sm">
                  There was an error processing this session. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && session.status === 'completed' && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Overview
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('segments')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'segments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Segments
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'evidence'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Evidence
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('rewrites')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'rewrites'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Rewrites
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('coherence')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${activeTab === 'coherence'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Coherence
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Overall Score */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-gray-200 text-center">
                  <Award className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Teaching Score</h2>
                  <div className={`inline-block px-8 py-4 rounded-xl border-2 ${getOverallScoreColor(evaluation.overall_score)}`}>
                    <span className="text-5xl font-bold">{evaluation.overall_score.toFixed(1)}</span>
                    <span className="text-2xl ml-2">/10</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <MetricCard
                    title="Clarity"
                    score={evaluation.metrics.clarity}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Structure"
                    score={evaluation.metrics.structure}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Correctness"
                    score={evaluation.metrics.correctness}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Pacing"
                    score={evaluation.metrics.pacing
                    }
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Communication"
                    score={evaluation.metrics.communication}
                    icon={TrendingUp}
                  />
                </div>
                {/* Visualization */}
                <div className="mb-8">
                  <ExplanationGraph segments={evaluation.segments} />
                </div>
              </>
            )}

            {activeTab === 'segments' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Segment-by-Segment Analysis
                </h2>
                <SegmentList segments={evaluation.segments} />
              </div>
            )}

            {activeTab === 'evidence' && (
              <EvidencePanel
                evaluationId={evaluation.id}
                sessionId={sessionId}
              />
            )}

            {activeTab === 'rewrites' && (
              <RewriteComparison
                sessionId={sessionId}
                evaluationId={evaluation.id}
              />
            )}

            {activeTab === 'coherence' && (
              <CoherenceIssuesViewer
                sessionId={sessionId}
                evaluationId={evaluation.id}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default SessionDetailPage;