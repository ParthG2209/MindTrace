from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from models.mentor import MentorCreate, MentorInDB, MentorUpdate, MentorStats
from db import get_db

router = APIRouter(prefix="/api/mentors", tags=["mentors"])

@router.post("/", response_model=MentorInDB)
@router.post("", response_model=MentorInDB)
async def create_mentor(mentor: MentorCreate, db=Depends(get_db)):
    """Create a new mentor"""
    mentor_dict = mentor.model_dump()
    mentor_dict['created_at'] = datetime.utcnow()
    mentor_dict['updated_at'] = datetime.utcnow()
    mentor_dict['total_sessions'] = 0
    mentor_dict['average_score'] = None
    
    result = await db.mentors.insert_one(mentor_dict)
    mentor_dict['_id'] = str(result.inserted_id)
    
    return MentorInDB(**mentor_dict)

@router.get("/", response_model=List[MentorInDB])
@router.get("", response_model=List[MentorInDB])
async def list_mentors(db=Depends(get_db)):
    """List all mentors"""
    mentors = []
    async for mentor in db.mentors.find():
        mentor['_id'] = str(mentor['_id'])
        mentors.append(MentorInDB(**mentor))
    return mentors

@router.get("/{mentor_id}", response_model=MentorInDB)
async def get_mentor(mentor_id: str, db=Depends(get_db)):
    """Get mentor by ID"""
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(mentor_id):
            raise HTTPException(status_code=400, detail=f"Invalid mentor ID format: {mentor_id}")
        
        mentor = await db.mentors.find_one({"_id": ObjectId(mentor_id)})
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        mentor['_id'] = str(mentor['_id'])
        return MentorInDB(**mentor)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting mentor {mentor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{mentor_id}", response_model=MentorInDB)
async def update_mentor(
    mentor_id: str,
    mentor_update: MentorUpdate,
    db=Depends(get_db)
):
    """Update mentor"""
    try:
        if not ObjectId.is_valid(mentor_id):
            raise HTTPException(status_code=400, detail=f"Invalid mentor ID format: {mentor_id}")
        
        update_data = {k: v for k, v in mentor_update.model_dump().items() if v is not None}
        update_data['updated_at'] = datetime.utcnow()
        
        result = await db.mentors.find_one_and_update(
            {"_id": ObjectId(mentor_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        result['_id'] = str(result['_id'])
        return MentorInDB(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating mentor {mentor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{mentor_id}")
async def delete_mentor(mentor_id: str, db=Depends(get_db)):
    """Delete mentor"""
    try:
        if not ObjectId.is_valid(mentor_id):
            raise HTTPException(status_code=400, detail=f"Invalid mentor ID format: {mentor_id}")
        
        result = await db.mentors.delete_one({"_id": ObjectId(mentor_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Mentor not found")
        return {"message": "Mentor deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting mentor {mentor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{mentor_id}/stats", response_model=MentorStats)
async def get_mentor_stats(mentor_id: str, db=Depends(get_db)):
    """Get mentor statistics"""
    try:
        if not ObjectId.is_valid(mentor_id):
            raise HTTPException(status_code=400, detail=f"Invalid mentor ID format: {mentor_id}")
        
        # Get all evaluations for this mentor's sessions
        sessions = await db.sessions.find({"mentor_id": mentor_id}).to_list(None)
        session_ids = [str(s['_id']) for s in sessions]
        
        evaluations = await db.evaluations.find(
            {"session_id": {"$in": session_ids}}
        ).to_list(None)
        
        if not evaluations:
            return MentorStats(
                mentor_id=mentor_id,
                total_sessions=0,
                average_score=0.0,
                clarity_avg=0.0,
                structure_avg=0.0,
                correctness_avg=0.0,
                pacing_avg=0.0,
                communication_avg=0.0,
                recent_trend="stable"
            )
        
        # Calculate averages
        n = len(evaluations)
        avg_score = sum(e['overall_score'] for e in evaluations) / n
        clarity_avg = sum(e['metrics']['clarity'] for e in evaluations) / n
        structure_avg = sum(e['metrics']['structure'] for e in evaluations) / n
        correctness_avg = sum(e['metrics']['correctness'] for e in evaluations) / n
        pacing_avg = sum(e['metrics']['pacing'] for e in evaluations) / n
        communication_avg = sum(e['metrics']['communication'] for e in evaluations) / n
        
        # Determine trend (compare recent 3 to previous 3)
        trend = "stable"
        if n >= 6:
            recent_avg = sum(e['overall_score'] for e in evaluations[-3:]) / 3
            previous_avg = sum(e['overall_score'] for e in evaluations[-6:-3]) / 3
            if recent_avg > previous_avg + 0.5:
                trend = "improving"
            elif recent_avg < previous_avg - 0.5:
                trend = "declining"
        
        return MentorStats(
            mentor_id=mentor_id,
            total_sessions=len(sessions),
            average_score=round(avg_score, 2),
            clarity_avg=round(clarity_avg, 2),
            structure_avg=round(structure_avg, 2),
            correctness_avg=round(correctness_avg, 2),
            pacing_avg=round(pacing_avg, 2),
            communication_avg=round(communication_avg, 2),
            recent_trend=trend
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting mentor stats {mentor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))