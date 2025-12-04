from typing import List, Dict, Any
from models.evaluation import SegmentEvaluation
from utils.llm_client import llm_client

class CoherenceChecker:
    """
    Analyzes entire teaching sessions for coherence issues
    FIXED VERSION - Now properly detects contradictions, drift, and gaps
    """
    
    def __init__(self):
        self.min_coherence_score = 7.0
        
    async def check_coherence(
        self,
        segments: List[SegmentEvaluation],
        topic: str
    ) -> Dict[str, Any]:
        """
        Comprehensive coherence analysis of entire session
        
        Args:
            segments: All evaluated segments
            topic: Main topic of the session
            
        Returns:
            Comprehensive coherence report
        """
        
        # Filter valid segments only [FIXED]
        valid_segments = [s for s in segments if s and s.text]
        
        print(f"🔍 Checking coherence across {len(valid_segments)} segments")
        
        # Check for different types of issues
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
        
        print(f"✅ Coherence check complete. Score: {coherence_score}/10")
        print(f"   Found: {len(contradictions)} contradictions, {len(topic_drifts)} drifts, {len(logical_gaps)} gaps")
        
        return report
    
    async def detect_contradictions(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect statements that contradict each other
        """
        
        if not segments:
            return []

        # Build combined text for analysis
        combined_text = "\n\n".join([
            f"[SEGMENT {seg.segment_id}]: {seg.text}"
            for seg in segments
        ])
        
        prompt = f"""Analyze this teaching session for logical CONTRADICTIONS - statements that oppose or conflict with each other.

SESSION TEXT:
{combined_text}

Your task: Identify any contradictions where the teacher:
1. States something in one segment, then says the opposite later
2. Provides conflicting information about the same concept
3. Uses examples that contradict the main explanation
4. Makes statements that logically cannot both be true

IMPORTANT: Be strict but fair. Only flag actual contradictions, not:
- Different perspectives or nuances
- Progressive refinement of ideas
- Examples showing exceptions to rules (when explicitly stated as exceptions)

Return as JSON:
{{
  "contradictions": [
    {{
      "segment1_id": 2,
      "segment2_id": 5,
      "statement1": "exact quote from segment 2",
      "statement2": "exact quote from segment 5 that contradicts",
      "contradiction_type": "direct_opposition | conflicting_info | inconsistent_example",
      "severity": "minor | moderate | major",
      "explanation": "Clear explanation of why these contradict",
      "resolution": "How to resolve this contradiction"
    }}
  ]
}}

Only report ACTUAL contradictions. If no contradictions found, return empty array."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.3  # Lower temp for more precise detection
            )
            contradictions = response.get('contradictions', [])
            print(f"   Contradictions detected: {len(contradictions)}")
            return contradictions
        except Exception as e:
            print(f"❌ Contradiction detection failed: {e}")
            return []
    
    async def detect_topic_drift(
        self,
        segments: List[SegmentEvaluation],
        main_topic: str
    ) -> List[Dict[str, Any]]:
        """
        Detect when explanation drifts from the main topic
        """
        
        if not segments:
            return []

        segments_text = "\n\n".join([
            f"[SEGMENT {seg.segment_id}]: {seg.text}"
            for seg in segments
        ])
        
        prompt = f"""Analyze this teaching session for TOPIC DRIFT - when the teacher strays from the main topic.

MAIN TOPIC: {main_topic}

SESSION TEXT:
{segments_text}

Your task: Identify segments where the teacher:
1. Goes significantly off-topic without educational justification
2. Introduces unrelated tangents that don't enhance understanding
3. Spends excessive time on peripheral concepts
4. Loses focus on the main learning objective

CRITICAL DISTINCTION:
- VALUABLE DRIFT (Don't flag): Related topics that provide context, analogies from other fields that clarify concepts, real-world examples that enhance understanding
- PROBLEMATIC DRIFT (Flag): Completely unrelated content, personal anecdotes without educational value, tangents that confuse rather than clarify

Return as JSON:
{{
  "topic_drifts": [
    {{
      "segment_id": 3,
      "expected_topic": "{main_topic}",
      "actual_content": "brief description of what was discussed instead",
      "drift_degree": 0.7,
      "relevance_score": 0.3,
      "impact": "how this affects learning",
      "suggestion": "how to bring it back on topic or connect it better"
    }}
  ]
}}

drift_degree: 0.0 (perfectly on topic) to 1.0 (completely unrelated)
relevance_score: 0.0 (no educational value) to 1.0 (highly valuable)

Only report significant drift (degree > 0.6 AND relevance < 0.4)."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.3
            )
            drifts = response.get('topic_drifts', [])
            print(f"   Topic drifts detected: {len(drifts)}")
            return drifts
        except Exception as e:
            print(f"❌ Topic drift detection failed: {e}")
            return []
    
    async def detect_logical_gaps(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect missing steps or unexplained jumps in logic
        """
        
        if not segments:
            return []

        segments_text = "\n\n".join([
            f"[SEGMENT {seg.segment_id}]: {seg.text}"
            for seg in segments
        ])
        
        prompt = f"""Analyze this teaching session for LOGICAL GAPS - missing steps or unexplained jumps.

SESSION TEXT:
{segments_text}

Your task: Identify where the teacher:
1. Jumps to conclusions without explaining intermediate steps
2. Uses concepts without introducing them first (assumes prior knowledge)
3. Makes assumptions about understanding that may not exist
4. Skips critical steps in an explanation
5. Has abrupt transitions without connecting ideas

IDENTIFICATION CRITERIA:
- Gap must significantly impact understanding
- Missing information should be necessary for comprehension
- Don't flag minor shortcuts in well-understood material
- Focus on gaps that would genuinely confuse learners

Return as JSON:
{{
  "logical_gaps": [
    {{
      "between_segment1": 2,
      "between_segment2": 3,
      "gap_type": "missing_step | undefined_concept | unexplained_jump | assumption",
      "missing_concept": "what needs to be explained",
      "impact": "how this affects understanding",
      "severity": "minor | moderate | major",
      "fill_suggestion": "what should be added to fill this gap"
    }}
  ]
}}

Focus on gaps that would genuinely confuse learners at the target level."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json',
                temperature=0.3
            )
            gaps = response.get('logical_gaps', [])
            print(f"   Logical gaps detected: {len(gaps)}")
            return gaps
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
        Calculate overall coherence score based on issues found
        """
        
        # Start at 10.0
        score = 10.0
        
        # Deduct for each issue based on severity
        for contradiction in contradictions:
            severity = contradiction.get('severity', 'moderate')
            if severity == 'major':
                score -= 1.5
            elif severity == 'moderate':
                score -= 1.0
            else:
                score -= 0.5
        
        for drift in topic_drifts:
            drift_degree = drift.get('drift_degree', 0.5)
            relevance_score = drift.get('relevance_score', 0.5)
            # Higher drift and lower relevance = bigger penalty
            penalty = drift_degree * (1 - relevance_score) * 1.5
            score -= penalty
        
        for gap in logical_gaps:
            severity = gap.get('severity', 'moderate')
            if severity == 'major':
                score -= 1.0
            elif severity == 'moderate':
                score -= 0.7
            else:
                score -= 0.3
        
        return max(0.0, round(score, 1))
    
    def _generate_assessment(
        self,
        score: float,
        num_contradictions: int,
        num_drifts: int,
        num_gaps: int
    ) -> str:
        """Generate human-readable assessment"""
        
        total_issues = num_contradictions + num_drifts + num_gaps
        
        if score >= 9.0:
            return f"Excellent coherence. The explanation flows logically with no significant issues. ({total_issues} minor items noted)"
        elif score >= 7.5:
            return f"Good coherence. Minor issues present ({total_issues} items) but overall explanation is well-structured."
        elif score >= 6.0:
            return f"Acceptable coherence. Some logical issues ({total_issues} items) that should be addressed to improve clarity."
        elif score >= 4.0:
            return f"Poor coherence. Multiple issues ({total_issues} items) affecting understanding. Revision recommended."
        else:
            return f"Very poor coherence. Major logical problems ({total_issues} items). Significant revision needed."

# Create global instance
coherence_checker = CoherenceChecker()