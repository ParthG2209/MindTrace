import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "mindtrace")
    
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # File Upload
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB
    
    # LLM Settings
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")  # 'anthropic' or 'openai'
    LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")
    
    # Scoring Weights
    WEIGHT_CLARITY = 0.25
    WEIGHT_STRUCTURE = 0.20
    WEIGHT_CORRECTNESS = 0.25
    WEIGHT_PACING = 0.15
    WEIGHT_COMMUNICATION = 0.15

settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)