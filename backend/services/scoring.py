from typing import List, Tuple
from models.evaluation import SegmentEvaluation, Metrics
from config import settings

class ScoringService:
    """Enhanced service for aggregating and computing scores"""
    
    def __init__(self):
        self.weights = {
            # Core metrics
            'clarity': settings.WEIGHT_CLARITY,
            'structure': settings.WEIGHT_STRUCTURE,
            'correctness': settings.WEIGHT_CORRECTNESS,
            'pacing': settings.WEIGHT_PACING,
            'communication': settings.WEIGHT_COMMUNICATION,
            # Advanced metrics
            'engagement': settings.WEIGHT_ENGAGEMENT,
            'examples': settings.WEIGHT_EXAMPLES,
            'questioning': settings.WEIGHT_QUESTIONING,
            'adaptability': settings.WEIGHT_ADAPTABILITY,
            'relevance': settings.WEIGHT_RELEVANCE,
        }
    
    def compute_segment_score(self, segment_eval: SegmentEvaluation) -> float:
        """Compute weighted score for a single segment"""
        score = (
            segment_eval.clarity.score * self.weights['clarity'] +
            segment_eval.structure.score * self.weights['structure'] +
            segment_eval.correctness.score * self.weights['correctness'] +
            segment_eval.pacing.score * self.weights['pacing'] +
            segment_eval.communication.score * self.weights['communication'] +
            segment_eval.engagement.score * self.weights['engagement'] +
            segment_eval.examples.score * self.weights['examples'] +
            segment_eval.questioning.score * self.weights['questioning'] +
            segment_eval.adaptability.score * self.weights['adaptability'] +
            segment_eval.relevance.score * self.weights['relevance']
        )
        return round(score, 2)
    
    def compute_overall_metrics(self, segments: List[SegmentEvaluation]) -> Metrics:
        """Compute average metrics across all segments"""
        if not segments:
            return Metrics(
                clarity=0, structure=0, correctness=0,
                pacing=0, communication=0, engagement=0,
                examples=0, questioning=0, adaptability=0,
                relevance=0
            )
        
        n = len(segments)
        
        return Metrics(
            clarity=round(sum(s.clarity.score for s in segments) / n, 2),
            structure=round(sum(s.structure.score for s in segments) / n, 2),
            correctness=round(sum(s.correctness.score for s in segments) / n, 2),
            pacing=round(sum(s.pacing.score for s in segments) / n, 2),
            communication=round(sum(s.communication.score for s in segments) / n, 2),
            engagement=round(sum(s.engagement.score for s in segments) / n, 2),
            examples=round(sum(s.examples.score for s in segments) / n, 2),
            questioning=round(sum(s.questioning.score for s in segments) / n, 2),
            adaptability=round(sum(s.adaptability.score for s in segments) / n, 2),
            relevance=round(sum(s.relevance.score for s in segments) / n, 2),
        )
    
    def compute_overall_score(self, metrics: Metrics) -> float:
        """Compute weighted overall score from metrics"""
        score = (
            metrics.clarity * self.weights['clarity'] +
            metrics.structure * self.weights['structure'] +
            metrics.correctness * self.weights['correctness'] +
            metrics.pacing * self.weights['pacing'] +
            metrics.communication * self.weights['communication'] +
            metrics.engagement * self.weights['engagement'] +
            metrics.examples * self.weights['examples'] +
            metrics.questioning * self.weights['questioning'] +
            metrics.adaptability * self.weights['adaptability'] +
            metrics.relevance * self.weights['relevance']
        )
        return round(score, 2)
    
    def identify_strengths_and_weaknesses(
        self, 
        segments: List[SegmentEvaluation]
    ) -> Tuple[List[str], List[str]]:
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
            'communication': 'Communication effectiveness',
            'engagement': 'Student engagement techniques',
            'examples': 'Quality and relevance of examples',
            'questioning': 'Use of questioning to promote thinking',
            'adaptability': 'Adaptability to content difficulty',
            'relevance': 'Topic relevance and context',
        }
        
        for metric, name in metric_names.items():
            score = getattr(metrics, metric)
            if score >= high_threshold:
                strengths.append(f"{name} (score: {score})")
            elif score < low_threshold:
                weaknesses.append(f"{name} (score: {score})")
        
        return strengths, weaknesses
    
    def analyze_topic_alignment(
        self,
        segments: List[SegmentEvaluation],
        stated_topic: str
    ) -> dict:
        """
        Analyze how well the session aligns with the stated topic
        """
        relevance_scores = [s.relevance.score for s in segments]
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0
        
        # Detect topic drift
        topic_drift = []
        for i, seg in enumerate(segments):
            if seg.relevance.score < 6.0:
                topic_drift.append({
                    'segment_id': i,
                    'score': seg.relevance.score,
                    'reason': seg.relevance.reason
                })
        
        # Calculate related topics bonus
        high_relevance_segments = [s for s in segments if s.relevance.score >= 8.0]
        related_bonus = len(high_relevance_segments) / len(segments) * settings.RELATED_TOPIC_BONUS
        
        return {
            'stated_topic': stated_topic,
            'average_relevance': round(avg_relevance, 2),
            'topic_drift_count': len(topic_drift),
            'topic_drift_segments': topic_drift,
            'related_topics_bonus': round(related_bonus, 2),
            'alignment_quality': self._get_alignment_quality(avg_relevance)
        }
    
    def _get_alignment_quality(self, relevance_score: float) -> str:
        """Get qualitative assessment of topic alignment"""
        if relevance_score >= 8.5:
            return "Excellent - Content highly relevant with valuable related topics"
        elif relevance_score >= 7.5:
            return "Good - Mostly on-topic with some helpful tangents"
        elif relevance_score >= 6.5:
            return "Acceptable - Generally relevant with minor drift"
        elif relevance_score >= 5.5:
            return "Needs Improvement - Significant topic drift detected"
        else:
            return "Poor - Content frequently strays from stated topic"

scoring_service = ScoringService()