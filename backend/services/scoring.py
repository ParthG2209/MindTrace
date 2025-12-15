from typing import List, Tuple
from models.evaluation import SegmentEvaluation, Metrics
from config import settings

class ScoringService:
    """Enhanced service for aggregating and computing scores"""
    
    def __init__(self):
        self.weights = {
            # Core metrics (Total: 0.75)
            'clarity': settings.WEIGHT_CLARITY,
            'structure': settings.WEIGHT_STRUCTURE,
            'correctness': settings.WEIGHT_CORRECTNESS,
            'pacing': settings.WEIGHT_PACING,
            'communication': settings.WEIGHT_COMMUNICATION,
            # Advanced metrics (Total: 0.35)
            'engagement': settings.WEIGHT_ENGAGEMENT,
            'examples': settings.WEIGHT_EXAMPLES,
            'questioning': settings.WEIGHT_QUESTIONING,
            'adaptability': settings.WEIGHT_ADAPTABILITY,
            'relevance': settings.WEIGHT_RELEVANCE,
            # NEW: Classroom dynamics (Total: 0.10)
            'student_interaction': settings.WEIGHT_STUDENT_INTERACTION,
            'off_topic_management': settings.WEIGHT_OFF_TOPIC_MANAGEMENT,
            'classroom_control': settings.WEIGHT_CLASSROOM_CONTROL,
        }
        
        # Normalize weights to ensure they sum to 1.0
        total_weight = sum(self.weights.values())
        self.weights = {k: v / total_weight for k, v in self.weights.items()}
    
    def compute_segment_score(self, segment_eval: SegmentEvaluation) -> float:
        """Compute weighted score for a single segment - handles all metrics"""
        score = 0.0
        
        # Core metrics (always present)
        score += segment_eval.clarity.score * self.weights['clarity']
        score += segment_eval.structure.score * self.weights['structure']
        score += segment_eval.correctness.score * self.weights['correctness']
        score += segment_eval.pacing.score * self.weights['pacing']
        score += segment_eval.communication.score * self.weights['communication']
        
        # Advanced metrics (always present now)
        score += segment_eval.engagement.score * self.weights['engagement']
        score += segment_eval.examples.score * self.weights['examples']
        score += segment_eval.questioning.score * self.weights['questioning']
        score += segment_eval.adaptability.score * self.weights['adaptability']
        score += segment_eval.relevance.score * self.weights['relevance']
        
        # NEW: Classroom dynamics metrics (optional for backward compatibility)
        if segment_eval.student_interaction:
            score += segment_eval.student_interaction.score * self.weights['student_interaction']
        if segment_eval.off_topic_management:
            score += segment_eval.off_topic_management.score * self.weights['off_topic_management']
        if segment_eval.classroom_control:
            score += segment_eval.classroom_control.score * self.weights['classroom_control']
        
        return round(score, 2)
    
    def compute_overall_metrics(self, segments: List[SegmentEvaluation]) -> Metrics:
        """Compute average metrics across all segments"""
        if not segments:
            return Metrics(
                clarity=0, structure=0, correctness=0,
                pacing=0, communication=0, engagement=0,
                examples=0, questioning=0, adaptability=0,
                relevance=0, student_interaction=None,
                off_topic_management=None, classroom_control=None
            )
        
        n = len(segments)
        
        # Calculate classroom dynamics metrics only if present
        student_interaction_scores = [s.student_interaction.score for s in segments if s.student_interaction]
        off_topic_scores = [s.off_topic_management.score for s in segments if s.off_topic_management]
        classroom_control_scores = [s.classroom_control.score for s in segments if s.classroom_control]
        
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
            student_interaction=round(sum(student_interaction_scores) / len(student_interaction_scores), 2) if student_interaction_scores else None,
            off_topic_management=round(sum(off_topic_scores) / len(off_topic_scores), 2) if off_topic_scores else None,
            classroom_control=round(sum(classroom_control_scores) / len(classroom_control_scores), 2) if classroom_control_scores else None,
        )
    
    def compute_overall_score(self, metrics: Metrics) -> float:
        """Compute weighted overall score from metrics"""
        score = 0.0
        
        # Core metrics
        score += metrics.clarity * self.weights['clarity']
        score += metrics.structure * self.weights['structure']
        score += metrics.correctness * self.weights['correctness']
        score += metrics.pacing * self.weights['pacing']
        score += metrics.communication * self.weights['communication']
        
        # Advanced metrics
        score += metrics.engagement * self.weights['engagement']
        score += metrics.examples * self.weights['examples']
        score += metrics.questioning * self.weights['questioning']
        score += metrics.adaptability * self.weights['adaptability']
        score += metrics.relevance * self.weights['relevance']
        
        # NEW: Classroom dynamics metrics (if present)
        if metrics.student_interaction is not None:
            score += metrics.student_interaction * self.weights['student_interaction']
        if metrics.off_topic_management is not None:
            score += metrics.off_topic_management * self.weights['off_topic_management']
        if metrics.classroom_control is not None:
            score += metrics.classroom_control * self.weights['classroom_control']
        
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
            'relevance': 'Topic relevance and focus',
            'student_interaction': 'Student interaction and responsiveness',
            'off_topic_management': 'Management of off-topic discussions',
            'classroom_control': 'Classroom control and focus',
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
        Enhanced topic alignment analysis with off-topic tolerance
        """
        relevance_scores = [s.relevance.score for s in segments if hasattr(s, 'relevance')]
        
        if not relevance_scores:
            return {
                'stated_topic': stated_topic,
                'average_relevance': None,
                'topic_drift_count': 0,
                'topic_drift_segments': [],
                'related_topics_bonus': 0.0,
                'alignment_quality': 'Not available (older evaluation)',
                'off_topic_percentage': 0.0,
                'acceptable_deviation': True
            }
        
        avg_relevance = sum(relevance_scores) / len(relevance_scores)
        
        # Detect topic drift with new tolerance
        topic_drift = []
        low_relevance_count = 0
        
        for i, seg in enumerate(segments):
            if hasattr(seg, 'relevance') and seg.relevance.score < 6.0:
                low_relevance_count += 1
                topic_drift.append({
                    'segment_id': i,
                    'score': seg.relevance.score,
                    'reason': seg.relevance.reason
                })
        
        # Calculate off-topic percentage
        off_topic_percentage = low_relevance_count / len(segments) if segments else 0.0
        
        # Determine if deviation is acceptable
        acceptable_deviation = off_topic_percentage <= settings.ACCEPTABLE_OFF_TOPIC_PERCENTAGE
        
        # Calculate related topics bonus
        high_relevance_segments = [s for s in segments if hasattr(s, 'relevance') and s.relevance.score >= 8.0]
        related_bonus = len(high_relevance_segments) / len(segments) * settings.RELATED_TOPIC_BONUS
        
        return {
            'stated_topic': stated_topic,
            'average_relevance': round(avg_relevance, 2),
            'topic_drift_count': len(topic_drift),
            'topic_drift_segments': topic_drift,
            'related_topics_bonus': round(related_bonus, 2),
            'alignment_quality': self._get_alignment_quality(avg_relevance, off_topic_percentage),
            'off_topic_percentage': round(off_topic_percentage * 100, 1),
            'acceptable_deviation': acceptable_deviation
        }
    
    def _get_alignment_quality(self, relevance_score: float, off_topic_pct: float) -> str:
        """Get qualitative assessment of topic alignment with off-topic consideration"""
        if off_topic_pct > settings.OFF_TOPIC_PENALTY_THRESHOLD:
            return f"Poor - Excessive off-topic content ({off_topic_pct*100:.0f}%) without clear educational value"
        elif off_topic_pct > settings.ACCEPTABLE_OFF_TOPIC_PERCENTAGE:
            return f"Acceptable - Moderate off-topic content ({off_topic_pct*100:.0f}%), mostly valuable tangents"
        elif relevance_score >= 8.5:
            return f"Excellent - Highly focused with valuable related content (off-topic: {off_topic_pct*100:.0f}%)"
        elif relevance_score >= 7.5:
            return f"Good - Well-balanced with enriching tangents (off-topic: {off_topic_pct*100:.0f}%)"
        elif relevance_score >= 6.5:
            return f"Acceptable - Generally on-topic with natural deviations (off-topic: {off_topic_pct*100:.0f}%)"
        else:
            return f"Needs Improvement - Topic focus could be stronger"

# Create global instance
scoring_service = ScoringService()