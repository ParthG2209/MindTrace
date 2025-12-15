import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "mindtrace")
    
    # LLM Configuration
    LLM_STRATEGY = os.getenv("LLM_STRATEGY", "hybrid")
    
    # Google Gemini (Primary) - FREE
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Groq (Secondary) - FREE
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Fallback Configuration
    FALLBACK_TO_MOCK = os.getenv("FALLBACK_TO_MOCK", "true").lower() == "true"
    
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
    
    # Core Metrics Weights (Total: 1.0)
    WEIGHT_CLARITY = float(os.getenv("WEIGHT_CLARITY", "0.20"))  # Reduced
    WEIGHT_STRUCTURE = float(os.getenv("WEIGHT_STRUCTURE", "0.15"))  # Reduced
    WEIGHT_CORRECTNESS = float(os.getenv("WEIGHT_CORRECTNESS", "0.20"))  # Reduced
    WEIGHT_PACING = float(os.getenv("WEIGHT_PACING", "0.10"))  # Reduced
    WEIGHT_COMMUNICATION = float(os.getenv("WEIGHT_COMMUNICATION", "0.10"))  # Reduced
    
    # Advanced Metrics Weights (Total: 0.35)
    WEIGHT_ENGAGEMENT = float(os.getenv("WEIGHT_ENGAGEMENT", "0.08"))
    WEIGHT_EXAMPLES = float(os.getenv("WEIGHT_EXAMPLES", "0.07"))
    WEIGHT_QUESTIONING = float(os.getenv("WEIGHT_QUESTIONING", "0.06"))
    WEIGHT_ADAPTABILITY = float(os.getenv("WEIGHT_ADAPTABILITY", "0.06"))
    WEIGHT_RELEVANCE = float(os.getenv("WEIGHT_RELEVANCE", "0.08"))
    
    # NEW: Classroom Dynamics Weights (Total: 0.10 when enabled)
    WEIGHT_STUDENT_INTERACTION = float(os.getenv("WEIGHT_STUDENT_INTERACTION", "0.04"))
    WEIGHT_OFF_TOPIC_MANAGEMENT = float(os.getenv("WEIGHT_OFF_TOPIC_MANAGEMENT", "0.03"))
    WEIGHT_CLASSROOM_CONTROL = float(os.getenv("WEIGHT_CLASSROOM_CONTROL", "0.03"))
    
    # Topic Analysis
    RELATED_TOPIC_BONUS = float(os.getenv("RELATED_TOPIC_BONUS", "0.5"))
    
    # NEW: Off-Topic Tolerance Settings
    ACCEPTABLE_OFF_TOPIC_PERCENTAGE = float(os.getenv("ACCEPTABLE_OFF_TOPIC_PERCENTAGE", "0.15"))  # 15% is acceptable
    OFF_TOPIC_PENALTY_THRESHOLD = float(os.getenv("OFF_TOPIC_PENALTY_THRESHOLD", "0.30"))  # Penalize above 30%

settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)