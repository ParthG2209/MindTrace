from typing import Dict, Any, List
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class ExplanationRewriter:
    """
    Rewrites unclear explanations to improve teaching quality
    Maintains teaching goals while improving delivery
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
                "reason": "Clarity score is acceptable"
            }
        
        # Build rewrite prompt
        prompt = self._build_rewrite_prompt(segment, topic_context)
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='rewrite',
                response_format='json',
                temperature=0.7
            )
            
            # Add metadata
            response['segment_id'] = segment.segment_id
            response['original_scores'] = {
                'clarity': segment.clarity.score,
                'structure': segment.structure.score,
                'communication': segment.communication.score
            }
            response['needs_rewrite'] = True
            
            return response
            
        except Exception as e:
            print(f"Rewrite failed: {e}")
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
            if segment.clarity.score < self.clarity_threshold:
                rewrite = await self.rewrite_segment(segment, topic)
                if rewrite.get('needs_rewrite'):
                    rewrites.append(rewrite)
        
        return rewrites
    
    def compare_versions(
        self,
        original: str,
        rewritten: str
    ) -> Dict[str, Any]:
        """
        Compare original and rewritten versions
        Highlights key differences
        """
        
        return {
            "original_length": len(original.split()),
            "rewritten_length": len(rewritten.split()),
            "length_change": len(rewritten.split()) - len(original.split()),
            "original_sentences": original.count('.') + original.count('!') + original.count('?'),
            "rewritten_sentences": rewritten.count('.') + rewritten.count('!') + rewritten.count('?')
        }
    
    def _build_rewrite_prompt(
        self,
        segment: SegmentEvaluation,
        topic_context: str
    ) -> str:
        """Build prompt for rewriting"""
        
        prompt = f"""You are an expert teaching consultant. A teacher explained a concept, but the explanation was unclear (clarity score: {segment.clarity.score}/10).

TOPIC CONTEXT: {topic_context if topic_context else "General programming/technical topic"}

ORIGINAL EXPLANATION:
"{segment.text}"

CLARITY ISSUE:
{segment.clarity.reason}

STRUCTURE ISSUE:
{segment.structure.reason}

Your task: Rewrite this explanation to make it MUCH clearer and more effective.

Goals:
1. Maintain the same teaching objective
2. Improve clarity significantly (target: 9+/10)
3. Better structure and flow
4. Use concrete examples where helpful
5. Define technical terms clearly
6. Use analogies if appropriate
7. Break down complex ideas step-by-step

Return as JSON:
{{
  "rewritten_text": "Your improved explanation here",
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ],
  "key_changes": {{
    "terminology": "How terminology was improved",
    "structure": "How structure was improved",
    "examples": "Examples added or improved"
  }},
  "estimated_clarity_improvement": 2.5,
  "confidence": 0.85
}}

Guidelines:
- Keep it natural and conversational
- Don't make it too formal or academic
- Focus on teaching effectiveness
- Length should be similar (within 50%)
- Maintain the teacher's voice where possible

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
        
        current_score = segment.clarity.score
        potential_gain = 10.0 - current_score
        
        return {
            "current_clarity": current_score,
            "max_possible": 10.0,
            "potential_gain": potential_gain,
            "improvement_priority": self._get_priority_level(current_score),
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
        
        issues = []
        if segment.clarity.score < 6.0:
            issues.append("clarity")
        if segment.structure.score < 6.0:
            issues.append("structure")
        if segment.correctness.score < 8.0:
            issues.append("correctness")
        
        if len(issues) >= 3:
            return "substantial"
        elif len(issues) == 2:
            return "moderate"
        else:
            return "minor"

# Create global instance
explanation_rewriter = ExplanationRewriter()
