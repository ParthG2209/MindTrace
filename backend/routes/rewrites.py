

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from bson import ObjectId

from models.rewrite import RewriteCollection, RewriteSuggestion
from models.evaluation import SegmentEvaluation
from db import get_db
from services.explanation_rewriter import explanation_rewriter

router = APIRouter(prefix="/api/rewrites", tags=["rewrites"])

async def rewrite_segment_task(segment, session_id: str, db):
    """Background task to rewrite segment"""
    try:
        # Get session for topic context
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        topic = session.get('topic', '') if session else ''
        
        # Generate rewrite
        rewrite_data = await explanation_rewriter.rewrite_segment(segment, topic)
        
        if rewrite_data.get('needs_rewrite'):
            # Save to database
            rewrite_doc = {
                'segment_id': segment.segment_id,
                'session_id': session_id,
                'rewrite': rewrite_data,
                'created_at': datetime.utcnow(),
                'accepted': False
            }
            
            await db.rewrites.insert_one(rewrite_doc)
    except Exception as e:
        print(f"Rewrite failed: {e}")

async def batch_rewrite_task(evaluation: dict, session: dict, db):
    """Background task for batch rewrite"""
    try:
        # Reconstruct segments
        segments = [SegmentEvaluation(**seg) for seg in evaluation['segments']]
        
        # Generate rewrites
        rewrites = await explanation_rewriter.batch_rewrite_session(
            segments,
            session.get('topic', '')
        )
        
        # Save to database
        for rewrite_data in rewrites:
            rewrite_doc = {
                'segment_id': rewrite_data['segment_id'],
                'session_id': str(session['_id']),
                'rewrite': rewrite_data,
                'created_at': datetime.utcnow(),
                'accepted': False
            }
            await db.rewrites.insert_one(rewrite_doc)
            
    except Exception as e:
        print(f"Batch rewrite failed: {e}")

@router.post("/segment/{segment_id}")
async def rewrite_segment(
    segment_id: int,
    evaluation_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """Rewrite a single segment"""
    try:
        # Get evaluation
        evaluation = await db.evaluations.find_one({"_id": ObjectId(evaluation_id)})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Find segment
        segment_data = next(
            (s for s in evaluation['segments'] if s['segment_id'] == segment_id),
            None
        )
        if not segment_data:
            raise HTTPException(status_code=404, detail="Segment not found")
        
        segment = SegmentEvaluation(**segment_data)
        
        # Start rewrite in background
        background_tasks.add_task(
            rewrite_segment_task,
            segment,
            evaluation['session_id'],
            db
        )
        
        return {
            "message": "Rewrite started",
            "segment_id": segment_id,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/session/{session_id}")
async def batch_rewrite_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """Rewrite all low-scoring segments in a session"""
    try:
        # Get evaluation
        evaluation = await db.evaluations.find_one({"session_id": session_id})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Get session
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Start batch rewrite
        background_tasks.add_task(
            batch_rewrite_task,
            evaluation,
            session,
            db
        )
        
        return {
            "message": "Batch rewrite started",
            "session_id": session_id,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}")
async def get_rewrites(session_id: str, db=Depends(get_db)):
    """Get all rewrites for a session"""
    try:
        rewrites = []
        async for rewrite in db.rewrites.find({"session_id": session_id}):
            rewrite['_id'] = str(rewrite['_id'])
            rewrites.append(rewrite)
        
        return {
            "session_id": session_id,
            "rewrites": rewrites,
            "total": len(rewrites)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}/comparison")
async def get_rewrite_comparison(session_id: str, db=Depends(get_db)):
    """Get side-by-side comparison of all rewrites"""
    try:
        rewrites = []
        async for rewrite in db.rewrites.find({"session_id": session_id}):
            rewrites.append({
                "segment_id": rewrite['segment_id'],
                "original": rewrite['rewrite'].get('original_text'),
                "rewritten": rewrite['rewrite'].get('rewritten_text'),
                "improvements": rewrite['rewrite'].get('improvements', [])
            })
        
        return {
            "session_id": session_id,
            "comparisons": rewrites
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Create router instance for import
rewrite_router = router