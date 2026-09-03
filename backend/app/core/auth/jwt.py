import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import jwt
from app.config import settings

def get_password_hash(password: str) -> str:
    salt = settings.JWT_SECRET_KEY.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(get_password_hash(plain_password), hashed_password)


def create_access_token(
    user_id: str,
    email: str,
    org_id: Optional[str] = None,
    entity_ids: Optional[List[str]] = None,
    facility_ids: Optional[List[str]] = None,
    role: Optional[str] = None,
    permissions: Optional[List[str]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    payload: Dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "org_id": org_id,
        "entity_ids": entity_ids or [],
        "facility_ids": facility_ids or [],
        "role": role,
        "permissions": permissions or [],
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return {}
