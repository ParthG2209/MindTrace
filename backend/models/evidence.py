from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EvidenceItem(BaseModel):
    """Single piece of evidence for a problem"""
    segment_id: int
    metric: str  # clarity, structure, correctness, pacing, communication
    phrase: str  # Exact problematic text
    char_start: int  # Character position in segment text
    char_end: int
    issue: str  # What's wrong with this phrase
    suggestion: str  # How to fix it
    alternative_phrasing: Optional[str] = None  # Better way to say it
    severity: str = "moderate"  # minor, moderate, major

class EvidenceCollection(BaseModel):
    """Collection of all evidence for a session"""
    session_id: str
    evaluation_id: str
    items: List[EvidenceItem] = []
    total_issues: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "507f1f77bcf86cd799439011",
                "evaluation_id": "507f1f77bcf86cd799439012",
                "items": [
                    {
                        "segment_id": 2,
                        "metric": "clarity",
                        "phrase": "this thing here",
                        "char_start": 45,
                        "char_end": 60,
                        "issue": "Vague reference - unclear what 'this thing' refers to",
                        "suggestion": "Use specific terminology",
                        "alternative_phrasing": "the decorator function",
                        "severity": "moderate"
                    }
                ],
                "total_issues": 1
            }
        }