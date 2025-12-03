# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db import db
from routes import mentors, sessions, evaluations
from routes import evidence, rewrites, coherence

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect_to_database()
    yield
    # Shutdown
    await db.close_database_connection()

app = FastAPI(
    title="MindTrace API",
    description="Explainable Mentor Evaluation System",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False  # ✅ Add this to prevent automatic redirects
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://mind-trace-beta.vercel.app",
        "https://*.vercel.app",
        "https://parthg2209-mindtrace.hf.space",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(mentors.router)
app.include_router(sessions.router)
app.include_router(evaluations.router)
app.include_router(evidence.evidence_router)
app.include_router(rewrites.rewrite_router)
app.include_router(coherence.coherence_router)

@app.get("/")
async def root():
    return {
        "message": "MindTrace API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)