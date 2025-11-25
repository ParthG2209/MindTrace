from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class TranscriptSegment(BaseModel):
    segment_id: int
    text: str
    start_time: float
    end_time: float
    confidence: float = 1.0

class TranscriptBase(BaseModel):
    session_id: str
    full_text: str
    segments: List[TranscriptSegment]

class TranscriptCreate(TranscriptBase):
    pass

class TranscriptInDB(TranscriptBase):
    id: str = Field(alias="_id")
    created_at: datetime
    language: str = "en"
    
    class Config:
        populate_by_name = True