from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime

class RewriteComparison(BaseModel):
    """Comparison between original and rewritten explanation"""
    original_text: str
    rewritten_text: str
    improvements: List[str] = []  # List of specific improvements made
    key_changes: Dict[str, str] = {}  # Categorized changes
    clarity_improvement: float = 0.0  # Estimated score improvement
    structure_improvement: float = 0.0
    word_count_change: int = 0
    confidence: float = 0.0  # Confidence in the rewrite (0-1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "original_text": "The function does stuff with the data",
                "rewritten_text": "The function processes the input data by applying a transformation algorithm",
                "improvements": [
                    "Replaced vague 'stuff' with specific 'processes'",
                    "Added technical detail about transformation",
                    "More professional terminology"
                ],
                "key_changes": {
                    "terminology": "Improved from vague to specific",
                    "structure": "Added logical flow",
                    "examples": "N/A"
                },
                "clarity_improvement": 2.5,
                "word_count_change": 8
            }
        }

class RewriteSuggestion(BaseModel):
    """Rewrite suggestion for a single segment"""
    segment_id: int
    session_id: str
    rewrite: RewriteComparison
    confidence: float  # Confidence in suggestion (0-1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted: bool = False  # Whether mentor accepted the suggestion
    
class RewriteCollection(BaseModel):
    """Collection of all rewrites for a session"""
    session_id: str
    rewrites: List[RewriteSuggestion] = []
    total_rewrites: int = 0
    accepted_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)