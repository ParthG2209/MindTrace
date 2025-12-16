from typing import List, Dict, Any
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class CoherenceChecker:
    """
    Analyzes entire teaching sessions for coherence issues.
    DISTINCTION: This service acts as the 'Architect'. It ONLY looks at the 
    relationships BETWEEN segments (flow, contradictions, gaps). 
    It explicitly ignores sentence-level errors (grammar, phrasing), focusing 
    purely on the macro-structure and logic map of the session.
    """
    
    def __init__(self):
        self.min_coherence_score = 7.0
        
    async def check_coherence(
        self,
        segments: List[SegmentEvaluation],
        topic: str
    ) -> Dict[str, Any]:
        """
        Comprehensive coherence analysis of entire session (Macro-Level)
        """
        
        # Filter valid segments only
        valid_segments = [s for s in segments if s and s.text]
        
        if not valid_segments or len(valid_segments) < 2:
             return {
                "session_coherence_score": 10.0,
                "contradictions": [],
                "topic_drifts": [],
                "logical_gaps": [],
                "overall_assessment": "Insufficient data for coherence analysis."
            }

        print(f"🔍 Architect is analyzing structure across {len(valid_segments)} segments")
        
        # Check for macro-level structural issues
        contradictions = await self.detect_contradictions(valid_segments)
        topic_drifts = await self.detect_topic_drift(valid_segments, topic)
        logical_gaps = await self.detect_logical_gaps(valid_segments)
        
        # Calculate overall coherence score
        coherence_score = self._calculate_coherence_score(
            contradictions,
            topic_drifts,
            logical_gaps
        )
        
        report = {
            "session_coherence_score": coherence_score,
            "contradictions": contradictions,
            "topic_drifts": topic_drifts,
            "logical_gaps": logical_gaps,
            "overall_assessment": self._generate_assessment(
                coherence_score,
                len(contradictions),
                len(topic_drifts),
                len(logical_gaps)
            )
        }
        
        print(f"✅ Coherence map complete. Score: {coherence_score}/10")
        
        return report
    
    def _combine_segments_for_llm(self, segments: List[SegmentEvaluation]) -> str:
        """Formats the transcript for the LLM to analyze macro-flow."""
        combined = []
        for seg in segments:
            combined.append(f"[SEGMENT {seg.segment_id}]: {seg.text}")
        return "\n\n".join(combined)
    
    async def detect_contradictions(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect statements that logically contradict each other (Macro-Consistency).
        """
        combined_text = self._combine_segments_for_llm(segments)
        
        prompt = f"""Analyze this teaching session for **MACRO-LEVEL CONTRADICTIONS**.

SESSION TEXT:
{combined_text}

DISTINCTION RULES (MUST FOLLOW):
1. **IGNORE** grammar, spelling, or poor phrasing (that is for the Evidence tool).
2. **IGNORE** weak or unclear single explanations (that is for the Rewrite tool).
3. **ONLY** flag instances where the content of one segment logically conflicts with the content of another segment. The focus is on **Factual/Conceptual Conflicts**.

Example of what to find:
- Segment 5 says "Python is statically typed" BUT Segment 10 says "Python is dynamically typed".

Return as JSON:
{{
  "contradictions": [
    {{
      "segment1_id": 2,
      "segment2_id": 5,
      "statement1": "exact quote from segment 2",
      "statement2": "exact quote from segment 5 that contradicts",
      "contradiction_type": "direct_opposition | conflicting_info",
      "severity": "minor | moderate | major",
      "explanation": "Clear explanation of the logical conflict",
      "resolution": "How to resolve this contradiction"
    }}
  ]
}}

Only report ACTUAL logical contradictions. If none, return empty array."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.1 # Low temp for factual consistency check
            )
            return response.get('contradictions', [])
        except Exception as e:
            print(f"❌ Contradiction detection failed: {e}")
            return []
    
    async def detect_topic_drift(
        self,
        segments: List[SegmentEvaluation],
        main_topic: str
    ) -> List[Dict[str, Any]]:
        """
        Detect when the lesson structure breaks due to drift (Macro-Focus).
        """
        combined_text = self._combine_segments_for_llm(segments)
        
        prompt = f"""Analyze this teaching session for **MACRO-LEVEL TOPIC DRIFT**.

MAIN TOPIC: {main_topic}

SESSION TEXT:
{combined_text}

Your task is to identify segments that break the **structural integrity** of the lesson by drifting into unrelated territory.

DISTINCTION RULES:
1. **IGNORE** small tangents or colorful examples if they relate to the topic.
2. **FLAG** only when the teacher completely abandons the learning objective for something unrelated.

Return as JSON:
{{
  "topic_drifts": [
    {{
      "segment_id": 3,
      "expected_topic": "{main_topic}",
      "actual_content": "Brief description of the drift content",
      "drift_degree": 0.8,
      "relevance_score": 0.1,
      "impact": "How this breaks the lesson flow",
      "suggestion": "How to bring it back on track"
    }}
  ]
}}

drift_degree: 0.0 (on topic) to 1.0 (completely lost)
relevance_score: 0.0 (useless) to 1.0 (useful context)

Only report significant drift (degree > 0.6 AND relevance < 0.3)."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.2
            )
            return response.get('topic_drifts', [])
        except Exception as e:
            print(f"❌ Topic drift detection failed: {e}")
            return []
    
    async def detect_logical_gaps(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect missing steps or unexplained jumps in logic (Macro-Flow).
        """
        combined_text = self._combine_segments_for_llm(segments)
        
        prompt = f"""Analyze the **SEQUENCING and FLOW** of this session for LOGICAL GAPS.

SESSION TEXT:
{combined_text}

Your task is to find "**Missing Bridges**". This occurs when the teacher jumps abruptly from one high-level concept to another without providing the necessary prerequisite explanation or transition.

DISTINCTION RULES:
1. **IGNORE** the quality of the text within a single segment (no grammar/clarity checks).
2. **FOCUS** purely on the **FLOW** of ideas between Segment X and Segment Y.
3. Flag "Leaps of Logic" where a student would get lost because a step was skipped.

Return as JSON:
{{
  "logical_gaps": [
    {{
      "between_segment1": 2,
      "between_segment2": 3,
      "gap_type": "missing_step | undefined_concept | unexplained_jump",
      "missing_concept": "The concept that should have been explained between these two",
      "impact": "Why the student is now lost",
      "severity": "minor | moderate | major",
      "fill_suggestion": "What concept needs to be inserted here"
    }}
  ]
}}"""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.2
            )
            return response.get('logical_gaps', [])
        except Exception as e:
            print(f"❌ Logical gap detection failed: {e}")
            return []
    
    def _calculate_coherence_score(
        self,
        contradictions: List,
        topic_drifts: List,
        logical_gaps: List
    ) -> float:
        """
        Calculate overall coherence score based on macro issues found.
        """
        score = 10.0
        
        # Deduct for contradictions (High penalty for logic breaks)
        for contradiction in contradictions:
            severity = contradiction.get('severity', 'moderate')
            if severity == 'major': score -= 2.0
            elif severity == 'moderate': score -= 1.0
            else: score -= 0.5
        
        # Deduct for drift (Weighted by irrelevance)
        for drift in topic_drifts:
            drift_degree = drift.get('drift_degree', 0.5)
            relevance_score = drift.get('relevance_score', 0.5)
            penalty = drift_degree * (1 - relevance_score) * 1.5
            score -= penalty
        
        # Deduct for gaps (Flow breaks)
        for gap in logical_gaps:
            severity = gap.get('severity', 'moderate')
            if severity == 'major': score -= 1.5
            elif severity == 'moderate': score -= 0.8
            else: score -= 0.4
        
        return max(0.0, round(score, 1))
    
    def _generate_assessment(
        self,
        score: float,
        num_contradictions: int,
        num_drifts: int,
        num_gaps: int
    ) -> str:
        """Generate human-readable assessment of the session structure."""
        
        total_issues = num_contradictions + num_drifts + num_gaps
        
        if score >= 9.0:
            return "Excellent Structural Integrity. The lesson flows logically with a solid map of concepts."
        elif score >= 7.5:
            return f"Good Flow. The structure is sound, with only {total_issues} minor disconnects in the logic."
        elif score >= 6.0:
            return f"Acceptable Flow. The lesson holds together, but has {total_issues} noticeable gaps or drifts that hurt the progression."
        elif score >= 4.0:
            return f"Poor Structure. The lesson map is confusing, with {total_issues} significant logic breaks or contradictions."
        else:
            return "Structural Failure. The lesson lacks a coherent thread, making it very difficult to follow."

# Create global instance
coherence_checker = CoherenceChecker()