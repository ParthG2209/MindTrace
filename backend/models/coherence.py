"""
Coherence Models
backend/models/coherence.py
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ContradictionIssue(BaseModel):
    """Two segments that contradict each other"""
    segment1_id: int
    segment2_id: int
    statement1: str  # Quote from first segment
    statement2: str  # Quote from second segment that contradicts
    contradiction_type: str  # direct_opposition, conflicting_info, inconsistent_example
    severity: str = "moderate"  # minor, moderate, major
    explanation: str  # Why these contradict
    resolution: Optional[str] = None  # How to resolve
    
    class Config:
        json_schema_extra = {
            "example": {
                "segment1_id": 2,
                "segment2_id": 5,
                "statement1": "Always use global variables for configuration",
                "statement2": "Avoid global variables as they make code hard to test",
                "contradiction_type": "direct_opposition",
                "severity": "major",
                "explanation": "These statements directly contradict each other",
                "resolution": "Clarify when global variables are acceptable"
            }
        }

class TopicDriftIssue(BaseModel):
    """Segment that drifts from main topic"""
    segment_id: int
    expected_topic: str
    actual_content: str  # What was discussed instead
    drift_degree: float  # 0.0 (on topic) to 1.0 (completely off)
    relevance_score: float  # How relevant to learning goal
    impact: str  # Effect on student understanding
    suggestion: Optional[str] = None  # How to fix
    
    class Config:
        json_schema_extra = {
            "example": {
                "segment_id": 7,
                "expected_topic": "Python decorators",
                "actual_content": "Personal anecdote about a bug from 2015",
                "drift_degree": 0.8,
                "relevance_score": 0.2,
                "impact": "Students may lose focus on main concept",
                "suggestion": "Keep story brief or tie it directly to decorator usage"
            }
        }

class LogicalGap(BaseModel):
    """Missing step or unexplained concept"""
    between_segment1: int
    between_segment2: int
    gap_type: str  # missing_step, undefined_concept, unexplained_jump, assumption
    missing_concept: str  # What needs to be explained
    impact: str  # Effect on understanding
    severity: str = "moderate"  # minor, moderate, major
    fill_suggestion: Optional[str] = None  # What to add
    
    class Config:
        json_schema_extra = {
            "example": {
                "between_segment1": 3,
                "between_segment2": 4,
                "gap_type": "undefined_concept",
                "missing_concept": "What a closure is",
                "impact": "Students won't understand why decorators work",
                "severity": "major",
                "fill_suggestion": "Add explanation of closures before introducing decorators"
            }
        }

class CoherenceReport(BaseModel):
    """Complete coherence analysis report"""
    session_id: str
    session_coherence_score: float  # 0-10
    contradictions: List[ContradictionIssue] = []
    topic_drifts: List[TopicDriftIssue] = []
    logical_gaps: List[LogicalGap] = []
    overall_assessment: str  # Human-readable summary
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "507f1f77bcf86cd799439011",
                "session_coherence_score": 7.5,
                "contradictions": [],
                "topic_drifts": [],
                "logical_gaps": [],
                "overall_assessment": "Good coherence with minor topic drift"
            }
        }

class CoherenceSummary(BaseModel):
    """Summary of coherence issues for quick viewing"""
    total_issues: int
    critical_issues: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    score: float