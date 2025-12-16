import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SegmentList = ({ segments }) => {
  const [expandedSegment, setExpandedSegment] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div
          key={segment.segment_id}
          className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
        >
          <div
            onClick={() =>
              setExpandedSegment(
                expandedSegment === segment.segment_id ? null : segment.segment_id
              )
            }
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 mr-2">
                    Segment {segment.segment_id + 1}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${getScoreColor(
                      segment.overall_segment_score
                    )}`}
                  ></div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{segment.text}</p>
              </div>
              <div className="flex items-center ml-4">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getScoreBadgeColor(
                    segment.overall_segment_score
                  )}`}
                >
                  {segment.overall_segment_score.toFixed(1)}
                </span>
                {expandedSegment === segment.segment_id ? (
                  <ChevronUp className="w-5 h-5 ml-2 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 ml-2 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSegment === segment.segment_id && (
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-4">{segment.text}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'clarity', label: 'Clarity' },
                  { key: 'structure', label: 'Structure' },
                  { key: 'correctness', label: 'Correctness' },
                  { key: 'pacing', label: 'Pacing' },
                  { key: 'communication', label: 'Communication' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {segment[key].score.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{segment[key].reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SegmentList;