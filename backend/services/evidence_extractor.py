

from typing import List, Dict, Any
from models.evaluation import SegmentEvaluation, ScoreDetail
from utils.llm_client import llm_client

class EvidenceExtractor:
    """
    Extracts specific evidence of problems from teaching segments
    Identifies exact phrases that cause low scores
    """
    
    def __init__(self):
        self.threshold_score = 7.0  # Extract evidence for scores below this
        
    async def extract_evidence(
        self, 
        segment: SegmentEvaluation,
        metric: str
    ) -> List[Dict[str, Any]]:
        """
        Extract evidence for a specific metric from a segment
        
        Args:
            segment: The segment to analyze
            metric: The metric to extract evidence for (clarity, structure, etc.)
            
        Returns:
            List of evidence items with problematic phrases
        """
        
        # Get the score detail for this metric
        score_detail = getattr(segment, metric)
        
        # Only extract evidence if score is below threshold
        if score_detail.score >= self.threshold_score:
            return []
        
        # Build prompt for evidence extraction
        prompt = self._build_evidence_prompt(segment.text, metric, score_detail)
        
        # Call LLM
        try:
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='evidence',
                response_format='json'
            )
            
            # Parse and validate evidence items
            evidence_items = response.get('evidence', [])
            
            # Add segment context
            for item in evidence_items:
                item['segment_id'] = segment.segment_id
                item['metric'] = metric
                
            return evidence_items
            
        except Exception as e:
            print(f"Evidence extraction failed: {e}")
            return []
    
    async def extract_all_evidence(
        self,
        segments: List[SegmentEvaluation]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract evidence for all low-scoring metrics across all segments
        
        Args:
            segments: List of evaluated segments
            
        Returns:
            Dictionary mapping metrics to evidence lists
        """
        
        evidence_by_metric = {
            'clarity': [],
            'structure': [],
            'correctness': [],
            'pacing': [],
            'communication': []
        }
        
        for segment in segments:
            for metric in evidence_by_metric.keys():
                score = getattr(segment, metric).score
                
                if score < self.threshold_score:
                    items = await self.extract_evidence(segment, metric)
                    evidence_by_metric[metric].extend(items)
        
        return evidence_by_metric
    
    def _build_evidence_prompt(
        self,
        segment_text: str,
        metric: str,
        score_detail: ScoreDetail
    ) -> str:
        """Build prompt for evidence extraction"""
        
        metric_descriptions = {
            'clarity': 'unclear or confusing language',
            'structure': 'poor organization or logical flow',
            'correctness': 'technical inaccuracies or errors',
            'pacing': 'inappropriate speed or delivery issues',
            'communication': 'ineffective communication or engagement'
        }
        
        prompt = f"""You are analyzing a teaching segment that scored {score_detail.score}/10 on {metric}.

SEGMENT TEXT:
"{segment_text}"

EVALUATOR'S REASONING:
{score_detail.reason}

Your task: Extract SPECIFIC problematic phrases from the text that demonstrate {metric_descriptions[metric]}.

For each issue found, provide:
1. The EXACT phrase (5-20 words) that is problematic
2. Character position in the text (start and end indices)
3. Clear explanation of what's wrong
4. Specific suggestion for improvement
5. Alternative phrasing (optional)
6. Severity: "minor", "moderate", or "major"

Return as JSON in this format:
{{
  "evidence": [
    {{
      "phrase": "exact problematic phrase from text",
      "char_start": 123,
      "char_end": 145,
      "issue": "clear explanation of the problem",
      "suggestion": "specific improvement suggestion",
      "alternative_phrasing": "better way to phrase this",
      "severity": "moderate"
    }}
  ]
}}

Guidelines:
- Only extract phrases that ACTUALLY exist in the text
- Focus on the most impactful issues
- Be specific and actionable
- Maximum 5 evidence items per segment
- If score is above 7.0, return empty evidence array

Extract the evidence now:"""
        
        return prompt
    
    async def get_evidence_by_segment(
        self,
        segments: List[SegmentEvaluation],
        segment_id: int
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Get all evidence for a specific segment"""
        
        segment = next((s for s in segments if s.segment_id == segment_id), None)
        if not segment:
            return {}
        
        evidence = {}
        for metric in ['clarity', 'structure', 'correctness', 'pacing', 'communication']:
            items = await self.extract_evidence(segment, metric)
            if items:
                evidence[metric] = items
        
        return evidence
    
    def identify_critical_issues(
        self,
        evidence_by_metric: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Identify the most critical issues across all evidence
        Returns top 10 issues sorted by severity
        """
        
        all_evidence = []
        for metric, items in evidence_by_metric.items():
            all_evidence.extend(items)
        
        # Sort by severity (major > moderate > minor)
        severity_order = {'major': 3, 'moderate': 2, 'minor': 1}
        
        all_evidence.sort(
            key=lambda x: severity_order.get(x.get('severity', 'minor'), 0),
            reverse=True
        )
        
        return all_evidence[:10]

# Create global instance
evidence_extractor = EvidenceExtractor()