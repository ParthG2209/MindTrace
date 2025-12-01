import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

# Sample mentor data
SAMPLE_MENTORS = [
    {
        "name": "Dr. Sarah Chen",
        "email": "sarah.chen@university.edu",
        "expertise": ["Python", "Machine Learning", "Data Science"],
        "bio": "PhD in Computer Science with 10 years of teaching experience"
    },
    {
        "name": "Prof. Michael Rodriguez",
        "email": "m.rodriguez@tech.edu",
        "expertise": ["JavaScript", "Web Development", "React"],
        "bio": "Senior lecturer specializing in full-stack development"
    },
    {
        "name": "Dr. Aisha Patel",
        "email": "aisha.patel@institute.edu",
        "expertise": ["Java", "Object-Oriented Programming", "Algorithms"],
        "bio": "Associate professor with focus on software engineering"
    },
    {
        "name": "Prof. James Wilson",
        "email": "j.wilson@college.edu",
        "expertise": ["C++", "Systems Programming", "Operating Systems"],
        "bio": "20 years of industry experience before joining academia"
    },
    {
        "name": "Dr. Lisa Kim",
        "email": "lisa.kim@university.edu",
        "expertise": ["Databases", "SQL", "NoSQL", "Cloud Computing"],
        "bio": "Specialist in database systems and cloud architecture"
    }
]

# Sample session titles and topics
SAMPLE_SESSIONS = [
    # Good sessions (high scores)
    {
        "title": "Introduction to Python Decorators",
        "topic": "Python Programming",
        "quality": "excellent",
        "description": "Well-structured explanation with clear examples"
    },
    {
        "title": "Understanding React Hooks",
        "topic": "Web Development",
        "quality": "excellent",
        "description": "Comprehensive coverage with practical demonstrations"
    },
    # Medium sessions (moderate scores)
    {
        "title": "Database Normalization Basics",
        "topic": "Database Design",
        "quality": "good",
        "description": "Good content but pacing issues"
    },
    {
        "title": "Object-Oriented Design Patterns",
        "topic": "Software Engineering",
        "quality": "good",
        "description": "Clear explanations with minor structural issues"
    },
    {
        "title": "Async/Await in JavaScript",
        "topic": "JavaScript",
        "quality": "good",
        "description": "Technical accuracy with some clarity issues"
    },
    # Problematic sessions (low scores)
    {
        "title": "Introduction to Algorithms",
        "topic": "Computer Science",
        "quality": "needs_improvement",
        "description": "Unclear explanations and logical gaps"
    },
    {
        "title": "REST API Design",
        "topic": "Backend Development",
        "quality": "needs_improvement",
        "description": "Contradictory statements and topic drift"
    },
    {
        "title": "Memory Management in C++",
        "topic": "Systems Programming",
        "quality": "poor",
        "description": "Confusing examples and poor structure"
    },
    {
        "title": "SQL Query Optimization",
        "topic": "Database Performance",
        "quality": "needs_improvement",
        "description": "Too fast-paced with missing explanations"
    },
    {
        "title": "Machine Learning Fundamentals",
        "topic": "Artificial Intelligence",
        "quality": "poor",
        "description": "Vague terminology and unclear concepts"
    }
]

# Score generators based on quality
def generate_scores(quality: str):
    """Generate realistic score patterns based on quality"""
    
    if quality == "excellent":
        return {
            "clarity": random.uniform(8.5, 9.8),
            "structure": random.uniform(8.0, 9.5),
            "correctness": random.uniform(8.5, 9.8),
            "pacing": random.uniform(7.5, 9.0),
            "communication": random.uniform(8.0, 9.5)
        }
    elif quality == "good":
        return {
            "clarity": random.uniform(7.0, 8.5),
            "structure": random.uniform(6.5, 8.0),
            "correctness": random.uniform(7.5, 8.8),
            "pacing": random.uniform(6.0, 7.8),
            "communication": random.uniform(6.5, 8.0)
        }
    elif quality == "needs_improvement":
        return {
            "clarity": random.uniform(5.5, 7.0),
            "structure": random.uniform(5.0, 6.8),
            "correctness": random.uniform(6.5, 8.0),
            "pacing": random.uniform(5.0, 6.5),
            "communication": random.uniform(5.5, 7.0)
        }
    else:  # poor
        return {
            "clarity": random.uniform(4.0, 5.5),
            "structure": random.uniform(4.0, 5.5),
            "correctness": random.uniform(5.5, 7.0),
            "pacing": random.uniform(4.0, 5.5),
            "communication": random.uniform(4.5, 6.0)
        }

