from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from bson import ObjectId

from models.coherence import CoherenceReport
from models.evaluation import SegmentEvaluation
from db import get_db
from services.coherence_checker import coherence_checker

router = APIRouter(prefix="/api/coherence", tags=["coherence"])

async def coherence_check_task(evaluation: dict, session: dict, db):
    """Background task for coherence checking"""
    try:
        # Reconstruct segments
        segments = [SegmentEvaluation(**seg) for seg in evaluation['segments']]
        
        # Run coherence check
        coherence_report = await coherence_checker.check_coherence(
            segments,
            session.get('topic', '')
        )
        
        # Save to database
        coherence_doc = {
            'session_id': str(session['_id']),
            **coherence_report,
            'created_at': datetime.utcnow()
        }
        
        await db.coherence.insert_one(coherence_doc)
        
    except Exception as e:
        print(f"Coherence check failed: {e}")

@router.post("/check/{session_id}")
async def check_coherence(
    session_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """Run coherence check on a session"""
    try:
        # Get evaluation
        evaluation = await db.evaluations.find_one({"session_id": session_id})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Get session
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Start coherence check
        background_tasks.add_task(
            coherence_check_task,
            evaluation,
            session,
            db
        )
        
        return {
            "message": "Coherence check started",
            "session_id": session_id,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}")
async def get_coherence_report(session_id: str, db=Depends(get_db)):
    """Get coherence report for a session"""
    try:
        report = await db.coherence.find_one({"session_id": session_id})
        if not report:
            raise HTTPException(status_code=404, detail="Coherence report not found")
        
        report['_id'] = str(report['_id'])
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}/contradictions")
async def get_contradictions(session_id: str, db=Depends(get_db)):
    """Get only contradictions from coherence report"""
    try:
        report = await db.coherence.find_one({"session_id": session_id})
        if not report:
            raise HTTPException(status_code=404, detail="Coherence report not found")
        
        return {
            "session_id": session_id,
            "contradictions": report.get('contradictions', []),
            "total": len(report.get('contradictions', []))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}/gaps")
async def get_logical_gaps(session_id: str, db=Depends(get_db)):
    """Get only logical gaps from coherence report"""
    try:
        report = await db.coherence.find_one({"session_id": session_id})
        if not report:
            raise HTTPException(status_code=404, detail="Coherence report not found")
        
        return {
            "session_id": session_id,
            "logical_gaps": report.get('logical_gaps', []),
            "total": len(report.get('logical_gaps', []))
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Create router instance for import
coherence_router = router