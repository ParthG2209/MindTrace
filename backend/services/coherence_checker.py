from typing import List, Dict, Any
from models.evaluation import SegmentEvaluation
from models.transcript import TranscriptSegment
from utils.llm_client import llm_client

class CoherenceChecker:
    """
    Analyzes entire teaching sessions for coherence issues
    Detects contradictions, topic drift, and logical gaps
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
        
        # Check for different types of issues
        contradictions = await self.detect_contradictions(segments)
        topic_drifts = await self.detect_topic_drift(segments, topic)
        logical_gaps = await self.detect_logical_gaps(segments)
        
        # Calculate overall coherence score
        coherence_score = self._calculate_coherence_score(
            contradictions,
            topic_drifts,
            logical_gaps
        )
        
        return {
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
    
    async def detect_contradictions(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect statements that contradict each other
        """
        
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

Only report ACTUAL contradictions, not just different perspectives or clarifications.
If no contradictions found, return empty array."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json'
            )
            return response.get('contradictions', [])
        except Exception as e:
            print(f"Contradiction detection failed: {e}")
            return []
    
    async def detect_topic_drift(
        self,
        segments: List[SegmentEvaluation],
        main_topic: str
    ) -> List[Dict[str, Any]]:
        """
        Detect when explanation drifts from the main topic
        """
        
        segments_text = "\n\n".join([
            f"[SEGMENT {seg.segment_id}]: {seg.text}"
            for seg in segments
        ])
        
        prompt = f"""Analyze this teaching session for TOPIC DRIFT - when the teacher strays from the main topic.

MAIN TOPIC: {main_topic}

SESSION TEXT:
{segments_text}

Your task: Identify segments where the teacher:
1. Goes significantly off-topic
2. Introduces unrelated tangents
3. Spends too much time on peripheral concepts
4. Loses focus on the main learning objective

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
      "suggestion": "how to bring it back on topic"
    }}
  ]
}}

drift_degree: 0.0 (perfectly on topic) to 1.0 (completely unrelated)
Only report significant drift (degree > 0.5)."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json'
            )
            return response.get('topic_drifts', [])
        except Exception as e:
            print(f"Topic drift detection failed: {e}")
            return []
    
    async def detect_logical_gaps(
        self,
        segments: List[SegmentEvaluation]
    ) -> List[Dict[str, Any]]:
        """
        Detect missing steps or unexplained jumps in logic
        """
        
        segments_text = "\n\n".join([
            f"[SEGMENT {seg.segment_id}]: {seg.text}"
            for seg in segments
        ])
        
        prompt = f"""Analyze this teaching session for LOGICAL GAPS - missing steps or unexplained jumps.

SESSION TEXT:
{segments_text}

Your task: Identify where the teacher:
1. Jumps to conclusions without explaining intermediate steps
2. Uses concepts without introducing them first
3. Makes assumptions about prior knowledge that may not exist
4. Skips critical steps in an explanation
5. Has abrupt transitions without connecting ideas

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

Focus on gaps that would genuinely confuse learners."""
        
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='coherence',
                response_format='json'
            )
            return response.get('logical_gaps', [])
        except Exception as e:
            print(f"Logical gap detection failed: {e}")
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
            score -= drift_degree * 1.5
        
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
        
        if score >= 9.0:
            return "Excellent coherence. The explanation flows logically with no significant issues."
        elif score >= 7.5:
            return "Good coherence. Minor issues present but overall explanation is well-structured."
        elif score >= 6.0:
            return "Acceptable coherence. Some logical issues that should be addressed."
        elif score >= 4.0:
            return "Poor coherence. Multiple issues affecting understanding. Revision recommended."
        else:
            return "Very poor coherence. Major logical problems. Significant revision needed."
    
    async def generate_coherence_report(
        self,
        issues: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive coherence report with recommendations
        """
        
        return {
            "summary": {
                "overall_score": issues.get('session_coherence_score', 0),
                "total_issues": (
                    len(issues.get('contradictions', [])) +
                    len(issues.get('topic_drifts', [])) +
                    len(issues.get('logical_gaps', []))
                ),
                "assessment": issues.get('overall_assessment', '')
            },
            "critical_issues": self._identify_critical_issues(issues),
            "recommendations": self._generate_recommendations(issues),
            "detailed_issues": issues
        }
    
    def _identify_critical_issues(
        self,
        issues: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify the most critical coherence issues"""
        
        critical = []
        
        # Major contradictions
        for contra in issues.get('contradictions', []):
            if contra.get('severity') == 'major':
                critical.append({
                    "type": "contradiction",
                    "description": contra.get('explanation'),
                    "segments": [contra.get('segment1_id'), contra.get('segment2_id')]
                })
        
        # Severe topic drift
        for drift in issues.get('topic_drifts', []):
            if drift.get('drift_degree', 0) > 0.7:
                critical.append({
                    "type": "topic_drift",
                    "description": drift.get('impact'),
                    "segment": drift.get('segment_id')
                })
        
        # Major logical gaps
        for gap in issues.get('logical_gaps', []):
            if gap.get('severity') == 'major':
                critical.append({
                    "type": "logical_gap",
                    "description": gap.get('missing_concept'),
                    "segments": [gap.get('between_segment1'), gap.get('between_segment2')]
                })
        
        return critical
    
    def _generate_recommendations(
        self,
        issues: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if issues.get('contradictions'):
            recommendations.append(
                "Review and resolve contradictions between segments to ensure consistency"
            )
        
        if issues.get('topic_drifts'):
            recommendations.append(
                "Stay focused on the main topic and remove or minimize tangential content"
            )
        
        if issues.get('logical_gaps'):
            recommendations.append(
                "Fill logical gaps by adding missing explanatory steps and defining concepts before use"
            )
        
        if not recommendations:
            recommendations.append(
                "Maintain the current level of coherence in future sessions"
            )
        
        return recommendations

# Create global instance
coherence_checker = CoherenceChecker()