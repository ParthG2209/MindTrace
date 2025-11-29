import React from 'react';
import { User, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MentorCard = ({ mentor, stats, onClick }) => {
  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
            <p className="text-sm text-gray-500">{mentor.email}</p>
          </div>
        </div>
        {stats && getTrendIcon(stats.recent_trend)}
      </div>

      {mentor.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mentor.bio}</p>
      )}

      {mentor.expertise && mentor.expertise.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {mentor.expertise.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
            >
              {skill}
            </span>
          ))}
          {mentor.expertise.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{mentor.expertise.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Total Sessions</p>
          <p className="text-lg font-semibold text-gray-900">
            {stats?.total_sessions || mentor.total_sessions || 0}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Average Score</p>
          {stats?.average_score || mentor.average_score ? (
            <p className={`text-lg font-semibold px-3 py-1 rounded ${getScoreColor(stats?.average_score || mentor.average_score)}`}>
              {(stats?.average_score || mentor.average_score).toFixed(1)}
            </p>
          ) : (
            <p className="text-lg text-gray-400">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorCard;