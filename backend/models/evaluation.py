from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ScoreDetail(BaseModel):
    score: float  # 1-10
    reason: str
    evidence: Optional[List[str]] = []  # Specific examples

class SegmentEvaluation(BaseModel):
    segment_id: int
    text: str
    
    # Core Metrics (Original 5) - REQUIRED
    clarity: ScoreDetail
    structure: ScoreDetail
    correctness: ScoreDetail
    pacing: ScoreDetail
    communication: ScoreDetail
    
    # Advanced Metrics - REQUIRED (changed from Optional)
    engagement: ScoreDetail
    examples: ScoreDetail
    questioning: ScoreDetail
    adaptability: ScoreDetail
    relevance: ScoreDetail
    
    # NEW: Classroom Dynamics Metrics
    student_interaction: Optional[ScoreDetail] = None  # How well teacher interacts with students
    off_topic_management: Optional[ScoreDetail] = None  # Handling of off-topic discussions
    classroom_control: Optional[ScoreDetail] = None  # Maintaining focus and discipline
    
    overall_segment_score: float
    topic_alignment: Optional[float] = None  # How well aligned with topic (0-1)

class Metrics(BaseModel):
    # Core Metrics - REQUIRED
    clarity: float
    structure: float
    correctness: float
    pacing: float
    communication: float
    
    # Advanced Metrics - REQUIRED (changed from Optional)
    engagement: float
    examples: float
    questioning: float
    adaptability: float
    relevance: float
    
    # NEW: Classroom Dynamics Metrics
    student_interaction: Optional[float] = None
    off_topic_management: Optional[float] = None
    classroom_control: Optional[float] = None

class EvaluationBase(BaseModel):
    session_id: str
    overall_score: float  # 1-10 weighted average
    metrics: Metrics
    segments: List[SegmentEvaluation]
    
    # Topic Analysis
    topic_analysis: Optional[dict] = {
        "stated_topic": "",
        "detected_topics": [],
        "relevance_score": 0.0,
        "topic_drift": [],
        "related_topics_bonus": 0.0,
        "off_topic_percentage": 0.0,  # NEW: Track off-topic content
        "acceptable_deviation": True  # NEW: Whether deviations are educationally valuable
    }

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationInDB(EvaluationBase):
    id: str = Field(alias="_id")
    created_at: datetime
    llm_provider: str
    llm_model: str
    
    class Config:
        populate_by_name = True

class EvaluationSummary(BaseModel):
    evaluation_id: str
    session_id: str
    overall_score: float
    metrics: Metrics
    strengths: List[str]
    areas_for_improvement: List[str]
    created_at: datetime
    topic_analysis: Optional[dict] = None