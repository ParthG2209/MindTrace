from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime

class RewriteComparison(BaseModel):
    """Comparison between original and rewritten explanation"""
    original_text: str
    rewritten_text: str
    
    # NEW: Replaces the "suggestion" fields from Evidence/Coherence
    specific_corrections: List[str] = []   # E.g., "Fixed factual error about X", "Corrected grammar in sentence 2"
    teaching_suggestions: List[str] = []   # E.g., "Use Socratic questions here", "Slow down the pacing"
    
    improvements: List[str] = []  # General improvements made in this specific rewrite
    key_changes: Dict[str, str] = {}
    
    clarity_improvement: float = 0.0
    structure_improvement: float = 0.0
    word_count_change: int = 0
    confidence: float = 0.0
    applied_style: str = "Gold Standard"

class RewriteSuggestion(BaseModel):
    """Rewrite suggestion for a single segment"""
    segment_id: int
    session_id: str
    rewrite: RewriteComparison
    confidence: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted: bool = False
    
class RewriteCollection(BaseModel):
    """Collection of all rewrites for a session"""
    session_id: str
    rewrites: List[RewriteSuggestion] = []
    total_rewrites: int = 0
    accepted_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)