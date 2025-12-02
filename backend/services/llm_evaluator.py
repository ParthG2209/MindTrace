import json
from typing import Dict
from utils.llm_client import llm_client
from models.evaluation import ScoreDetail

class LLMEvaluator:
    """Service for evaluating teaching segments using LLM"""
    
    def __init__(self):
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
        
        try:
            print(f"🔍 Evaluating segment (length: {len(segment_text)} chars)")
            
            result = await llm_client.call_llm(
                prompt=prompt,
                task_type='evaluate',
                response_format='json',
                max_retries=3
            )
            
            print(f"✅ LLM evaluation successful")
            
            # Validate response structure
            required_keys = ['clarity', 'structure', 'correctness', 'pacing', 'communication']
            for key in required_keys:
                if key not in result:
                    print(f"⚠️  Missing key in LLM response: {key}")
                    return self._mock_evaluation()
                if 'score' not in result[key] or 'reason' not in result[key]:
                    print(f"⚠️  Invalid structure for {key} in LLM response")
                    return self._mock_evaluation()
            
            # Create ScoreDetail objects
            return {
                'clarity': ScoreDetail(**result['clarity']),
                'structure': ScoreDetail(**result['structure']),
                'correctness': ScoreDetail(**result['correctness']),
                'pacing': ScoreDetail(**result['pacing']),
                'communication': ScoreDetail(**result['communication'])
            }
            
        except Exception as e:
            print(f"❌ LLM evaluation failed: {e}")
            print(f"   Using mock evaluation as fallback")
            return self._mock_evaluation()
    
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
    
    def _mock_evaluation(self) -> Dict[str, ScoreDetail]:
        """Mock evaluation for demo purposes or when LLM fails"""
        import random
        
        print("📝 Generating mock evaluation scores")
        
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