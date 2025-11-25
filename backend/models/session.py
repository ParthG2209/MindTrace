from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    UPLOADED = "uploaded"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"

class SessionBase(BaseModel):
    mentor_id: str
    title: str
    topic: str
    duration: Optional[int] = None  # in seconds

class SessionCreate(SessionBase):
    video_filename: str

class SessionInDB(SessionBase):
    id: str = Field(alias="_id")
    video_filename: str
    video_path: str
    status: SessionStatus = SessionStatus.UPLOADED
    created_at: datetime
    updated_at: datetime
    transcript_id: Optional[str] = None
    evaluation_id: Optional[str] = None
    
    class Config:
        populate_by_name = True

class SessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    transcript_id: Optional[str] = None
    evaluation_id: Optional[str] = None
    duration: Optional[int] = None