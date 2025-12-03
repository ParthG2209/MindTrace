import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://guptaparth2209_db_user:Parth2209@cluster0.0um35et.mongodb.net/mindtrace?retryWrites=true&w=majority")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "mindtrace")
    
    # ===== NEW: LLM Configuration =====
    LLM_STRATEGY = os.getenv("LLM_STRATEGY", "hybrid")
    
    # Google Gemini (Primary) - FREE
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Groq (Secondary) - FREE
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Fallback Configuration
    FALLBACK_TO_MOCK = os.getenv("FALLBACK_TO_MOCK", "true").lower() == "true"
    # ===== END NEW =====
    
    # API Keys (Optional)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # File Upload
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB
    
    # ===== REMOVED: Old LLM Settings =====
    # LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")
    # LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")
    # ===== END REMOVED =====
    
    # Scoring Weights
    WEIGHT_CLARITY = 0.25
    WEIGHT_STRUCTURE = 0.20
    WEIGHT_CORRECTNESS = 0.25
    WEIGHT_PACING = 0.15
    WEIGHT_COMMUNICATION = 0.15

settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)