async def create_demo_data():
    """Create all demo data"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("="*60)
    print("MINDTRACE DEMO DATA LOADER")
    print("="*60)
    
    # Clear existing data
    print("\n1. Clearing existing data...")
    await db.mentors.delete_many({})
    await db.sessions.delete_many({})
    await db.transcripts.delete_many({})
    await db.evaluations.delete_many({})
    await db.evidence.delete_many({})
    await db.rewrites.delete_many({})
    await db.coherence.delete_many({})
    print("   ✅ Cleared")
    
    # Create mentors
    print("\n2. Creating mentors...")
    mentor_ids = []
    for mentor_data in SAMPLE_MENTORS:
        mentor_doc = {
            **mentor_data,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            "updated_at": datetime.utcnow(),
            "total_sessions": 0,
            "average_score": None
        }
        result = await db.mentors.insert_one(mentor_doc)
        mentor_ids.append(str(result.inserted_id))
        print(f"   ✅ Created: {mentor_data['name']}")
    
    # Create sessions with evaluations
    print("\n3. Creating sessions and evaluations...")
    session_count = 0
    
    for session_data in SAMPLE_SESSIONS:
        # Pick random mentor
        mentor_id = random.choice(mentor_ids)
        
        # Create session
        session_doc = {
            "mentor_id": mentor_id,
            "title": session_data["title"],
            "topic": session_data["topic"],
            "video_filename": f"demo_{session_count}.mp4",
            "video_path": f"./uploads/demo_{session_count}.mp4",
            "status": "completed",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "updated_at": datetime.utcnow(),
            "duration": random.randint(300, 1800),  # 5-30 minutes
            "transcript_id": None,
            "evaluation_id": None
        }
        
        session_result = await db.sessions.insert_one(session_doc)
        session_id = str(session_result.inserted_id)
        
        # Generate scores
        scores = generate_scores(session_data["quality"])
        
        # Create evaluation segments
        num_segments = random.randint(5, 12)
        segments = []
        
        for seg_id in range(num_segments):
            # Vary scores slightly within segment
            variance = random.uniform(-0.5, 0.5)
            
            segment = {
                "segment_id": seg_id,
                "text": f"Sample teaching segment {seg_id + 1} for {session_data['title']}",
                "clarity": {
                    "score": round(max(1.0, min(10.0, scores["clarity"] + variance)), 1),
                    "reason": "Clear explanation with good examples" if scores["clarity"] > 7 else "Needs clearer terminology"
                },
                "structure": {
                    "score": round(max(1.0, min(10.0, scores["structure"] + variance)), 1),
                    "reason": "Well organized flow" if scores["structure"] > 7 else "Could improve organization"
                },
                "correctness": {
                    "score": round(max(1.0, min(10.0, scores["correctness"] + variance)), 1),
                    "reason": "Technically accurate" if scores["correctness"] > 7 else "Some technical inaccuracies"
                },
                "pacing": {
                    "score": round(max(1.0, min(10.0, scores["pacing"] + variance)), 1),
                    "reason": "Appropriate speed" if scores["pacing"] > 7 else "Too fast or too slow"
                },
                "communication": {
                    "score": round(max(1.0, min(10.0, scores["communication"] + variance)), 1),
                    "reason": "Engaging delivery" if scores["communication"] > 7 else "Could be more engaging"
                },
                "overall_segment_score": round(sum(scores.values()) / len(scores), 1)
            }
            segments.append(segment)
        
        # Calculate metrics
        metrics = {
            "clarity": round(scores["clarity"], 1),
            "structure": round(scores["structure"], 1),
            "correctness": round(scores["correctness"], 1),
            "pacing": round(scores["pacing"], 1),
            "communication": round(scores["communication"], 1)
        }
        
        # Calculate overall score (weighted average)
        overall_score = round(
            metrics["clarity"] * 0.25 +
            metrics["structure"] * 0.20 +
            metrics["correctness"] * 0.25 +
            metrics["pacing"] * 0.15 +
            metrics["communication"] * 0.15,
            1
        )
        
        # Create evaluation
        evaluation_doc = {
            "session_id": session_id,
            "overall_score": overall_score,
            "metrics": metrics,
            "segments": segments,
            "created_at": datetime.utcnow(),
            "llm_provider": "gemini",
            "llm_model": "gemini-1.5-flash"
        }
        
        eval_result = await db.evaluations.insert_one(evaluation_doc)
        
        # Update session with evaluation ID
        await db.sessions.update_one(
            {"_id": session_result.inserted_id},
            {"$set": {"evaluation_id": str(eval_result.inserted_id)}}
        )
        
        # Update mentor stats
        await db.mentors.update_one(
            {"_id": mentor_id},
            {"$inc": {"total_sessions": 1}}
        )
        
        print(f"   ✅ {session_data['title']} (score: {overall_score}/10)")
        session_count += 1
    
    # Update mentor average scores
    print("\n4. Calculating mentor statistics...")
    for mentor_id in mentor_ids:
        # Get all sessions for this mentor
        sessions = await db.sessions.find({"mentor_id": mentor_id}).to_list(None)
        session_ids_list = [str(s['_id']) for s in sessions]
        
        # Get evaluations
        evaluations = await db.evaluations.find(
            {"session_id": {"$in": session_ids_list}}
        ).to_list(None)
        
        if evaluations:
            avg_score = sum(e['overall_score'] for e in evaluations) / len(evaluations)
            await db.mentors.update_one(
                {"_id": mentor_id},
                {"$set": {"average_score": round(avg_score, 2)}}
            )
    
    print("   ✅ Statistics updated")
    
    # Summary
    print("\n" + "="*60)
    print("DEMO DATA CREATED SUCCESSFULLY")
    print("="*60)
    print(f"Mentors created: {len(mentor_ids)}")
    print(f"Sessions created: {session_count}")
    print(f"Evaluations created: {session_count}")
    print("\n✅ Ready for demo!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_demo_data())