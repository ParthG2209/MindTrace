from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class MentorBase(BaseModel):
    name: str
    email: str
    expertise: List[str] = []
    bio: Optional[str] = None

class MentorCreate(MentorBase):
    pass

class MentorInDB(MentorBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    total_sessions: int = 0
    average_score: Optional[float] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

class MentorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    expertise: Optional[List[str]] = None
    bio: Optional[str] = None

class MentorStats(BaseModel):
    mentor_id: str
    total_sessions: int
    average_score: float
    clarity_avg: float
    structure_avg: float
    correctness_avg: float
    pacing_avg: float
    communication_avg: float
    recent_trend: str  # 'improving', 'declining', 'stable'