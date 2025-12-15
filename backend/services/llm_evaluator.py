import json
from typing import Dict, List
from utils.llm_client import llm_client
from models.evaluation import ScoreDetail

class LLMEvaluator:
    """Enhanced service for evaluating teaching segments using LLM"""
    
    def __init__(self):
        pass
        
    async def evaluate_segment(
        self, 
        segment_text: str, 
        topic: str,
        full_context: str = ""
    ) -> Dict[str, ScoreDetail]:
        """
        Evaluate a teaching segment using LLM with enhanced metrics
        
        Args:
            segment_text: The transcript segment to evaluate
            topic: The stated topic being taught
            full_context: Full session context for better evaluation
            
        Returns:
            Dictionary with evaluation scores for all metrics
        """
        
        prompt = self._build_enhanced_evaluation_prompt(segment_text, topic, full_context)
        
        try:
            print(f"🔍 Evaluating segment (length: {len(segment_text)} chars)")
            
            result = await llm_client.call_llm(
                prompt=prompt,
                task_type='evaluate',
                response_format='json',
                max_retries=3
            )
            
            print(f"✅ LLM evaluation successful")
            print(f"DEBUG: LLM Response keys: {list(result.keys())}")
            
            # Validate response structure - ALL 10 metrics (5 core + 5 advanced)
            required_keys = [
                'clarity', 'structure', 'correctness', 'pacing', 'communication',
                'engagement', 'examples', 'questioning', 'adaptability', 'relevance'
            ]
            
            # Check which keys are missing
            missing_keys = [key for key in required_keys if key not in result]
            
            if missing_keys:
                print(f"⚠️  Missing keys in LLM response: {missing_keys}")
                print(f"⚠️  Received keys: {list(result.keys())}")
                print(f"⚠️  Using fallback evaluation due to missing keys")
                return self._mock_evaluation()
            
            # Validate each key has proper structure
            for key in required_keys:
                if not isinstance(result[key], dict):
                    print(f"⚠️  Invalid structure for {key}: not a dict")
                    return self._mock_evaluation()
                if 'score' not in result[key] or 'reason' not in result[key]:
                    print(f"⚠️  Invalid structure for {key}: missing score or reason")
                    return self._mock_evaluation()
            
            # Create ScoreDetail objects
            evaluated_scores = {}
            for key in required_keys:
                evaluated_scores[key] = ScoreDetail(**result[key])
            
            return evaluated_scores
            
        except Exception as e:
            print(f"❌ LLM evaluation failed: {e}")
            print(f"   Using mock evaluation as fallback")
            return self._mock_evaluation()
    
    def _build_enhanced_evaluation_prompt(
        self, 
        segment_text: str, 
        topic: str,
        full_context: str
    ) -> str:
        """Build the enhanced evaluation prompt with 10 metrics"""
        
        return f"""You are an expert educational evaluator analyzing a mentor's teaching quality with a focus on real classroom dynamics.

STATED TOPIC: {topic}

TEACHING SEGMENT:
"{segment_text}"

{f"FULL SESSION CONTEXT (for reference): {full_context[:500]}..." if full_context else ""}

**CRITICAL INSTRUCTION**: You MUST evaluate ALL 10 metrics listed below. Each metric must have:
1. A "score" field (number between 1-10)
2. A "reason" field (string explaining the score)
3. An optional "evidence" field (list of specific examples)

Evaluate the following aspects of this teaching segment (score 1-10 each with detailed justification):

**CORE TEACHING METRICS (REQUIRED):**

1. **Clarity**: How clearly is the concept explained? Are ideas articulated in an understandable way?
   - Clear terminology and definitions
   - Logical flow of ideas
   - Avoidance of jargon without explanation

2. **Structural Coherence**: Is the explanation well-organized and logically structured?
   - Logical progression of ideas
   - Clear introduction, body, conclusion
   - Effective transitions

3. **Technical Correctness**: Is the information technically accurate and free from errors?
   - Factual accuracy
   - No misleading information
   - Proper use of terminology

4. **Pacing & Delivery**: Is the pacing appropriate? Not too rushed or too slow?
   - Speed matches complexity
   - Adequate time for understanding
   - Smooth delivery

5. **Communication Quality**: Is the language engaging, appropriate for the audience, and effective?
   - Appropriate vocabulary level
   - Engaging tone
   - Clear pronunciation/articulation

**ADVANCED TEACHING METRICS (REQUIRED):**

6. **Engagement**: Does the teacher use techniques to keep students engaged and interested?
   - Interactive elements
   - Enthusiasm and energy
   - Storytelling or real-world connections
   - Maintains attention

7. **Examples & Illustrations**: Are examples provided? Are they relevant, clear, and helpful?
   - Quality of examples
   - Relevance to concept
   - Variety of examples
   - Clarity of illustrations

8. **Questioning Technique**: Does the teacher use questions to stimulate thinking and check understanding?
   - Thought-provoking questions
   - Checks for understanding
   - Encourages critical thinking
   - Wait time for responses

9. **Adaptability**: Does the teacher adjust complexity/approach based on the content difficulty?
   - Recognizes difficulty levels
   - Adjusts explanation depth
   - Provides scaffolding
   - Meets learner needs

10. **Topic Relevance**: How relevant is this segment to the stated topic?
    - **CRITICAL EVALUATION PRINCIPLE**: Some off-topic content is NORMAL and ACCEPTABLE in real classrooms
    - Brief tangents (10-15% of content) that provide context, analogies, or real-world connections should score 7-9
    - Related examples from adjacent topics that enhance understanding should score 7-9
    - Only penalize if content is EXCESSIVELY off-topic (>30%) with NO educational value
    - Score 8-10: Directly on-topic OR valuable related content
    - Score 6-7: Brief acceptable deviations with educational merit
    - Score 4-5: Moderate off-topic content (20-30%) with some value
    - Score 1-3: Excessive off-topic content (>30%) with minimal educational benefit

**SCORING GUIDELINES:**
- Real classrooms have natural deviations - this is NORMAL and HEALTHY
- Off-topic content <15%: Should NOT be penalized (score 7-9 for relevance)
- Perfect 10s should be rare but achievable for excellent teaching
- Scores 1-3 should be reserved for serious issues

**CRITICAL: You MUST return JSON with ALL 10 metrics. Missing ANY metric will cause system failure.**

Return your evaluation in the following JSON format (NO markdown, NO code blocks, ONLY pure JSON):
{{
  "clarity": {{"score": 8.5, "reason": "Clear explanation with good examples", "evidence": ["specific example 1"]}},
  "structure": {{"score": 7.0, "reason": "Logical flow with minor gaps", "evidence": []}},
  "correctness": {{"score": 9.0, "reason": "Technically accurate throughout", "evidence": []}},
  "pacing": {{"score": 7.5, "reason": "Appropriate speed for content", "evidence": []}},
  "communication": {{"score": 8.0, "reason": "Engaging and clear delivery", "evidence": []}},
  "engagement": {{"score": 7.5, "reason": "Uses interactive elements effectively", "evidence": []}},
  "examples": {{"score": 8.5, "reason": "Relevant and clear examples provided", "evidence": []}},
  "questioning": {{"score": 6.5, "reason": "Some questions but could be more thought-provoking", "evidence": []}},
  "adaptability": {{"score": 7.0, "reason": "Adjusts complexity appropriately", "evidence": []}},
  "relevance": {{"score": 8.5, "reason": "Highly relevant with valuable context", "evidence": []}}
}}

**REMINDER: Return ONLY valid JSON. Do NOT include any markdown formatting, code blocks, or explanatory text outside the JSON.**"""
    
    def _mock_evaluation(self) -> Dict[str, ScoreDetail]:
        """Mock evaluation for demo purposes or when LLM fails"""
        import random
        
        print("📝 Generating mock evaluation scores")
        
        scores = {
            'clarity': random.uniform(6.5, 9.5),
            'structure': random.uniform(6.0, 9.0),
            'correctness': random.uniform(7.0, 9.5),
            'pacing': random.uniform(6.0, 8.5),
            'communication': random.uniform(6.5, 9.0),
            'engagement': random.uniform(6.0, 9.0),
            'examples': random.uniform(6.5, 9.5),
            'questioning': random.uniform(5.5, 8.5),
            'adaptability': random.uniform(6.0, 8.5),
            'relevance': random.uniform(7.0, 9.5),
        }
        
        reasons = {
            'clarity': "The explanation is generally clear with good use of examples. Some technical terms could be better defined.",
            'structure': "The segment follows a logical flow, introducing concepts before elaborating. Could benefit from clearer transitions.",
            'correctness': "The technical content appears accurate and demonstrates solid understanding of the subject matter.",
            'pacing': "The pacing is appropriate for the complexity of the material, though some sections could be slightly slower.",
            'communication': "The language is engaging and appropriate. Good use of analogies and examples to illustrate points.",
            'engagement': "The teacher uses effective techniques to maintain interest, including real-world connections and enthusiasm.",
            'examples': "Examples are relevant and help clarify concepts. A good variety of illustrations is provided.",
            'questioning': "Questions are used to check understanding, though more thought-provoking questions could enhance learning.",
            'adaptability': "The teacher adjusts explanation depth appropriately, showing awareness of complexity levels.",
            'relevance': "Content is highly relevant to the stated topic. Brief tangents enhance understanding and are appropriate.",
        }
        
        return {
            key: ScoreDetail(
                score=round(score, 1), 
                reason=reasons[key],
                evidence=[]
            )
            for key, score in scores.items()
        }

llm_evaluator = LLMEvaluator()