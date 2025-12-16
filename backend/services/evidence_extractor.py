from typing import Dict, Any, List
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class ExplanationRewriter:
    """
    Rewrites explanations to improve teaching quality and style.
    DISTINCTION: This service acts as a 'Coach'. It focuses on transformation,
    style transfer, and generating superior, creative versions of the content.
    FIXED VERSION - Robust against missing metrics/scores.
    """
    
    def __init__(self):
        # We offer rewrites even for 'okay' segments (up to 8.0) to provide a 'Gold Standard' alternative
        self.clarity_threshold = 8.0 
        
    def _get_safe_score(self, segment: SegmentEvaluation, metric_name: str, default: float = 0.0) -> float:
        """Helper to safely get a score from a metric that might be None"""
        metric_obj = getattr(segment, metric_name, None)
        if metric_obj and hasattr(metric_obj, 'score'):
            return metric_obj.score
        return default

    def _get_safe_reason(self, segment: SegmentEvaluation, metric_name: str, default: str = "N/A") -> str:
        """Helper to safely get a reason from a metric that might be None"""
        metric_obj = getattr(segment, metric_name, None)
        if metric_obj and hasattr(metric_obj, 'reason'):
            return metric_obj.reason
        return default

    async def rewrite_segment(
        self,
        segment: SegmentEvaluation,
        topic_context: str = ""
    ) -> Dict[str, Any]:
        """
        Rewrite a segment to improve clarity and effectiveness using specific teaching styles.
        """
        # Safe access to clarity score
        clarity_score = self._get_safe_score(segment, 'clarity')
        
        # Check if rewrite is needed (using the higher threshold for "Gold Standard" coaching)
        if clarity_score >= self.clarity_threshold:
            return {
                "needs_rewrite": False,
                "reason": f"Clarity score ({clarity_score}) is already excellent",
                "original_text": segment.text
            }
        
        # Build rewrite prompt with specific "Style" instructions
        prompt = self._build_rewrite_prompt(segment, topic_context)
        
        try:
            print(f"🔄 Generating transformation for segment {segment.segment_id}")
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='rewrite',
                response_format='json',
                temperature=0.7 # Higher temperature for creative rewriting
            )
            
            # Validate response
            if not response.get('rewritten_text'):
                return {
                    "needs_rewrite": True,
                    "error": "No rewritten text generated",
                    "original_text": segment.text
                }
            
            # Add metadata and safe scores
            response['segment_id'] = segment.segment_id
            response['needs_rewrite'] = True
            response['original_text'] = segment.text
            response['applied_style'] = "Gold Standard (Socratic & Analogical)"
            
            response['original_scores'] = {
                'clarity': clarity_score,
                'structure': self._get_safe_score(segment, 'structure'),
                'communication': self._get_safe_score(segment, 'communication'),
                'engagement': self._get_safe_score(segment, 'engagement'),
                'examples': self._get_safe_score(segment, 'examples')
            }
            
            # Calculate word count change
            original_words = len(segment.text.split()) if segment.text else 0
            rewritten_words = len(response['rewritten_text'].split()) if response.get('rewritten_text') else 0
            response['word_count_change'] = rewritten_words - original_words
            
            print(f"✅ Transformation complete ({original_words} → {rewritten_words} words)")
            
            return response
            
        except Exception as e:
            print(f"❌ Rewrite failed: {e}")
            return {
                "needs_rewrite": True,
                "error": str(e),
                "original_text": segment.text
            }
    
    def _build_rewrite_prompt(
        self,
        segment: SegmentEvaluation,
        topic_context: str
    ) -> str:
        """Build prompt for rewriting that focuses on stylistic transformation."""
        
        # Helper for prompt string generation
        def get_metric_str(name):
            score = self._get_safe_score(segment, name)
            reason = self._get_safe_reason(segment, name)
            return f"{score}/10 - {reason}"

        prompt = f"""You are a World-Class Teaching Coach. You have been given a transcript segment that needs to be transformed into a perfect, engaging explanation.

CONTEXT/TOPIC: {topic_context if topic_context else "Educational Content"}
ORIGINAL TEXT: "{segment.text}"

CURRENT DIAGNOSTICS:
- Clarity: {get_metric_str('clarity')}
- Engagement: {get_metric_str('engagement')}

Your task is to generate a 'Gold Standard' version of this explanation.
Do not just fix grammar. Completely restructure the delivery to be more engaging and clear. This is the **Rewriting/Transformation** tool.

Perform the following stylistic transformations:
1. **Analogy Injection**: If the concept is abstract, weave in a concrete real-world analogy (e.g., explaining a 'loop' using a 'recipe that repeats').
2. **Socratic Pivot**: Instead of just lecturing, rephrase key points as engaging questions that guide the student to the answer.
3. **Pacing and Conciseness**: Remove all filler words and make the explanation punchy and direct.

Return only a valid JSON object:
{{
  "rewritten_text": "The complete, transformed text that implements the styles above.",
  "transformation_notes": [
    "Added analogy about [X] to explain [Y]",
    "Converted passive explanation into Socratic questions",
    "Removed [specific fluff] to improve pacing"
  ],
  "tone_shift": "From [Original Tone] to [New Tone]",
  "estimated_clarity_lift": "+2.5 points",
  "confidence": 0.9
}}

Make the rewrite significantly distinct from the original while preserving technical accuracy."""
        
        return prompt
    
    async def batch_rewrite_session(
        self,
        segments: List[SegmentEvaluation],
        topic: str
    ) -> List[Dict[str, Any]]:
        """
        Rewrite all segments that can be significantly improved
        """
        rewrites = []
        
        for segment in segments:
            # Completely safe score extraction
            clarity_score = self._get_safe_score(segment, 'clarity')
            engagement_score = self._get_safe_score(segment, 'engagement')
            examples_score = self._get_safe_score(segment, 'examples')
            comm_score = self._get_safe_score(segment, 'communication')
            
            # Rewrite if clarity is below our high threshold OR multiple metrics are low
            needs_rewrite = (
                clarity_score < self.clarity_threshold or
                engagement_score < 7.0 or
                examples_score < 7.0 or
                comm_score < 7.0
            )
            
            if needs_rewrite:
                print(f"Processing transformation for segment {segment.segment_id} (Clarity: {clarity_score})")
                rewrite = await self.rewrite_segment(segment, topic)
                if rewrite.get('needs_rewrite') and rewrite.get('rewritten_text'):
                    rewrites.append(rewrite)
        
        return rewrites
    
    async def generate_multiple_versions(
        self,
        segment: SegmentEvaluation,
        num_versions: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple alternative rewrites to give teachers options
        """
        versions = []
        for i in range(num_versions):
            # We can rely on the high temperature to give variations
            rewrite = await self.rewrite_segment(segment, "")
            if rewrite.get('rewritten_text'):
                rewrite['version_number'] = i + 1
                versions.append(rewrite)
        return versions
    
    def calculate_improvement_potential(
        self,
        segment: SegmentEvaluation
    ) -> Dict[str, Any]:
        """
        Estimate how much improvement is possible
        """
        # Safe score extraction
        current_scores = {
            'clarity': self._get_safe_score(segment, 'clarity'),
            'structure': self._get_safe_score(segment, 'structure'),
            'engagement': self._get_safe_score(segment, 'engagement'),
            'communication': self._get_safe_score(segment, 'communication'),
            'examples': self._get_safe_score(segment, 'examples')
        }
        
        potential_gains = {
            key: 10.0 - score for key, score in current_scores.items()
        }
        
        avg_current = sum(current_scores.values()) / len(current_scores)
        avg_potential = sum(potential_gains.values()) / len(potential_gains)
        
        return {
            "current_scores": current_scores,
            "potential_gains": potential_gains,
            "current_average": round(avg_current, 2),
            "max_possible": 10.0,
            "average_potential_gain": round(avg_potential, 2),
            "improvement_priority": self._get_priority_level(avg_current),
            "estimated_effort": self._estimate_effort(segment)
        }
    
    def _get_priority_level(self, score: float) -> str:
        if score < 5.0: return "critical"
        elif score < 6.5: return "high"
        elif score < 8.0: return "medium" # Adjusted for higher standards
        else: return "low"
    
    def _estimate_effort(self, segment: SegmentEvaluation) -> str:
        low_scores = sum(1 for metric in [
            self._get_safe_score(segment, 'clarity'),
            self._get_safe_score(segment, 'structure'),
            self._get_safe_score(segment, 'engagement'),
            self._get_safe_score(segment, 'communication'),
            self._get_safe_score(segment, 'examples')
        ] if metric < 7.0)
        
        if low_scores >= 4: return "substantial"
        elif low_scores >= 2: return "moderate"
        else: return "minor"

# Create global instance
explanation_rewriter = ExplanationRewriter()