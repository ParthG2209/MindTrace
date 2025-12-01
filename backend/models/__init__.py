from .mentor import MentorBase, MentorCreate, MentorInDB, MentorUpdate, MentorStats
from .session import SessionBase, SessionCreate, SessionInDB, SessionUpdate, SessionStatus
from .transcript import TranscriptSegment, TranscriptBase, TranscriptCreate, TranscriptInDB
from .evaluation import (
    ScoreDetail,
    SegmentEvaluation,
    Metrics,
    EvaluationBase,
    EvaluationCreate,
    EvaluationInDB,
    EvaluationSummary
)

# ===== NEW: Import new models =====
from .evidence import EvidenceItem, EvidenceCollection
from .rewrite import RewriteComparison, RewriteSuggestion, RewriteCollection
from .coherence import (
    ContradictionIssue,
    TopicDriftIssue,
    LogicalGap,
    CoherenceReport,
    CoherenceSummary
)
# ===== END NEW =====

__all__ = [
    # Mentor models
    'MentorBase',
    'MentorCreate',
    'MentorInDB',
    'MentorUpdate',
    'MentorStats',
    
    # Session models
    'SessionBase',
    'SessionCreate',
    'SessionInDB',
    'SessionUpdate',
    'SessionStatus',
    
    # Transcript models
    'TranscriptSegment',
    'TranscriptBase',
    'TranscriptCreate',
    'TranscriptInDB',
    
    # Evaluation models
    'ScoreDetail',
    'SegmentEvaluation',
    'Metrics',
    'EvaluationBase',
    'EvaluationCreate',
    'EvaluationInDB',
    'EvaluationSummary',
    
    # ===== NEW: Export new models =====
    # Evidence models
    'EvidenceItem',
    'EvidenceCollection',
    
    # Rewrite models
    'RewriteComparison',
    'RewriteSuggestion',
    'RewriteCollection',
    
    # Coherence models
    'ContradictionIssue',
    'TopicDriftIssue',
    'LogicalGap',
    'CoherenceReport',
    'CoherenceSummary',
    # ===== END NEW =====
]