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
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 5) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div
          key={segment.segment_id}
          className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl overflow-hidden transition-all"
        >
          <div
            onClick={() =>
              setExpandedSegment(
                expandedSegment === segment.segment_id ? null : segment.segment_id
              )
            }
            className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-xs font-medium text-gray-400 mr-2">
                    Segment {segment.segment_id + 1}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${getScoreColor(
                      segment.overall_segment_score
                    )}`}
                  ></div>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{segment.text}</p>
              </div>
              <div className="flex items-center ml-4">
                <span
                  className={`px-3 py-1 rounded-xl text-sm font-semibold border backdrop-blur-sm ${getScoreBadgeColor(
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
            <div className="px-4 pb-4 pt-2 bg-white/5 border-t border-white/10">
              <p className="text-sm text-gray-300 mb-4">{segment.text}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'clarity', label: 'Clarity' },
                  { key: 'structure', label: 'Structure' },
                  { key: 'correctness', label: 'Correctness' },
                  { key: 'pacing', label: 'Pacing' },
                  { key: 'communication', label: 'Communication' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-white/5 border border-white/10 backdrop-blur-sm p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-400">{label}</span>
                      <span className="text-sm font-semibold text-white">
                        {segment[key].score.toFixed(1)}
                      </span>
                    </div>
                    {/* FIXED: Changed text color from gray-500 to gray-300 for better visibility */}
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">{segment[key].reason}</p>
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