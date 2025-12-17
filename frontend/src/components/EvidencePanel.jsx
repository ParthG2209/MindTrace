import React, { useState, useEffect } from 'react';
import { AlertCircle, Lightbulb, ArrowRight, Loader } from 'lucide-react';
import apiClient from '../api/client';

const EvidencePanel = ({ evaluationId, sessionId }) => {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (evaluationId) {
      fetchEvidence();
    }
  }, [evaluationId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/evidence/${evaluationId}`);
      setEvidence(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setEvidence(null);
      } else {
        console.error('Error fetching evidence:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExtractEvidence = async () => {
    try {
      setExtracting(true);
      await apiClient.post(`/api/evidence/extract/${evaluationId}`);
      
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiClient.get(`/api/evidence/${evaluationId}`);
          if (response.data && response.data.items) {
            setEvidence(response.data);
            setExtracting(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setExtracting(false);
      }, 60000);
    } catch (error) {
      console.error('Error extracting evidence:', error);
      setExtracting(false);
      alert('Failed to extract evidence');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'major':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'moderate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'minor':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-white/10 text-gray-400 border-white/20';
    }
  };

  const getMetricColor = (metric) => {
    const colors = {
      clarity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      structure: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      correctness: 'bg-green-500/10 text-green-400 border-green-500/20',
      pacing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      communication: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    };
    return colors[metric] || 'bg-white/10 text-gray-400 border-white/20';
  };

  const filterItems = () => {
    if (!evidence?.items) return [];
    
    let filtered = evidence.items;
    
    if (selectedMetric !== 'all') {
      filtered = filtered.filter(item => item.metric === selectedMetric);
    }
    
    if (selectedSegment !== null) {
      filtered = filtered.filter(item => item.segment_id === selectedSegment);
    }
    
    return filtered;
  };

  const filteredItems = filterItems();

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mr-3" />
          <span className="text-gray-300">Loading evidence...</span>
        </div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Evidence Extracted Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Extract specific evidence of teaching issues from low-scoring segments
          </p>
          <button
            onClick={handleExtractEvidence}
            disabled={extracting}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            {extracting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Extracting Evidence...
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5 mr-2" />
                Extract Evidence
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <AlertCircle className="w-7 h-7 mr-3 text-blue-400" />
              Evidence of Issues
            </h3>
            <p className="text-gray-400 mt-1">
              Specific problematic phrases and improvement suggestions
            </p>
          </div>
          <button
            onClick={handleExtractEvidence}
            disabled={extracting}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            {extracting ? 'Extracting...' : 'Refresh Evidence'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">
              Filter by Metric:
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
            >
              <option value="all">All Metrics</option>
              <option value="clarity">Clarity</option>
              <option value="structure">Structure</option>
              <option value="correctness">Correctness</option>
              <option value="pacing">Pacing</option>
              <option value="communication">Communication</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">
              Filter by Segment:
            </label>
            <select
              value={selectedSegment === null ? 'all' : selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
            >
              <option value="all">All Segments</option>
              {[...new Set(evidence.items.map(item => item.segment_id))].sort().map(id => (
                <option key={id} value={id}>Segment {id + 1}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Items */}
      <div className="p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No evidence found for the selected filters
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Showing {filteredItems.length} of {evidence.items.length} issues
            </div>
            
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getMetricColor(item.metric)}`}>
                      {item.metric.charAt(0).toUpperCase() + item.metric.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Segment {item.segment_id + 1}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getSeverityColor(item.severity)}`}>
                    {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="bg-red-500/10 border-l-4 border-red-500/50 p-3 rounded backdrop-blur-sm">
                    <p className="text-sm font-medium text-red-400 mb-1">Problematic phrase:</p>
                    <p className="text-sm text-red-300 font-mono">"{item.phrase}"</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-300 mb-1">Issue:</p>
                  <p className="text-sm text-gray-400">{item.issue}</p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-1 text-yellow-400" />
                    Suggestion:
                  </p>
                  <p className="text-sm text-gray-400">{item.suggestion}</p>
                </div>

                {item.alternative_phrasing && (
                  <div className="bg-green-500/10 border-l-4 border-green-500/50 p-3 rounded backdrop-blur-sm">
                    <p className="text-sm font-medium text-green-400 mb-1 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Better alternative:
                    </p>
                    <p className="text-sm text-green-300 font-mono">"{item.alternative_phrasing}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidencePanel;