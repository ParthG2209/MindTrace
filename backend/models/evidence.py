from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EvidenceItem(BaseModel):
    """
    Single piece of diagnostic evidence.
    DISTINCTION: purely diagnostic. Points out WHAT is wrong, not how to fix it.
    """
    segment_id: int
    metric: str  # clarity, structure, correctness, pacing, communication
    phrase: str  # The exact problematic text (The "Highlight")
    char_start: int 
    char_end: int
    issue: str  # The diagnosis (e.g., "Ambiguous terminology used here")
    impact: str # Why this matters (e.g., "Confuses the student about variable types")
    severity: str = "moderate"  # minor, moderate, major

class EvidenceCollection(BaseModel):
    """Collection of all evidence for a session"""
    session_id: str
    evaluation_id: str
    items: List[EvidenceItem] = []
    total_issues: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)