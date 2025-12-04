from typing import Dict, Any, List
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class ExplanationRewriter:
    """
    Rewrites unclear explanations to improve teaching quality
    FIXED VERSION - Now properly generates rewrites
    """
    
    def __init__(self):
        self.clarity_threshold = 7.0
        
    async def rewrite_segment(
        self,
        segment: SegmentEvaluation,
        topic_context: str = ""
    ) -> Dict[str, Any]:
        """
        Rewrite a segment to improve clarity and effectiveness
        
        Args:
            segment: The segment to rewrite
            topic_context: Additional context about the topic being taught
            
        Returns:
            Rewrite comparison with improvements listed
        """
        
        # Check if rewrite is needed
        if segment.clarity.score >= self.clarity_threshold:
            return {
                "needs_rewrite": False,
                "reason": f"Clarity score ({segment.clarity.score}) is acceptable"
            }
        
        # Build rewrite prompt
        prompt = self._build_rewrite_prompt(segment, topic_context)
        
        try:
            print(f"🔄 Generating rewrite for segment {segment.segment_id}")
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='rewrite',
                response_format='json',
                temperature=0.7  # Higher temperature for creative rewriting
            )
            
            # Validate response
            if not response.get('rewritten_text'):
                return {
                    "needs_rewrite": True,
                    "error": "No rewritten text generated",
                    "original_text": segment.text
                }
            
            # Add metadata
            response['segment_id'] = segment.segment_id
            response['original_scores'] = {
                'clarity': segment.clarity.score,
                'structure': segment.structure.score,
                'communication': segment.communication.score,
                'engagement': segment.engagement.score,
                'examples': segment.examples.score
            }
            response['needs_rewrite'] = True
            response['original_text'] = segment.text
            
            # Calculate word count change
            original_words = len(segment.text.split())
            rewritten_words = len(response['rewritten_text'].split())
            response['word_count_change'] = rewritten_words - original_words
            
            print(f"✅ Rewrite generated ({original_words} → {rewritten_words} words)")
            
            return response
            
        except Exception as e:
            print(f"❌ Rewrite failed: {e}")
            return {
                "needs_rewrite": True,
                "error": str(e),
                "original_text": segment.text
            }
    
    async def batch_rewrite_session(
        self,
        segments: List[SegmentEvaluation],
        topic: str
    ) -> List[Dict[str, Any]]:
        """
        Rewrite all low-scoring segments in a session
        
        Args:
            segments: All segments from the session
            topic: The main topic being taught
            
        Returns:
            List of rewrite comparisons
        """
        
        rewrites = []
        
        for segment in segments:
            # Rewrite if clarity is below threshold OR multiple metrics are low
            needs_rewrite = (
                segment.clarity.score < self.clarity_threshold or
                segment.engagement.score < 6.5 or
                segment.examples.score < 6.5 or
                segment.communication.score < 6.5
            )
            
            if needs_rewrite:
                print(f"Processing rewrite for segment {segment.segment_id}")
                rewrite = await self.rewrite_segment(segment, topic)
                if rewrite.get('needs_rewrite') and rewrite.get('rewritten_text'):
                    rewrites.append(rewrite)
        
        return rewrites
    
    def _build_rewrite_prompt(
        self,
        segment: SegmentEvaluation,
        topic_context: str
    ) -> str:
        """Build prompt for rewriting"""
        
        prompt = f"""You are an expert teaching consultant. A teacher explained a concept, but the explanation needs improvement.

TOPIC CONTEXT: {topic_context if topic_context else "Technical/educational topic"}

ORIGINAL EXPLANATION:
"{segment.text}"

CURRENT SCORES:
- Clarity: {segment.clarity.score}/10 - {segment.clarity.reason}
- Structure: {segment.structure.score}/10 - {segment.structure.reason}
- Communication: {segment.communication.score}/10 - {segment.communication.reason}
- Engagement: {segment.engagement.score}/10 - {segment.engagement.reason}
- Examples: {segment.examples.score}/10 - {segment.examples.reason}

Your task: Rewrite this explanation to significantly improve its quality across all dimensions.

IMPROVEMENT GOALS:
1. **Clarity** (Target: 9+/10)
   - Use precise, unambiguous language
   - Define technical terms clearly
   - Break down complex ideas into digestible parts

2. **Structure** (Target: 9+/10)
   - Logical flow from introduction to conclusion
   - Clear transitions between ideas
   - Well-organized progression of concepts

3. **Engagement** (Target: 9+/10)
   - Use interesting examples or analogies
   - Add enthusiasm and energy to the language
   - Make connections to real-world applications

4. **Examples** (Target: 9+/10)
   - Include concrete, relevant examples
   - Use multiple types of examples if helpful
   - Ensure examples clearly illustrate the concept

5. **Communication** (Target: 9+/10)
   - Appropriate vocabulary level
   - Engaging, conversational tone
   - Maintain the teacher's voice while improving clarity

Return as JSON:
{{
  "rewritten_text": "Your significantly improved explanation here (aim for 20-50% longer than original)",
  "improvements": [
    "Specific improvement 1 with before/after example",
    "Specific improvement 2 with before/after example",
    "Specific improvement 3 with before/after example",
    "Specific improvement 4 with before/after example"
  ],
  "key_changes": {{
    "terminology": "How terminology was improved",
    "structure": "How structure was improved",
    "examples": "Examples added or improved",
    "engagement": "How engagement was enhanced"
  }},
  "clarity_improvement": 2.5,
  "structure_improvement": 1.8,
  "engagement_improvement": 2.0,
  "confidence": 0.85
}}

Guidelines:
- Keep it natural and conversational
- Don't make it too formal or academic
- Focus on teaching effectiveness
- Length should be 20-50% longer to add clarity
- Maintain the core concept but improve delivery
- Add examples if the original lacks them
- Use analogies if they help understanding

Rewrite the explanation now:"""
        
        return prompt
    
    async def generate_multiple_versions(
        self,
        segment: SegmentEvaluation,
        num_versions: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple alternative rewrites
        Useful for giving teachers options
        """
        
        versions = []
        
        for i in range(num_versions):
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
        
        current_scores = {
            'clarity': segment.clarity.score,
            'structure': segment.structure.score,
            'engagement': segment.engagement.score,
            'communication': segment.communication.score,
            'examples': segment.examples.score
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
        """Determine rewrite priority based on score"""
        if score < 5.0:
            return "critical"
        elif score < 6.5:
            return "high"
        elif score < 7.5:
            return "medium"
        else:
            return "low"
    
    def _estimate_effort(self, segment: SegmentEvaluation) -> str:
        """Estimate effort needed for rewrite"""
        
        low_scores = sum(1 for metric in [
            segment.clarity.score,
            segment.structure.score,
            segment.engagement.score,
            segment.communication.score,
            segment.examples.score
        ] if metric < 6.5)
        
        if low_scores >= 4:
            return "substantial"
        elif low_scores >= 2:
            return "moderate"
        else:
            return "minor"

# Create global instance
explanation_rewriter = ExplanationRewriter()