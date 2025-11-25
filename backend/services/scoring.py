from typing import List
from models.evaluation import SegmentEvaluation, Metrics
from config import settings

class ScoringService:
    """Service for aggregating and computing scores"""
    
    def __init__(self):
        self.weights = {
            'clarity': settings.WEIGHT_CLARITY,
            'structure': settings.WEIGHT_STRUCTURE,
            'correctness': settings.WEIGHT_CORRECTNESS,
            'pacing': settings.WEIGHT_PACING,
            'communication': settings.WEIGHT_COMMUNICATION
        }
    
    def compute_segment_score(self, segment_eval: SegmentEvaluation) -> float:
        """Compute weighted score for a single segment"""
        score = (
            segment_eval.clarity.score * self.weights['clarity'] +
            segment_eval.structure.score * self.weights['structure'] +
            segment_eval.correctness.score * self.weights['correctness'] +
            segment_eval.pacing.score * self.weights['pacing'] +
            segment_eval.communication.score * self.weights['communication']
        )
        return round(score, 2)
    
    def compute_overall_metrics(self, segments: List[SegmentEvaluation]) -> Metrics:
        """Compute average metrics across all segments"""
        if not segments:
            return Metrics(
                clarity=0, structure=0, correctness=0,
                pacing=0, communication=0
            )
        
        total_clarity = sum(s.clarity.score for s in segments)
        total_structure = sum(s.structure.score for s in segments)
        total_correctness = sum(s.correctness.score for s in segments)
        total_pacing = sum(s.pacing.score for s in segments)
        total_communication = sum(s.communication.score for s in segments)
        
        n = len(segments)
        
        return Metrics(
            clarity=round(total_clarity / n, 2),
            structure=round(total_structure / n, 2),
            correctness=round(total_correctness / n, 2),
            pacing=round(total_pacing / n, 2),
            communication=round(total_communication / n, 2)
        )
    
    def compute_overall_score(self, metrics: Metrics) -> float:
        """Compute weighted overall score from metrics"""
        score = (
            metrics.clarity * self.weights['clarity'] +
            metrics.structure * self.weights['structure'] +
            metrics.correctness * self.weights['correctness'] +
            metrics.pacing * self.weights['pacing'] +
            metrics.communication * self.weights['communication']
        )
        return round(score, 2)
    
    def identify_strengths_and_weaknesses(
        self, 
        segments: List[SegmentEvaluation]
    ) -> tuple[List[str], List[str]]:
        """Identify strengths and areas for improvement"""
        
        if not segments:
            return [], []
        
        # Aggregate scores
        metrics = self.compute_overall_metrics(segments)
        
        strengths = []
        weaknesses = []
        
        # Define thresholds
        high_threshold = 8.0
        low_threshold = 6.5
        
        metric_names = {
            'clarity': 'Clarity of explanations',
            'structure': 'Structural organization',
            'correctness': 'Technical accuracy',
            'pacing': 'Pacing and delivery',
            'communication': 'Communication effectiveness'
        }
        
        for metric, name in metric_names.items():
            score = getattr(metrics, metric)
            if score >= high_threshold:
                strengths.append(f"{name} (score: {score})")
            elif score < low_threshold:
                weaknesses.append(f"{name} (score: {score})")
        
        return strengths, weaknesses

scoring_service = ScoringService()