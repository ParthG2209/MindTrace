import React from 'react';
import { Video, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const SessionCard = ({ session, onClick }) => {
  const getStatusConfig = (status) => {
    const configs = {
      uploaded: {
        icon: Video,
        text: 'Uploaded',
        color: 'text-gray-600 bg-gray-100',
      },
      transcribing: {
        icon: Loader,
        text: 'Transcribing',
        color: 'text-blue-600 bg-blue-100',
        animate: true,
      },
      analyzing: {
        icon: Loader,
        text: 'Analyzing',
        color: 'text-purple-600 bg-purple-100',
        animate: true,
      },
      completed: {
        icon: CheckCircle,
        text: 'Completed',
        color: 'text-green-600 bg-green-100',
      },
      failed: {
        icon: AlertCircle,
        text: 'Failed',
        color: 'text-red-600 bg-red-100',
      },
    };
    return configs[status] || configs.uploaded;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {session.title}
          </h3>
          <p className="text-sm text-gray-600">{session.topic}</p>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full ${statusConfig.color}`}>
          <StatusIcon
            className={`w-4 h-4 mr-1 ${statusConfig.animate ? 'animate-spin' : ''}`}
          />
          <span className="text-xs font-medium">{statusConfig.text}</span>
        </div>
      </div>

      <div className="flex items-center text-sm text-gray-500 space-x-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>{formatDuration(session.duration)}</span>
        </div>
        <div>
          <span>{formatDate(session.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;