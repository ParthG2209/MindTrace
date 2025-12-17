import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, ArrowRight, Loader, TrendingUp } from 'lucide-react';
import apiClient from '../api/client';

const RewriteComparison = ({ sessionId, evaluationId, generating, setGenerating }) => {
  const [rewrites, setRewrites] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetchRewrites();
    }
  }, [sessionId]);

  // Handle polling when generating state is true (persists across unmounts via parent state)
  useEffect(() => {
    let pollInterval;
    if (generating) {
      pollInterval = setInterval(async () => {
        try {
          const response = await apiClient.get(`/api/rewrites/${sessionId}`);
          if (response.data && response.data.rewrites && response.data.rewrites.length > 0) {
            setRewrites(response.data);
            setGenerating(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 3000);
      
      // Auto-stop after 60 seconds to prevent infinite polling
      const timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        if (generating) setGenerating(false);
      }, 60000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [generating, sessionId, setGenerating]);

  const fetchRewrites = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/rewrites/${sessionId}`);
      setRewrites(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setRewrites({ rewrites: [], total: 0 });
      } else {
        console.error('Error fetching rewrites:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRewrites = async () => {
    try {
      setGenerating(true);
      await apiClient.post(`/api/rewrites/session/${sessionId}`);
      // Polling is handled by the useEffect above
    } catch (error) {
      console.error('Error generating rewrites:', error);
      setGenerating(false);
      alert('Failed to generate rewrites');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mr-3" />
          <span className="text-gray-300">Loading rewrites...</span>
        </div>
      </div>
    );
  }

  if (!rewrites || rewrites.rewrites.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Rewrites Generated Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Generate improved versions of unclear explanations
          </p>
          <button
            onClick={handleGenerateRewrites}
            disabled={generating}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Generating Rewrites...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Generate Rewrites
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <RefreshCw className="w-7 h-7 mr-3 text-blue-400" />
              Explanation Rewrites
            </h3>
            <p className="text-gray-400 mt-1">
              AI-improved versions of unclear explanations
            </p>
          </div>
          <button
            onClick={handleGenerateRewrites}
            disabled={generating}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            {generating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {rewrites.rewrites.length > 0 && (
          <div className="mt-4">
            <select
              value={selectedSegment === null ? 'all' : selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
            >
              <option value="all">All Segments</option>
              {[...new Set(rewrites.rewrites.map(r => r.segment_id))].sort().map(id => (
                <option key={id} value={id}>Segment {id + 1}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="text-sm text-gray-400 mb-4">
          {rewrites.total} segments rewritten
        </div>

        <div className="space-y-6">
          {rewrites.rewrites
            .filter(r => selectedSegment === null || r.segment_id === selectedSegment)
            .map((rewrite, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-300">
                    Segment {rewrite.segment_id + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    {rewrite.rewrite.clarity_improvement && (
                      <div className="flex items-center text-green-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          +{rewrite.rewrite.clarity_improvement.toFixed(1)} clarity
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Original Text */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                    <p className="text-sm font-medium text-gray-300">Original:</p>
                  </div>
                  <div className="bg-red-500/10 border-l-4 border-red-500/50 p-4 rounded backdrop-blur-sm">
                    <p className="text-sm text-gray-300">{rewrite.rewrite.original_text}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-3">
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                </div>

                {/* Rewritten Text */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                    <p className="text-sm font-medium text-gray-300">Improved:</p>
                  </div>
                  <div className="bg-green-500/10 border-l-4 border-green-500/50 p-4 rounded backdrop-blur-sm">
                    <p className="text-sm text-gray-300">{rewrite.rewrite.rewritten_text}</p>
                  </div>
                </div>

                {/* Improvements */}
                {rewrite.rewrite.improvements && rewrite.rewrite.improvements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                      Key Improvements:
                    </p>
                    <ul className="space-y-1">
                      {rewrite.rewrite.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-gray-400 flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-6 text-xs text-gray-500">
                  <span>Words: {rewrite.rewrite.original_text.split(' ').length} → {rewrite.rewrite.rewritten_text.split(' ').length}</span>
                  {rewrite.rewrite.word_count_change !== undefined && (
                    <span>Change: {rewrite.rewrite.word_count_change > 0 ? '+' : ''}{rewrite.rewrite.word_count_change} words</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RewriteComparison;