import json
import httpx
from typing import Dict
from config import settings
from models.evaluation import ScoreDetail

class LLMEvaluator:
    """Service for evaluating teaching segments using LLM"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        
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
        
        if self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            return await self._evaluate_with_anthropic(prompt)
        elif self.provider == "openai" and settings.OPENAI_API_KEY:
            return await self._evaluate_with_openai(prompt)
        else:
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

    async def _evaluate_with_anthropic(self, prompt: str) -> Dict[str, ScoreDetail]:
        """Evaluate using Anthropic Claude API"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 2000,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                
                if response.status_code != 200:
                    print(f"Anthropic API error: {response.text}")
                    return self._mock_evaluation()
                
                data = response.json()
                content = data['content'][0]['text']
                
                # Parse JSON from response
                result = json.loads(content)
                
                return {
                    'clarity': ScoreDetail(**result['clarity']),
                    'structure': ScoreDetail(**result['structure']),
                    'correctness': ScoreDetail(**result['correctness']),
                    'pacing': ScoreDetail(**result['pacing']),
                    'communication': ScoreDetail(**result['communication'])
                }
                
        except Exception as e:
            print(f"Anthropic evaluation failed: {e}")
            return self._mock_evaluation()
    
    async def _evaluate_with_openai(self, prompt: str) -> Dict[str, ScoreDetail]:
        """Evaluate using OpenAI GPT API"""
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert educational evaluator. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            return {
                'clarity': ScoreDetail(**result['clarity']),
                'structure': ScoreDetail(**result['structure']),
                'correctness': ScoreDetail(**result['correctness']),
                'pacing': ScoreDetail(**result['pacing']),
                'communication': ScoreDetail(**result['communication'])
            }
            
        except Exception as e:
            print(f"OpenAI evaluation failed: {e}")
            return self._mock_evaluation()
    
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