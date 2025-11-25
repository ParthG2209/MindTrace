from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.session import SessionInDB, SessionStatus, SessionUpdate
from db import get_db
from utils.file_handler import save_upload_file

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("/", response_model=SessionInDB)
async def create_session(
    mentor_id: str = Form(...),
    title: str = Form(...),
    topic: str = Form(...),
    video: UploadFile = File(...),
    db=Depends(get_db)
):
    """Create a new session with video upload"""
    try:
        # Save video file
        filename, filepath = await save_upload_file(video, prefix="session_")
        
        session_dict = {
            'mentor_id': mentor_id,
            'title': title,
            'topic': topic,
            'video_filename': filename,
            'video_path': filepath,
            'status': SessionStatus.UPLOADED,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'transcript_id': None,
            'evaluation_id': None,
            'duration': None
        }
        
        result = await db.sessions.insert_one(session_dict)
        session_dict['_id'] = str(result.inserted_id)
        
        # Update mentor's session count
        await db.mentors.update_one(
            {"_id": ObjectId(mentor_id)},
            {"$inc": {"total_sessions": 1}}
        )
        
        return SessionInDB(**session_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[SessionInDB])
async def list_sessions(
    mentor_id: Optional[str] = None,
    status: Optional[SessionStatus] = None,
    db=Depends(get_db)
):
    """List sessions with optional filters"""
    query = {}
    if mentor_id:
        query['mentor_id'] = mentor_id
    if status:
        query['status'] = status
    
    sessions = []
    async for session in db.sessions.find(query).sort('created_at', -1):
        session['_id'] = str(session['_id'])
        sessions.append(SessionInDB(**session))
    return sessions

@router.get("/{session_id}", response_model=SessionInDB)
async def get_session(session_id: str, db=Depends(get_db)):
    """Get session by ID"""
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session['_id'] = str(session['_id'])
        return SessionInDB(**session)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{session_id}", response_model=SessionInDB)
async def update_session(
    session_id: str,
    session_update: SessionUpdate,
    db=Depends(get_db)
):
    """Update session"""
    try:
        update_data = {k: v for k, v in session_update.model_dump().items() if v is not None}
        update_data['updated_at'] = datetime.utcnow()
        
        result = await db.sessions.find_one_and_update(
            {"_id": ObjectId(session_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        result['_id'] = str(result['_id'])
        return SessionInDB(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{session_id}")
async def delete_session(session_id: str, db=Depends(get_db)):
    """Delete session"""
    try:
        # Get session to delete associated files
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete associated records
        if session.get('transcript_id'):
            await db.transcripts.delete_one({"_id": ObjectId(session['transcript_id'])})
        if session.get('evaluation_id'):
            await db.evaluations.delete_one({"_id": ObjectId(session['evaluation_id'])})
        
        # Delete session
        await db.sessions.delete_one({"_id": ObjectId(session_id)})
        
        # Update mentor's session count
        await db.mentors.update_one(
            {"_id": ObjectId(session['mentor_id'])},
            {"$inc": {"total_sessions": -1}}
        )
        
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))