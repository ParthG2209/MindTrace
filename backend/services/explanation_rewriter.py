from typing import Dict, Any, List
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class ExplanationRewriter:
    """
    Rewrites explanations to improve teaching quality and style.
    DISTINCTION: This service acts as the 'Coach'. It centralizes all 
    suggestions and corrections here, keeping the other tools purely diagnostic.
    """
    
    def __init__(self):
        # We offer rewrites/coaching for any segment not considered 'Perfect' (10/10)
        # to ensure the user always sees the suggestions/corrections.
        self.clarity_threshold = 8.5
        
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
        Rewrite a segment and provide specific coaching (Corrections & Suggestions).
        """
        # Safe access to clarity score
        clarity_score = self._get_safe_score(segment, 'clarity')
        
        # We process the segment if it needs improvement OR if we detect potential corrections
        if clarity_score >= self.clarity_threshold:
            return {
                "needs_rewrite": False,
                "reason": f"Clarity score ({clarity_score}) is excellent.",
                "original_text": segment.text
            }
        
        # Build prompt that asks for Rewrites + Corrections + Suggestions
        prompt = self._build_rewrite_prompt(segment, topic_context)
        
        try:
            print(f"🔄 Generating Coaching & Rewrite for segment {segment.segment_id}")
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='rewrite',
                response_format='json',
                temperature=0.7
            )
            
            if not response.get('rewritten_text'):
                return {
                    "needs_rewrite": True,
                    "error": "No rewritten text generated",
                    "original_text": segment.text
                }
            
            # Map the response to our data structure
            response['segment_id'] = segment.segment_id
            response['needs_rewrite'] = True
            response['original_text'] = segment.text
            response['applied_style'] = "Gold Standard (Socratic & Analogical)"
            
            # Ensure the new fields are present (defaults if LLM misses them)
            if 'specific_corrections' not in response:
                response['specific_corrections'] = []
            if 'teaching_suggestions' not in response:
                response['teaching_suggestions'] = []

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
        """
        Build prompt that consolidates Rewriting, Correcting, and Suggesting.
        """
        
        def get_metric_str(name):
            score = self._get_safe_score(segment, name)
            reason = self._get_safe_reason(segment, name)
            return f"{score}/10 - {reason}"

        prompt = f"""You are a World-Class Teaching Coach. You are reviewing a transcript segment.

CONTEXT: {topic_context if topic_context else "Educational Content"}
ORIGINAL TEXT: "{segment.text}"

DIAGNOSTICS:
- Clarity: {get_metric_str('clarity')}
- Engagement: {get_metric_str('engagement')}
- Structure: {get_metric_str('structure')}

Your task is to be the **Sole Source of Improvements**. 
1. **REWRITE** the text to be "Gold Standard" (Clear, Engaging, Socratic).
2. **CORRECT** specific errors found in the original (Grammar, Facts, Logic).
3. **SUGGEST** strategic improvements for the teacher (Pacing, Tone, Technique).

Return a valid JSON object:
{{
  "rewritten_text": "The complete, transformed text.",
  
  "specific_corrections": [
    "Fixed factual error: Python is dynamically typed, not static",
    "Corrected vague pronoun usage in sentence 2",
    "Removed filler words 'um' and 'like'"
  ],
  
  "teaching_suggestions": [
    "Try to use an analogy for this concept next time",
    "Shift from passive voice to active voice to increase energy",
    "Ask a question before explaining to check student knowledge"
  ],
  
  "improvements": [
    "Increased clarity by defining terms upfront",
    "Improved flow by adding transition words"
  ],
  
  "clarity_improvement": 2.5,
  "confidence": 0.9
}}
"""
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
            # Check scores to decide if coaching is needed
            clarity_score = self._get_safe_score(segment, 'clarity')
            engagement_score = self._get_safe_score(segment, 'engagement')
            examples_score = self._get_safe_score(segment, 'examples')
            
            # Broader criteria since we are now the home for ALL suggestions
            needs_coaching = (
                clarity_score < self.clarity_threshold or
                engagement_score < 7.5 or
                examples_score < 7.5
            )
            
            if needs_coaching:
                print(f"Processing coaching for segment {segment.segment_id}")
                rewrite = await self.rewrite_segment(segment, topic)
                if rewrite.get('needs_rewrite') and rewrite.get('rewritten_text'):
                    rewrites.append(rewrite)
        
        return rewrites

    # ... remaining helper methods (generate_multiple_versions, etc.) ...
    # They remain largely the same, reusing rewrite_segment
    async def generate_multiple_versions(
        self,
        segment: SegmentEvaluation,
        num_versions: int = 3
    ) -> List[Dict[str, Any]]:
        versions = []
        for i in range(num_versions):
            rewrite = await self.rewrite_segment(segment, "")
            if rewrite.get('rewritten_text'):
                rewrite['version_number'] = i + 1
                versions.append(rewrite)
        return versions
    
    def calculate_improvement_potential(self, segment: SegmentEvaluation) -> Dict[str, Any]:
        current_scores = {
            'clarity': self._get_safe_score(segment, 'clarity'),
            'structure': self._get_safe_score(segment, 'structure'),
            'engagement': self._get_safe_score(segment, 'engagement'),
            'communication': self._get_safe_score(segment, 'communication'),
            'examples': self._get_safe_score(segment, 'examples')
        }
        
        potential_gains = {key: 10.0 - score for key, score in current_scores.items()}
        avg_current = sum(current_scores.values()) / len(current_scores)
        
        return {
            "current_scores": current_scores,
            "potential_gains": potential_gains,
            "current_average": round(avg_current, 2),
            "improvement_priority": "high" if avg_current < 7.0 else "medium",
            "estimated_effort": "moderate"
        }

# Create global instance
explanation_rewriter = ExplanationRewriter()