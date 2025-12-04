from typing import List, Dict, Any
from models.evaluation import SegmentEvaluation, ScoreDetail
from utils.llm_client import llm_client

class EvidenceExtractor:
    """
    Extracts specific evidence of problems from teaching segments
    FIXED VERSION - Now properly extracts problematic phrases
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
            metric: The metric to extract evidence for
            
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
            print(f"🔍 Extracting evidence for {metric} (score: {score_detail.score})")
            response = await llm_client.call_llm(
                prompt=prompt,
                task_type='evidence',
                response_format='json',
                temperature=0.3  # Lower temperature for more precise extraction
            )
            
            # Parse and validate evidence items
            evidence_items = response.get('evidence', [])
            
            # Add segment context and validate
            valid_items = []
            for item in evidence_items:
                # Validate that the phrase actually exists in the segment
                if 'phrase' in item and item['phrase'].lower() in segment.text.lower():
                    item['segment_id'] = segment.segment_id
                    item['metric'] = metric
                    
                    # Calculate character positions if not provided
                    if 'char_start' not in item:
                        try:
                            start_pos = segment.text.lower().find(item['phrase'].lower())
                            if start_pos != -1:
                                item['char_start'] = start_pos
                                item['char_end'] = start_pos + len(item['phrase'])
                        except:
                            item['char_start'] = 0
                            item['char_end'] = len(item['phrase'])
                    
                    valid_items.append(item)
            
            print(f"✅ Found {len(valid_items)} valid evidence items")
            return valid_items
            
        except Exception as e:
            print(f"❌ Evidence extraction failed: {e}")
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
            'communication': [],
            'engagement': [],
            'examples': [],
            'questioning': [],
            'adaptability': [],
            'relevance': []
        }
        
        for segment in segments:
            for metric in evidence_by_metric.keys():
                score = getattr(segment, metric).score
                
                if score < self.threshold_score:
                    print(f"Processing segment {segment.segment_id}, metric {metric}")
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
            'clarity': 'unclear or confusing language, vague terminology, ambiguous statements',
            'structure': 'poor organization, logical flow issues, missing transitions',
            'correctness': 'technical inaccuracies, errors, or misleading information',
            'pacing': 'inappropriate speed, rushed explanations, or overly slow delivery',
            'communication': 'ineffective communication, poor word choice, or disengaging delivery',
            'engagement': 'lack of interactive elements, monotonous delivery, missing enthusiasm',
            'examples': 'poor quality examples, irrelevant illustrations, or unclear demonstrations',
            'questioning': 'lack of questions, ineffective questioning, or no checks for understanding',
            'adaptability': 'failure to adjust difficulty, inappropriate complexity, poor scaffolding',
            'relevance': 'off-topic content, irrelevant tangents, or poorly connected concepts'
        }
        
        prompt = f"""You are analyzing a teaching segment that scored {score_detail.score}/10 on {metric}.

SEGMENT TEXT:
"{segment_text}"

EVALUATOR'S REASONING:
{score_detail.reason}

Your task: Extract SPECIFIC problematic phrases from the text that demonstrate {metric_descriptions.get(metric, 'issues')}.

CRITICAL REQUIREMENTS:
1. Extract ONLY phrases that ACTUALLY EXIST in the segment text (copy them exactly)
2. Each phrase must be 5-30 words long
3. Provide the exact character positions where each phrase appears
4. Each phrase must clearly demonstrate the problem identified

For each issue found, provide:
- phrase: EXACT text from the segment (must exist word-for-word)
- char_start: Starting character position in the text
- char_end: Ending character position in the text
- issue: Clear explanation of what's wrong
- suggestion: Specific improvement suggestion
- alternative_phrasing: Better way to phrase this (optional)
- severity: "minor", "moderate", or "major"

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
- Extract 2-5 evidence items (focus on the most impactful)
- Only extract phrases that ACTUALLY exist in the text
- Be specific and actionable
- Prioritize issues by severity
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
        metrics = [
            'clarity', 'structure', 'correctness', 'pacing', 'communication',
            'engagement', 'examples', 'questioning', 'adaptability', 'relevance'
        ]
        
        for metric in metrics:
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