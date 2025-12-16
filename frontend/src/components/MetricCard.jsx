import React from 'react';

const MetricCard = ({ title, score, icon: Icon }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getProgressColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg shadow-md p-6 hover:bg-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 backdrop-blur-sm border border-blue-500/20">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-lg border backdrop-blur-sm ${getScoreColor(score)}`}>
          <span className="text-xl font-bold">{score.toFixed(1)}</span>
          <span className="text-sm ml-1">/10</span>
        </div>
      </div>
      
      <div className="w-full bg-white/5 rounded-full h-2.5 backdrop-blur-sm">
        <div
          className={`h-2.5 rounded-full transition-all ${getProgressColor(score)}`}
          style={{ width: `${(score / 10) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MetricCard;