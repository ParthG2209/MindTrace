import { GitBranch, TrendingDown, Zap } from 'lucide-react';

export const CoherenceIssuesViewer = ({ sessionId, evaluationId }) => {
  const [coherence, setCoherence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (sessionId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchCoherence();
    }
  }, [sessionId]);

  const fetchCoherence = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/coherence/${sessionId}`);
      setCoherence(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setCoherence(null);
      } else {
        console.error('Error fetching coherence:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCoherence = async () => {
    try {
      setChecking(true);
      await apiClient.post(`/api/coherence/check/${sessionId}`);
      
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiClient.get(`/api/coherence/${sessionId}`);
          if (response.data) {
            setCoherence(response.data);
            setChecking(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          // Still processing
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setChecking(false);
      }, 60000);
    } catch (error) {
      console.error('Error checking coherence:', error);
      setChecking(false);
      alert('Failed to check coherence');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
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
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mr-3" />
          <span className="text-gray-300">Loading coherence analysis...</span>
        </div>
      </div>
    );
  }

  if (!coherence) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg shadow-md p-8">
        <div className="text-center">
          <GitBranch className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Coherence Analysis Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Check for contradictions, topic drift, and logical gaps
          </p>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Checking Coherence...
              </>
            ) : (
              <>
                <GitBranch className="w-5 h-5 mr-2" />
                Check Coherence
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const totalIssues = 
    (coherence.contradictions?.length || 0) +
    (coherence.topic_drifts?.length || 0) +
    (coherence.logical_gaps?.length || 0);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg shadow-md">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <GitBranch className="w-7 h-7 mr-3 text-blue-400" />
              Coherence Analysis
            </h3>
            <p className="text-gray-400 mt-1">
              Logical flow, consistency, and topic focus
            </p>
          </div>
          <button
            onClick={handleCheckCoherence}
            disabled={checking}
            className="px-4 py-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Recheck'}
          </button>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Session Coherence Score</p>
              <p className={`text-3xl font-bold px-4 py-2 rounded-lg border inline-block ${getScoreColor(coherence.session_coherence_score)}`}>
                {coherence.session_coherence_score.toFixed(1)}/10
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Issues Found</p>
              <p className="text-3xl font-bold text-white">{totalIssues}</p>
            </div>
          </div>
        </div>

        {coherence.overall_assessment && (
          <div className="bg-blue-500/10 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-300">{coherence.overall_assessment}</p>
          </div>
        )}
      </div>

      <div className="border-b border-white/10">
        <div className="flex">
          {[
            { id: 'all', label: 'All Issues', count: totalIssues },
            { id: 'contradictions', label: 'Contradictions', count: coherence.contradictions?.length || 0 },
            { id: 'drifts', label: 'Topic Drifts', count: coherence.topic_drifts?.length || 0 },
            { id: 'gaps', label: 'Logical Gaps', count: coherence.logical_gaps?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? 'text-white bg-blue-500/20 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {totalIssues === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Excellent Coherence!</h4>
            <p className="text-gray-400">No significant coherence issues found in this session.</p>
          </div>
        ) : (
          <div className="text-gray-400">
            {/* Show filtered content based on activeTab */}
            {(activeTab === 'all' || activeTab === 'contradictions') && coherence.contradictions?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Contradictions</h4>
                {/* Add contradiction items here */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoherenceIssuesViewer;