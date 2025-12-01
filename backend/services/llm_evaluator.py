import json
# ===== REMOVED: Old imports =====
# import httpx
# from typing import Dict
# from config import settings
# ===== END REMOVED =====

# ===== NEW: Import unified LLM client =====
from typing import Dict
from utils.llm_client import llm_client
# ===== END NEW =====

from models.evaluation import ScoreDetail

class LLMEvaluator:
    """Service for evaluating teaching segments using LLM"""
    
    def __init__(self):
        # ===== REMOVED: Old provider config =====
        # self.provider = settings.LLM_PROVIDER
        # self.model = settings.LLM_MODEL
        # ===== END REMOVED =====
        pass
        
    async def evaluate_segment(self, segment_text: str, topic: str) -> Dict[str, ScoreDetail]:
        """
        Evaluate a teaching segment using LLM
        
        Args:
            segment_text: The transcript segment to evaluate
            topic: The topic being taught
            
        Returns:
            Dictionary with evaluation scores for each criterion
        """
        
        prompt = self._build_evaluation_prompt(segment_text, topic)
        
        # ===== NEW: Use unified LLM client =====
        try:
            result = await llm_client.call_llm(
                prompt=prompt,
                task_type='evaluate',
                response_format='json'
            )
            
            return {
                'clarity': ScoreDetail(**result['clarity']),
                'structure': ScoreDetail(**result['structure']),
                'correctness': ScoreDetail(**result['correctness']),
                'pacing': ScoreDetail(**result['pacing']),
                'communication': ScoreDetail(**result['communication'])
            }
        except Exception as e:
            print(f"LLM evaluation failed: {e}")
            return self._mock_evaluation()
        # ===== END NEW =====
        
        # ===== REMOVED: Old provider-specific logic =====
        # if self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        #     return await self._evaluate_with_anthropic(prompt)
        # elif self.provider == "openai" and settings.OPENAI_API_KEY:
        #     return await self._evaluate_with_openai(prompt)
        # else:
        #     return self._mock_evaluation()
        # ===== END REMOVED =====
    
    def _build_evaluation_prompt(self, segment_text: str, topic: str) -> str:
        """Build the evaluation prompt"""
        return f"""You are an expert educational evaluator analyzing a mentor's teaching quality.

Topic: {topic}

Transcript Segment:
"{segment_text}"

Evaluate the following aspects of this teaching segment (score 1-10 each with detailed justification):

1. **Clarity**: How clearly is the concept explained? Are ideas articulated in an understandable way?
2. **Structural Coherence**: Is the explanation well-organized and logically structured?
3. **Technical Correctness**: Is the information technically accurate and free from errors?
4. **Pacing & Delivery**: Is the pacing appropriate? Not too rushed or too slow?
5. **Communication Quality**: Is the language engaging, appropriate for the audience, and effective?

Return your evaluation in the following JSON format:
{{
  "clarity": {{"score": <1-10>, "reason": "<detailed explanation>"}},
  "structure": {{"score": <1-10>, "reason": "<detailed explanation>"}},
  "correctness": {{"score": <1-10>, "reason": "<detailed explanation>"}},
  "pacing": {{"score": <1-10>, "reason": "<detailed explanation>"}},
  "communication": {{"score": <1-10>, "reason": "<detailed explanation>"}}
}}

Provide ONLY the JSON response, no additional text."""

    # ===== REMOVED: Provider-specific methods =====
    # async def _evaluate_with_anthropic(self, prompt: str) -> Dict[str, ScoreDetail]:
    # async def _evaluate_with_openai(self, prompt: str) -> Dict[str, ScoreDetail]:
    # ===== END REMOVED =====
    
    def _mock_evaluation(self) -> Dict[str, ScoreDetail]:
        """Mock evaluation for demo purposes"""
        import random
        
        scores = {
            'clarity': random.uniform(6.5, 9.5),
            'structure': random.uniform(6.0, 9.0),
            'correctness': random.uniform(7.0, 9.5),
            'pacing': random.uniform(6.0, 8.5),
            'communication': random.uniform(6.5, 9.0)
        }
        
        reasons = {
            'clarity': "The explanation is generally clear with good use of examples. Some technical terms could be better defined.",
            'structure': "The segment follows a logical flow, introducing concepts before elaborating. Could benefit from clearer transitions.",
            'correctness': "The technical content appears accurate and demonstrates solid understanding of the subject matter.",
            'pacing': "The pacing is appropriate for the complexity of the material, though some sections could be slightly slower.",
            'communication': "The language is engaging and appropriate. Good use of analogies and examples to illustrate points."
        }
        
        return {
            key: ScoreDetail(score=round(score, 1), reason=reasons[key])
            for key, score in scores.items()
        }

llm_evaluator = LLMEvaluator()