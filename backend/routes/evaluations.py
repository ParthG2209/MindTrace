from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from datetime import datetime
from bson import ObjectId

from models.evaluation import EvaluationInDB, EvaluationSummary, SegmentEvaluation
from models.transcript import TranscriptInDB, TranscriptCreate
from models.session import SessionStatus
from db import get_db
from services.transcription import transcription_service
from services.segmentation import segmentation_service
from services.llm_evaluator import llm_evaluator
from services.scoring import scoring_service
from config import settings

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])

async def process_evaluation(session_id: str, db):
    """Background task to process evaluation"""
    try:
        # Get session
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        # Update status
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": SessionStatus.TRANSCRIBING, "updated_at": datetime.utcnow()}}
        )
        
        # Transcribe video
        full_text, segments = await transcription_service.transcribe_video(
            session['video_path']
        )
        
        # Segment transcript
        logical_segments = segmentation_service.segment_transcript(segments)
        
        # Save transcript
        transcript_dict = TranscriptCreate(
            session_id=session_id,
            full_text=full_text,
            segments=logical_segments
        ).model_dump()
        transcript_dict['created_at'] = datetime.utcnow()
        
        transcript_result = await db.transcripts.insert_one(transcript_dict)
        transcript_id = str(transcript_result.inserted_id)
        
        # Update session
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": SessionStatus.ANALYZING,
                    "transcript_id": transcript_id,
                    "duration": int(logical_segments[-1].end_time) if logical_segments else 0,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Evaluate each segment
        segment_evaluations = []
        for seg in logical_segments:
            eval_scores = await llm_evaluator.evaluate_segment(
                seg.text,
                session['topic']
            )
            
            seg_eval = SegmentEvaluation(
                segment_id=seg.segment_id,
                text=seg.text,
                clarity=eval_scores['clarity'],
                structure=eval_scores['structure'],
                correctness=eval_scores['correctness'],
                pacing=eval_scores['pacing'],
                communication=eval_scores['communication'],
                overall_segment_score=0.0  # Will be computed
            )
            
            seg_eval.overall_segment_score = scoring_service.compute_segment_score(seg_eval)
            segment_evaluations.append(seg_eval)
        
        # Compute overall metrics
        metrics = scoring_service.compute_overall_metrics(segment_evaluations)
        overall_score = scoring_service.compute_overall_score(metrics)
        
        # Save evaluation
        evaluation_dict = {
            'session_id': session_id,
            'overall_score': overall_score,
            'metrics': metrics.model_dump(),
            'segments': [seg.model_dump() for seg in segment_evaluations],
            'created_at': datetime.utcnow(),
            'llm_provider': settings.LLM_PROVIDER,
            'llm_model': settings.LLM_MODEL
        }
        
        eval_result = await db.evaluations.insert_one(evaluation_dict)
        evaluation_id = str(eval_result.inserted_id)
        
        # Update session
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": SessionStatus.COMPLETED,
                    "evaluation_id": evaluation_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update mentor's average score
        mentor_id = session['mentor_id']
        sessions = await db.sessions.find({"mentor_id": mentor_id}).to_list(None)
        session_ids = [str(s['_id']) for s in sessions]
        evaluations = await db.evaluations.find(
            {"session_id": {"$in": session_ids}}
        ).to_list(None)
        
        if evaluations:
            avg_score = sum(e['overall_score'] for e in evaluations) / len(evaluations)
            await db.mentors.update_one(
                {"_id": ObjectId(mentor_id)},
                {"$set": {"average_score": round(avg_score, 2)}}
            )
        
    except Exception as e:
        print(f"Evaluation processing error: {e}")
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": SessionStatus.FAILED, "updated_at": datetime.utcnow()}}
        )

@router.post("/sessions/{session_id}/evaluate")
async def start_evaluation(
    session_id: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """Start evaluation for a session"""
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Add background task
        background_tasks.add_task(process_evaluation, session_id, db)
        
        return {
            "message": "Evaluation started",
            "session_id": session_id,
            "status": "processing"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sessions/{session_id}", response_model=EvaluationInDB)
async def get_session_evaluation(session_id: str, db=Depends(get_db)):
    """Get evaluation for a session"""
    try:
        evaluation = await db.evaluations.find_one({"session_id": session_id})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        evaluation['_id'] = str(evaluation['_id'])
        return EvaluationInDB(**evaluation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evaluation_id}", response_model=EvaluationInDB)
async def get_evaluation(evaluation_id: str, db=Depends(get_db)):
    """Get evaluation by ID"""
    try:
        evaluation = await db.evaluations.find_one({"_id": ObjectId(evaluation_id)})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        evaluation['_id'] = str(evaluation['_id'])
        return EvaluationInDB(**evaluation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{evaluation_id}/summary", response_model=EvaluationSummary)
async def get_evaluation_summary(evaluation_id: str, db=Depends(get_db)):
    """Get evaluation summary"""
    try:
        evaluation = await db.evaluations.find_one({"_id": ObjectId(evaluation_id)})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Reconstruct segment evaluations
        segment_evals = [SegmentEvaluation(**seg) for seg in evaluation['segments']]
        
        # Get strengths and weaknesses
        strengths, weaknesses = scoring_service.identify_strengths_and_weaknesses(
            segment_evals
        )
        
        return EvaluationSummary(
            evaluation_id=str(evaluation['_id']),
            session_id=evaluation['session_id'],
            overall_score=evaluation['overall_score'],
            metrics=evaluation['metrics'],
            strengths=strengths,
            areas_for_improvement=weaknesses,
            created_at=evaluation['created_at']
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[EvaluationSummary])
async def list_evaluations(mentor_id: str = None, db=Depends(get_db)):
    """List all evaluations"""
    try:
        query = {}
        if mentor_id:
            # Get sessions for this mentor
            sessions = await db.sessions.find({"mentor_id": mentor_id}).to_list(None)
            session_ids = [str(s['_id']) for s in sessions]
            query = {"session_id": {"$in": session_ids}}
        
        evaluations = []
        async for evaluation in db.evaluations.find(query).sort('created_at', -1):
            segment_evals = [SegmentEvaluation(**seg) for seg in evaluation['segments']]
            strengths, weaknesses = scoring_service.identify_strengths_and_weaknesses(segment_evals)
            
            evaluations.append(EvaluationSummary(
                evaluation_id=str(evaluation['_id']),
                session_id=evaluation['session_id'],
                overall_score=evaluation['overall_score'],
                metrics=evaluation['metrics'],
                strengths=strengths,
                areas_for_improvement=weaknesses,
                created_at=evaluation['created_at']
            ))
        
        return evaluations
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))