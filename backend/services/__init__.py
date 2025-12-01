from .transcription import transcription_service, TranscriptionService
from .segmentation import segmentation_service, SegmentationService
from .llm_evaluator import llm_evaluator, LLMEvaluator
from .scoring import scoring_service, ScoringService

# ===== NEW: Import new services =====
from .evidence_extractor import evidence_extractor, EvidenceExtractor
from .explanation_rewriter import explanation_rewriter, ExplanationRewriter
from .coherence_checker import coherence_checker, CoherenceChecker
# ===== END NEW =====

__all__ = [
    'transcription_service',
    'TranscriptionService',
    'segmentation_service',
    'SegmentationService',
    'llm_evaluator',
    'LLMEvaluator',
    'scoring_service',
    'ScoringService',
    # ===== NEW =====
    'evidence_extractor',
    'EvidenceExtractor',
    'explanation_rewriter',
    'ExplanationRewriter',
    'coherence_checker',
    'CoherenceChecker',
    # ===== END NEW =====
]