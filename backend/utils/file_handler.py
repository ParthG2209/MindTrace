import os
import uuid
from fastapi import UploadFile
from config import settings

async def save_upload_file(file: UploadFile, prefix: str = "") -> tuple[str, str]:
    """
    Save uploaded file to disk
    
    Args:
        file: The uploaded file
        prefix: Optional prefix for filename
        
    Returns:
        Tuple of (filename, full_path)
    """
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{prefix}{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return unique_filename, file_path

def delete_file(file_path: str) -> bool:
    """Delete file from disk"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False

def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except:
        return 0