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
            print(f"Session {session_id} not found")
            return
        
        print(f"Starting evaluation for session {session_id}")
        print(f"Session topic: {session.get('topic')}, Title: {session.get('title')}")
        
        # Update status to transcribing
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": SessionStatus.TRANSCRIBING, "updated_at": datetime.utcnow()}}
        )
        
        # Transcribe video
        print(f"Transcribing video: {session['video_path']}")
        full_text, segments = await transcription_service.transcribe_video(
            session['video_path']
        )
        print(f"Transcription complete: {len(segments)} segments")
        
        # Segment transcript
        logical_segments = segmentation_service.segment_transcript(segments)
        print(f"Segmentation complete: {len(logical_segments)} logical segments")
        
        # Save transcript
        transcript_dict = TranscriptCreate(
            session_id=session_id,
            full_text=full_text,
            segments=logical_segments
        ).model_dump()
        transcript_dict['created_at'] = datetime.utcnow()
        
        transcript_result = await db.transcripts.insert_one(transcript_dict)
        transcript_id = str(transcript_result.inserted_id)
        print(f"Transcript saved: {transcript_id}")
        
        # Update session with transcript
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
        
        # Evaluate each segment WITH TOPIC AND TITLE
        print(f"Starting LLM evaluation for {len(logical_segments)} segments")
        print(f"⚠️ IMPORTANT: Validating content against topic '{session['topic']}'")
        
        segment_evaluations = []
        topic = session.get('topic', 'Unknown Topic')
        title = session.get('title', '')
        
        for i, seg in enumerate(logical_segments):
            print(f"Evaluating segment {i+1}/{len(logical_segments)}")
            try:
                # PASS BOTH TOPIC AND TITLE TO EVALUATION
                eval_scores = await llm_evaluator.evaluate_segment(
                    seg.text,
                    topic,
                    title  # Now includes session title for better context
                )
                
                seg_eval = SegmentEvaluation(
                    segment_id=seg.segment_id,
                    text=seg.text,
                    clarity=eval_scores['clarity'],
                    structure=eval_scores['structure'],
                    correctness=eval_scores['correctness'],
                    pacing=eval_scores['pacing'],
                    communication=eval_scores['communication'],
                    overall_segment_score=0.0
                )
                
                seg_eval.overall_segment_score = scoring_service.compute_segment_score(seg_eval)
                segment_evaluations.append(seg_eval)
                print(f"Segment {i+1} evaluated: score = {seg_eval.overall_segment_score}")
                
                # Log if segment was marked as off-topic
                if seg_eval.correctness.score < 3.0 and "OFF-TOPIC" in seg_eval.correctness.reason:
                    print(f"⚠️ ALERT: Segment {i+1} flagged as OFF-TOPIC")
                
            except Exception as e:
                print(f"Error evaluating segment {i+1}: {e}")
                raise
        
        # Compute overall metrics
        print("Computing overall metrics")
        metrics = scoring_service.compute_overall_metrics(segment_evaluations)
        overall_score = scoring_service.compute_overall_score(metrics)
        print(f"Overall score: {overall_score}")
        
        # Check if session has significant off-topic content
        off_topic_count = sum(
            1 for seg in segment_evaluations 
            if seg.correctness.score < 3.0 and "OFF-TOPIC" in seg.correctness.reason
        )
        
        if off_topic_count > 0:
            print(f"⚠️ WARNING: {off_topic_count}/{len(segment_evaluations)} segments marked as OFF-TOPIC")
        
        # Determine which LLM provider was used (from settings)
        llm_provider = "gemini" if settings.GOOGLE_API_KEY else "groq" if settings.GROQ_API_KEY else "mock"
        llm_model = settings.GEMINI_MODEL if llm_provider == "gemini" else settings.GROQ_MODEL if llm_provider == "groq" else "mock"
        
        # Save evaluation
        evaluation_dict = {
            'session_id': session_id,
            'overall_score': overall_score,
            'metrics': metrics.model_dump(),
            'segments': [seg.model_dump() for seg in segment_evaluations],
            'created_at': datetime.utcnow(),
            'llm_provider': llm_provider,
            'llm_model': llm_model,
            # Add metadata about topic validation
            'topic_validated': True,
            'off_topic_segments': off_topic_count
        }
        
        eval_result = await db.evaluations.insert_one(evaluation_dict)
        evaluation_id = str(eval_result.inserted_id)
        print(f"Evaluation saved: {evaluation_id}")
        
        # Update session status to completed
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
            print(f"Updated mentor average score: {avg_score}")
        
        print(f"Evaluation complete for session {session_id}")
        
    except Exception as e:
        print(f"❌ Evaluation processing error for session {session_id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Update session status to failed
        try:
            await db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"status": SessionStatus.FAILED, "updated_at": datetime.utcnow()}}
            )
        except Exception as update_error:
            print(f"Error updating session status to failed: {update_error}")

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
        
        # Check if already evaluated
        if session.get('status') == SessionStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Session already evaluated")
        
        # Check if already processing
        if session.get('status') in [SessionStatus.TRANSCRIBING, SessionStatus.ANALYZING]:
            return {
                "message": "Evaluation already in progress",
                "session_id": session_id,
                "status": "processing"
            }
        
        # Add background task
        background_tasks.add_task(process_evaluation, session_id, db)
        
        return {
            "message": "Evaluation started",
            "session_id": session_id,
            "status": "processing"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting evaluation: {e}")
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching evaluation: {e}")
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching evaluation: {e}")
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching evaluation summary: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[EvaluationSummary])
@router.get("", response_model=List[EvaluationSummary])
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
        print(f"Error listing evaluations: {e}")
        raise HTTPException(status_code=400, detail=str(e))