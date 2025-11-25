from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ScoreDetail(BaseModel):
    score: float  # 1-10
    reason: str

class SegmentEvaluation(BaseModel):
    segment_id: int
    text: str
    clarity: ScoreDetail
    structure: ScoreDetail
    correctness: ScoreDetail
    pacing: ScoreDetail
    communication: ScoreDetail
    overall_segment_score: float

class Metrics(BaseModel):
    clarity: float
    structure: float
    correctness: float
    pacing: float
    communication: float

class EvaluationBase(BaseModel):
    session_id: str
    overall_score: float  # 1-10 weighted average
    metrics: Metrics
    segments: List[SegmentEvaluation]

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