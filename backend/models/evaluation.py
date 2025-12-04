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
    
    # Core Metrics (Original 5)
    clarity: ScoreDetail
    structure: ScoreDetail
    correctness: ScoreDetail
    pacing: ScoreDetail
    communication: ScoreDetail
    
    # ===== NEW: Advanced Metrics =====
    engagement: ScoreDetail  # How engaging is the content?
    examples: ScoreDetail    # Quality of examples used
    questioning: ScoreDetail # Use of questions to stimulate thinking
    adaptability: ScoreDetail # Adjusting difficulty appropriately
    relevance: ScoreDetail   # Relevance to stated/related topics
    
    overall_segment_score: float
    topic_alignment: Optional[float] = None  # How well aligned with topic (0-1)

class Metrics(BaseModel):
    # Core Metrics
    clarity: float
    structure: float
    correctness: float
    pacing: float
    communication: float
    
    # ===== NEW: Advanced Metrics =====
    engagement: float
    examples: float
    questioning: float
    adaptability: float
    relevance: float

class EvaluationBase(BaseModel):
    session_id: str
    overall_score: float  # 1-10 weighted average
    metrics: Metrics
    segments: List[SegmentEvaluation]
    
    # ===== NEW: Topic Analysis =====
    topic_analysis: Optional[dict] = {
        "stated_topic": "",
        "detected_topics": [],
        "relevance_score": 0.0,
        "topic_drift": [],
        "related_topics_bonus": 0.0
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