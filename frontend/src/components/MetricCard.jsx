import React from 'react';

const MetricCard = ({ title, score, icon: Icon }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-500 to-green-600';
    if (score >= 6) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getProgressColor = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden group">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          </div>
          <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getScoreColor(score)} shadow-lg`}>
            <span className="text-xl font-bold text-white">{score.toFixed(1)}</span>
            <span className="text-sm ml-1 text-white/80">/10</span>
          </div>
        </div>
        
        <div className="w-full bg-white/5 rounded-full h-2.5 backdrop-blur-sm">
          <div
            className={`h-2.5 rounded-full transition-all ${getProgressColor(score)}`}
            style={{ width: `${(score / 10) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;