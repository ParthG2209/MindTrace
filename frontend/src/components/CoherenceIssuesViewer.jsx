import React, { useState, useEffect } from 'react';
import { AlertTriangle, GitBranch, Zap, Loader, TrendingDown } from 'lucide-react';
import axios from 'axios';

const CoherenceIssuesViewer = ({ sessionId, evaluationId }) => {
  const [coherence, setCoherence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (sessionId) {
      fetchCoherence();
    }
  }, [sessionId]);

  const fetchCoherence = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/coherence/${sessionId}`);
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
      await axios.post(`http://localhost:8000/api/coherence/check/${sessionId}`);
      
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/coherence/${sessionId}`);
          if (response.data) {
            setCoherence(response.data);
            setChecking(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setChecking(false);
      }, 60000);
    } catch (error) {
      console.error('Error checking coherence:', error);
      setChecking(false);
      alert('Failed to check coherence');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-300';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading coherence analysis...</span>
        </div>
      </div>
    );
  }

  if (!coherence) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="text-center">
          <GitBranch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Coherence Analysis Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Check for contradictions, topic drift, and logical gaps
          </p>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <GitBranch className="w-7 h-7 mr-3 text-blue-600" />
              Coherence Analysis
            </h3>
            <p className="text-gray-600 mt-1">
              Logical flow, consistency, and topic focus
            </p>
          </div>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Recheck'}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Session Coherence Score</p>
              <p className={`text-3xl font-bold px-4 py-2 rounded-lg border inline-block ${getScoreColor(coherence.session_coherence_score)}`}>
                {coherence.session_coherence_score.toFixed(1)}/10
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Issues Found</p>
              <p className="text-3xl font-bold text-gray-900">{totalIssues}</p>
            </div>
          </div>
        </div>

        {coherence.overall_assessment && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-900">{coherence.overall_assessment}</p>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Issues ({totalIssues})
          </button>
          <button
            onClick={() => setActiveTab('contradictions')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'contradictions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Contradictions ({coherence.contradictions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('drifts')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'drifts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Topic Drifts ({coherence.topic_drifts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'gaps'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
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
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Contradictions
              </h4>
            )}
            <div className="space-y-4">
              {coherence.contradictions.map((item, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Segments {item.segment1_id + 1} ↔ {item.segment2_id + 1}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Statement 1:</p>
                      <p className="text-sm text-gray-800">"{item.statement1}"</p>
                    </div>

                    <div className="bg-white p-3 rounded border border-red-200">
                      <p className="text-xs text-gray-600 mb-1">Statement 2:</p>
                      <p className="text-sm text-gray-800">"{item.statement2}"</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                    <p className="text-sm text-gray-600">{item.explanation}</p>
                  </div>

                  {item.resolution && (
                    <div className="mt-3 bg-white p-3 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1">How to resolve:</p>
                      <p className="text-sm text-gray-600">{item.resolution}</p>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-yellow-600" />
                Topic Drifts
              </h4>
            )}
            <div className="space-y-4">
              {coherence.topic_drifts.map((item, index) => (
                <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm text-gray-600">Segment {item.segment_id + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        Drift: {(item.drift_degree * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-600">
                        Relevance: {(item.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Expected topic:</p>
                      <p className="text-sm font-medium text-gray-800">{item.expected_topic}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Actual content:</p>
                      <p className="text-sm text-gray-700">{item.actual_content}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Impact:</p>
                    <p className="text-sm text-gray-600">{item.impact}</p>
                  </div>

                  {item.suggestion && (
                    <div className="mt-3 bg-white p-3 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1">Suggestion:</p>
                      <p className="text-sm text-gray-600">{item.suggestion}</p>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-600" />
                Logical Gaps
              </h4>
            )}
            <div className="space-y-4">
              {coherence.logical_gaps.map((item, index) => (
                <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Between segments {item.between_segment1 + 1} and {item.between_segment2 + 1}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Missing concept:</p>
                    <p className="text-sm text-gray-800">{item.missing_concept}</p>
                  </div>

                  <div className="bg-white p-3 rounded border border-purple-200 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Impact:</p>
                    <p className="text-sm text-gray-600">{item.impact}</p>
                  </div>

                  {item.fill_suggestion && (
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1">How to fill this gap:</p>
                      <p className="text-sm text-gray-600">{item.fill_suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {totalIssues === 0 && (
          <div className="text-center py-8">
            <GitBranch className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Excellent Coherence!</h4>
            <p className="text-gray-600">No significant coherence issues found in this session.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoherenceIssuesViewer;