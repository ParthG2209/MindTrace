import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, ArrowRight, Loader, TrendingUp } from 'lucide-react';
import axios from 'axios';

const RewriteComparison = ({ sessionId, evaluationId }) => {
  const [rewrites, setRewrites] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetchRewrites();
    }
  }, [sessionId]);

  const fetchRewrites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/rewrites/${sessionId}`);
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
      await axios.post(`http://localhost:8000/api/rewrites/session/${sessionId}`);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/rewrites/${sessionId}`);
          if (response.data && response.data.rewrites && response.data.rewrites.length > 0) {
            setRewrites(response.data);
            setGenerating(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 3000);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        setGenerating(false);
      }, 60000);
    } catch (error) {
      console.error('Error generating rewrites:', error);
      setGenerating(false);
      alert('Failed to generate rewrites');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Loading rewrites...</span>
        </div>
      </div>
    );
  }

  if (!rewrites || rewrites.rewrites.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Rewrites Generated Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate improved versions of unclear explanations
          </p>
          <button
            onClick={handleGenerateRewrites}
            disabled={generating}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <RefreshCw className="w-7 h-7 mr-3 text-blue-600" />
              Explanation Rewrites
            </h3>
            <p className="text-gray-600 mt-1">
              AI-improved versions of unclear explanations
            </p>
          </div>
          <button
            onClick={handleGenerateRewrites}
            disabled={generating}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {rewrites.rewrites.length > 0 && (
          <div className="mt-4">
            <select
              value={selectedSegment === null ? 'all' : selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="text-sm text-gray-600 mb-4">
          {rewrites.total} segments rewritten
        </div>

        <div className="space-y-6">
          {rewrites.rewrites
            .filter(r => selectedSegment === null || r.segment_id === selectedSegment)
            .map((rewrite, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Segment {rewrite.segment_id + 1}
                  </span>
                  <div className="flex items-center gap-4">
                    {rewrite.rewrite.clarity_improvement && (
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          +{rewrite.rewrite.clarity_improvement.toFixed(1)} clarity
                        </span>
                      </div>
                    )}
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      Confidence: {(rewrite.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Original Text */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                    <p className="text-sm font-medium text-gray-700">Original:</p>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="text-sm text-gray-800">{rewrite.rewrite.original_text}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-3">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>

                {/* Rewritten Text */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                    <p className="text-sm font-medium text-gray-700">Improved:</p>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <p className="text-sm text-gray-800">{rewrite.rewrite.rewritten_text}</p>
                  </div>
                </div>

                {/* Improvements */}
                {rewrite.rewrite.improvements && rewrite.rewrite.improvements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      Key Improvements:
                    </p>
                    <ul className="space-y-1">
                      {rewrite.rewrite.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-6 text-xs text-gray-500">
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