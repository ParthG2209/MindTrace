from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import httpx
from functools import wraps

# Firebase configuration
FIREBASE_PROJECT_ID = "your-project-id"  # Update this
FIREBASE_API_KEY = "your-firebase-api-key"  # Update this

security = HTTPBearer()

class AuthService:
    """Handle Firebase authentication"""
    
    def __init__(self):
        self.firebase_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}"
        
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Firebase ID token
        
        Args:
            token: Firebase ID token
            
        Returns:
            User information from token
            
        Raises:
            HTTPException: If token is invalid
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.firebase_url,
                    json={"idToken": token}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid authentication token"
                    )
                
                data = response.json()
                
                if not data.get("users"):
                    raise HTTPException(
                        status_code=401,
                        detail="User not found"
                    )
                
                user = data["users"][0]
                
                return {
                    "uid": user.get("localId"),
                    "email": user.get("email"),
                    "email_verified": user.get("emailVerified", False),
                    "display_name": user.get("displayName"),
                    "photo_url": user.get("photoUrl"),
                }
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Authentication service unavailable: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail=f"Authentication failed: {str(e)}"
            )

auth_service = AuthService()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user
    
    Usage:
        @app.get("/protected")
        async def protected_route(user = Depends(get_current_user)):
            return {"user": user}
    """
    token = credentials.credentials
    return await auth_service.verify_token(token)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns None if not authenticated
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        return await auth_service.verify_token(token)
    except HTTPException:
        return None

def require_admin():
    """
    Dependency that requires admin role
    
    Usage:
        @app.get("/admin")
        async def admin_route(user = Depends(require_admin)):
            return {"admin": user}
    """
    async def admin_dependency(user: Dict[str, Any] = Depends(get_current_user)):
        # Check if user has admin role (implement your logic)
        # For now, check if email is in admin list
        ADMIN_EMAILS = ["admin@example.com"]  # Update this
        
        if user.get("email") not in ADMIN_EMAILS:
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        return user
    
    return admin_dependency

# Simple token verification (without Firebase for testing)
async def verify_simple_token(token: str) -> Dict[str, Any]:
    """
    Simple token verification for testing without Firebase
    Remove this in production
    """
    if token == "test-token":
        return {
            "uid": "test-user-id",
            "email": "test@example.com",
            "email_verified": True,
            "display_name": "Test User"
        }
    
    raise HTTPException(
        status_code=401,
        detail="Invalid token"
    )