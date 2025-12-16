import React from 'react';

const MetricCard = ({ title, score, icon: Icon }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-lg border ${getScoreColor(score)}`}>
          <span className="text-xl font-bold">{score.toFixed(1)}</span>
          <span className="text-sm ml-1">/10</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${getProgressColor(score)}`}
          style={{ width: `${(score / 10) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MetricCard;