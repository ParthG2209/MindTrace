from typing import Optional, Union
import json
import re

def map_llm_keys(eval_scores):
    """Map various LLM key naming conventions to expected keys"""
    key_mapping = {
        'structure': ['structure', 'structural_coherence'],
        'correctness': ['correctness', 'technical_correctness'],
        'pacing': ['pacing', 'pacing_delivery'],
        'communication': ['communication', 'communication_quality'],
        'examples': ['examples', 'examples_illustrations'],
        'questioning': ['questioning', 'questioning_technique'],
        'relevance': ['relevance', 'topic_relevance']
    }
    
    mapped = {}
    for expected_key, possible_keys in key_mapping.items():
        for possible_key in possible_keys:
            if possible_key in eval_scores:
                mapped[expected_key] = eval_scores[possible_key]
                break
    
    for key in ['clarity', 'engagement', 'adaptability']:
        if key in eval_scores:
            mapped[key] = eval_scores[key]
    
    return mapped

class LLMClientError(Exception):
    pass

class LlmClient:
    def _call_groq(self, prompt: str, response_format: str = 'text') -> Union[str, dict]:
        # ... some code that gets 'content' from the LLM response ...
        
        # Example placeholder for content retrieval:
        content = "..."  # This would be set by the actual API call
        
        if response_format == 'json':
            # Remove ALL markdown formatting
            content = content.strip()
            
            # Remove markdown code blocks
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            # Remove any leading/trailing whitespace again
            content = content.strip()
            
            # Try to extract JSON if embedded in text
            if not content.startswith('{'):
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group()
            
            try:
                parsed = json.loads(content)
                
                # Validate all required keys exist
                required_keys = [
                    'clarity', 'structure', 'correctness', 'pacing', 'communication',
                    'engagement', 'examples', 'questioning', 'adaptability', 'relevance'
                ]
                
                missing_keys = [k for k in required_keys if k not in parsed]
                if missing_keys:
                    raise ValueError(f"Missing required keys: {missing_keys}")
                
                return parsed
            except json.JSONDecodeError as je:
                print(f"❌ JSON parsing failed: {je}")
                print(f"Raw content: {content[:500]}")
                raise LLMClientError(f"Failed to parse JSON: {je}\nContent: {content[:200]}")
        
        # For other response formats, return content as is
        return content