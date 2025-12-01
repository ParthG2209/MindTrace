from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from bson import ObjectId

from models.evidence import EvidenceCollection, EvidenceItem
from models.evaluation import SegmentEvaluation
from db import get_db
from services.evidence_extractor import evidence_extractor

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

async def extract_evidence_task(evaluation_id: str, evaluation: dict, db):
    """Background task to extract evidence"""
    try:
        # Reconstruct segments
        segments = [SegmentEvaluation(**seg) for seg in evaluation['segments']]
        
        # Extract evidence
        evidence_by_metric = await evidence_extractor.extract_all_evidence(segments)
        
        # Flatten to items list
        all_items = []
        for metric, items in evidence_by_metric.items():
            all_items.extend(items)
        
        # Save to database
        evidence_doc = {
            'session_id': evaluation['session_id'],
            'evaluation_id': evaluation_id,
            'items': all_items,
            'total_issues': len(all_items),
            'created_at': datetime.utcnow()
        }
        
        await db.evidence.insert_one(evidence_doc)
        
    except Exception as e:
        print(f"Evidence extraction failed: {e}")

@router.post("/extract/{evaluation_id}")
async def extract_evidence(
    evaluation_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """
    Extract evidence from all low-scoring segments in an evaluation
    Process runs in background
    """
    try:
        # Get evaluation
        evaluation = await db.evaluations.find_one({"_id": ObjectId(evaluation_id)})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Start background extraction
        background_tasks.add_task(
            extract_evidence_task,
            evaluation_id,
            evaluation,
            db
        )
        
        return {
            "message": "Evidence extraction started",
            "evaluation_id": evaluation_id,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evaluation_id}")
async def get_evidence(evaluation_id: str, db=Depends(get_db)):
    """Get all evidence for an evaluation"""
    try:
        evidence = await db.evidence.find_one({"evaluation_id": evaluation_id})
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        evidence['_id'] = str(evidence['_id'])
        return evidence
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evaluation_id}/segment/{segment_id}")
async def get_segment_evidence(
    evaluation_id: str,
    segment_id: int,
    db=Depends(get_db)
):
    """Get evidence for a specific segment"""
    try:
        evidence = await db.evidence.find_one({"evaluation_id": evaluation_id})
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        # Filter items for this segment
        segment_items = [
            item for item in evidence['items']
            if item['segment_id'] == segment_id
        ]
        
        return {
            "segment_id": segment_id,
            "items": segment_items,
            "total": len(segment_items)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evaluation_id}/metric/{metric_name}")
async def get_metric_evidence(
    evaluation_id: str,
    metric_name: str,
    db=Depends(get_db)
):
    """Get evidence for a specific metric"""
    try:
        evidence = await db.evidence.find_one({"evaluation_id": evaluation_id})
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        # Filter items for this metric
        metric_items = [
            item for item in evidence['items']
            if item['metric'] == metric_name
        ]
        
        return {
            "metric": metric_name,
            "items": metric_items,
            "total": len(metric_items)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Create router instance for import
evidence_router = router