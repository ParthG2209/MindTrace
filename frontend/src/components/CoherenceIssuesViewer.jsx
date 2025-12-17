import React, { useState, useEffect } from 'react';
import { AlertTriangle, GitBranch, Zap, Loader, TrendingDown } from 'lucide-react';
import apiClient from '../api/client';

const CoherenceIssuesViewer = ({ sessionId, evaluationId, checking, setChecking }) => {
  const [coherence, setCoherence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (sessionId) {
      fetchCoherence();
    }
  }, [sessionId]);

  // Handle polling when checking state is true (persists across unmounts via parent state)
  useEffect(() => {
    let pollInterval;
    if (checking) {
      pollInterval = setInterval(async () => {
        try {
          const response = await apiClient.get(`/api/coherence/${sessionId}`);
          if (response.data) {
            setCoherence(response.data);
            setChecking(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 3000);

      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (checking) setChecking(false);
      }, 60000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [checking, sessionId, setChecking]);

  const fetchCoherence = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/coherence/${sessionId}`);
      setCoherence(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setCoherence(null);
      } else {
        console.error('Error fetching coherence:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCoherence = async () => {
    try {
      setChecking(true);
      await apiClient.post(`/api/coherence/check/${sessionId}`);
      // Polling is handled by the useEffect above
    } catch (error) {
      console.error('Error checking coherence:', error);
      setChecking(false);
      alert('Failed to check coherence');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'major':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'moderate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'minor':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-white/10 text-gray-400 border-white/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mr-3" />
          <span className="text-gray-300">Loading coherence analysis...</span>
        </div>
      </div>
    );
  }

  if (!coherence) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all">
        <div className="text-center">
          <GitBranch className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Coherence Analysis Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Check for contradictions, topic drift, and logical gaps
          </p>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Checking Coherence...
              </>
            ) : (
              <>
                <GitBranch className="w-5 h-5 mr-2" />
                Check Coherence
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const totalIssues = 
    (coherence.contradictions?.length || 0) +
    (coherence.topic_drifts?.length || 0) +
    (coherence.logical_gaps?.length || 0);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <GitBranch className="w-7 h-7 mr-3 text-blue-400" />
              Coherence Analysis
            </h3>
            <p className="text-gray-400 mt-1">
              Logical flow, consistency, and topic focus
            </p>
          </div>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
          >
            {checking ? 'Checking...' : 'Recheck'}
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Session Coherence Score</p>
              <p className={`text-3xl font-bold px-4 py-2 rounded-xl border inline-block backdrop-blur-sm ${getScoreColor(coherence.session_coherence_score)}`}>
                {coherence.session_coherence_score.toFixed(1)}/10
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Issues Found</p>
              <p className="text-3xl font-bold text-white">{totalIssues}</p>
            </div>
          </div>
        </div>

        {coherence.overall_assessment && (
          <div className="bg-blue-500/10 border-l-4 border-blue-500/50 p-4 rounded backdrop-blur-sm">
            <p className="text-sm text-blue-300">{coherence.overall_assessment}</p>
          </div>
        )}
      </div>

      <div className="border-b border-white/10">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Issues ({totalIssues})
          </button>
          <button
            onClick={() => setActiveTab('contradictions')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contradictions'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Contradictions ({coherence.contradictions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('drifts')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'drifts'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Topic Drifts ({coherence.topic_drifts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'gaps'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Logical Gaps ({coherence.logical_gaps?.length || 0})
          </button>
        </div>
      </div>

      <div className="p-6">
        {(activeTab === 'all' || activeTab === 'contradictions') && coherence.contradictions && coherence.contradictions.length > 0 && (
          <div className="mb-6">
            {activeTab === 'all' && (
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                Contradictions
              </h4>
            )}
            <div className="space-y-4">
              {coherence.contradictions.map((item, index) => (
                <div key={index} className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-xl p-4 hover:bg-red-500/20 hover:border-red-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        Segments {item.segment1_id + 1} ↔ {item.segment2_id + 1}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/5 border border-red-500/30 p-3 rounded backdrop-blur-sm">
                      <p className="text-xs text-gray-400 mb-1">Statement 1:</p>
                      <p className="text-sm text-gray-300">"{item.statement1}"</p>
                    </div>

                    <div className="bg-white/5 border border-red-500/30 p-3 rounded backdrop-blur-sm">
                      <p className="text-xs text-gray-400 mb-1">Statement 2:</p>
                      <p className="text-sm text-gray-300">"{item.statement2}"</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <p className="text-sm font-medium text-gray-300 mb-1">Explanation:</p>
                    <p className="text-sm text-gray-400">{item.explanation}</p>
                  </div>

                  {item.resolution && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/30 p-3 rounded backdrop-blur-sm">
                      <p className="text-sm font-medium text-green-400 mb-1">How to resolve:</p>
                      <p className="text-sm text-gray-300">{item.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'drifts') && coherence.topic_drifts && coherence.topic_drifts.length > 0 && (
          <div className="mb-6">
            {activeTab === 'all' && (
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-yellow-400" />
                Topic Drifts
              </h4>
            )}
            <div className="space-y-4">
              {coherence.topic_drifts.map((item, index) => (
                <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm rounded-xl p-4 hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm text-gray-400">Segment {item.segment_id + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        Drift: {(item.drift_degree * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-400">
                        Relevance: {(item.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Expected topic:</p>
                      <p className="text-sm font-medium text-gray-300">{item.expected_topic}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Actual content:</p>
                      <p className="text-sm text-gray-300">{item.actual_content}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-yellow-500/30 p-3 rounded backdrop-blur-sm">
                    <p className="text-sm font-medium text-gray-300 mb-1">Impact:</p>
                    <p className="text-sm text-gray-400">{item.impact}</p>
                  </div>

                  {item.suggestion && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/30 p-3 rounded backdrop-blur-sm">
                      <p className="text-sm font-medium text-green-400 mb-1">Suggestion:</p>
                      <p className="text-sm text-gray-300">{item.suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'gaps') && coherence.logical_gaps && coherence.logical_gaps.length > 0 && (
          <div>
            {activeTab === 'all' && (
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-400" />
                Logical Gaps
              </h4>
            )}
            <div className="space-y-4">
              {coherence.logical_gaps.map((item, index) => (
                <div key={index} className="bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        Between segments {item.between_segment1 + 1} and {item.between_segment2 + 1}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Missing concept:</p>
                    <p className="text-sm text-gray-300">{item.missing_concept}</p>
                  </div>

                  <div className="bg-white/5 border border-purple-500/30 p-3 rounded backdrop-blur-sm mb-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Impact:</p>
                    <p className="text-sm text-gray-400">{item.impact}</p>
                  </div>

                  {item.fill_suggestion && (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 rounded backdrop-blur-sm">
                      <p className="text-sm font-medium text-green-400 mb-1">How to fill this gap:</p>
                      <p className="text-sm text-gray-300">{item.fill_suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {totalIssues === 0 && (
          <div className="text-center py-8">
            <GitBranch className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Excellent Coherence!</h4>
            <p className="text-gray-400">No significant coherence issues found in this session.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoherenceIssuesViewer;