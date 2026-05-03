from typing import Any, Dict, Optional, cast

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .db.base import get_db
from .models.user import User
from .core.security import decode_token
from .core.rbac import Role
import logging

# Initialize logging to see errors in your terminal
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # generic exception for production, but we will specialize it for debugging
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Check if token decodes
    payload: Optional[Dict[str, Any]] = decode_token(token)
    if payload is None:
        logger.error("Token decoding failed: Payload is None")
        raise HTTPException(status_code=401, detail="Token invalid or expired")
    
    # 2. Check if email exists in payload
    sub = payload.get("sub")
    if not isinstance(sub, str):
        logger.error("Token payload missing or invalid 'sub' field")
        raise credentials_exception
    email = sub
    
    # 3. Check if user exists in the local SQL database
    # Since you are working with specific study areas like Arsi and Adama, 
    # ensure your local DB actually has this user record.
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        logger.error(f"User not found in database for email: {email}")
        raise HTTPException(status_code=401, detail="User record not found in local database")
    
    # 4. Check active status
    if cast(bool, user.is_active) is False:
        logger.warning(f"Login attempt by inactive user: {email}")
        raise HTTPException(status_code=400, detail="User account is deactivated")
    
    return user