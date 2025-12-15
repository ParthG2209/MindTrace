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
            # Advanced metrics - with default values if not in settings
            'engagement': getattr(settings, 'WEIGHT_ENGAGEMENT', 0.10),
            'examples': getattr(settings, 'WEIGHT_EXAMPLES', 0.10),
            'questioning': getattr(settings, 'WEIGHT_QUESTIONING', 0.08),
            'adaptability': getattr(settings, 'WEIGHT_ADAPTABILITY', 0.08),
            'relevance': getattr(settings, 'WEIGHT_RELEVANCE', 0.09),
        }
    
    def compute_segment_score(self, segment_eval: SegmentEvaluation) -> float:
        """Compute weighted score for a single segment - handles optional metrics"""
        score = (
            segment_eval.clarity.score * self.weights['clarity'] +
            segment_eval.structure.score * self.weights['structure'] +
            segment_eval.correctness.score * self.weights['correctness'] +
            segment_eval.pacing.score * self.weights['pacing'] +
            segment_eval.communication.score * self.weights['communication']
        )
        
        # Add advanced metrics if available
        if segment_eval.engagement:
            score += segment_eval.engagement.score * self.weights['engagement']
        if segment_eval.examples:
            score += segment_eval.examples.score * self.weights['examples']
        if segment_eval.questioning:
            score += segment_eval.questioning.score * self.weights['questioning']
        if segment_eval.adaptability:
            score += segment_eval.adaptability.score * self.weights['adaptability']
        if segment_eval.relevance:
            score += segment_eval.relevance.score * self.weights['relevance']
        
        return round(score, 2)
    
    def compute_overall_metrics(self, segments: List[SegmentEvaluation]) -> Metrics:
        """Compute average metrics across all segments - handles optional metrics"""
        if not segments:
            return Metrics(
                clarity=0, structure=0, correctness=0,
                pacing=0, communication=0, engagement=None,
                examples=None, questioning=None, adaptability=None,
                relevance=None
            )
        
        n = len(segments)
        
        # Calculate advanced metrics only if present
        engagement_scores = [s.engagement.score for s in segments if s.engagement]
        examples_scores = [s.examples.score for s in segments if s.examples]
        questioning_scores = [s.questioning.score for s in segments if s.questioning]
        adaptability_scores = [s.adaptability.score for s in segments if s.adaptability]
        relevance_scores = [s.relevance.score for s in segments if s.relevance]
        
        return Metrics(
            clarity=round(sum(s.clarity.score for s in segments) / n, 2),
            structure=round(sum(s.structure.score for s in segments) / n, 2),
            correctness=round(sum(s.correctness.score for s in segments) / n, 2),
            pacing=round(sum(s.pacing.score for s in segments) / n, 2),
            communication=round(sum(s.communication.score for s in segments) / n, 2),
            engagement=round(sum(engagement_scores) / len(engagement_scores), 2) if engagement_scores else None,
            examples=round(sum(examples_scores) / len(examples_scores), 2) if examples_scores else None,
            questioning=round(sum(questioning_scores) / len(questioning_scores), 2) if questioning_scores else None,
            adaptability=round(sum(adaptability_scores) / len(adaptability_scores), 2) if adaptability_scores else None,
            relevance=round(sum(relevance_scores) / len(relevance_scores), 2) if relevance_scores else None,
        )
    
    def compute_overall_score(self, metrics: Metrics) -> float:
        """Compute weighted overall score from metrics - handles optional metrics"""
        score = (
            metrics.clarity * self.weights['clarity'] +
            metrics.structure * self.weights['structure'] +
            metrics.correctness * self.weights['correctness'] +
            metrics.pacing * self.weights['pacing'] +
            metrics.communication * self.weights['communication']
        )
        
        # Add advanced metrics if available
        if metrics.engagement is not None:
            score += metrics.engagement * self.weights['engagement']
        if metrics.examples is not None:
            score += metrics.examples * self.weights['examples']
        if metrics.questioning is not None:
            score += metrics.questioning * self.weights['questioning']
        if metrics.adaptability is not None:
            score += metrics.adaptability * self.weights['adaptability']
        if metrics.relevance is not None:
            score += metrics.relevance * self.weights['relevance']
        
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
            if score is None:  # Skip optional metrics that are missing
                continue
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
        relevance_scores = [s.relevance.score for s in segments if s.relevance]
        
        if not relevance_scores:
            return {
                'stated_topic': stated_topic,
                'average_relevance': None,
                'topic_drift_count': 0,
                'topic_drift_segments': [],
                'related_topics_bonus': 0.0,
                'alignment_quality': 'Not available (older evaluation)'
            }
        
        avg_relevance = sum(relevance_scores) / len(relevance_scores)
        
        # Detect topic drift
        topic_drift = []
        for i, seg in enumerate(segments):
            if seg.relevance and seg.relevance.score < 6.0:
                topic_drift.append({
                    'segment_id': i,
                    'score': seg.relevance.score,
                    'reason': seg.relevance.reason
                })
        
        # Calculate related topics bonus
        high_relevance_segments = [s for s in segments if s.relevance and s.relevance.score >= 8.0]
        related_bonus = len(high_relevance_segments) / len(segments) * getattr(settings, 'RELATED_TOPIC_BONUS', 0.5)
        
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

# Create global instance
scoring_service = ScoringService()