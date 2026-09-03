from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth.jwt import decode_access_token
from app.models.auth import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/admin/auth/login")

class CurrentUserContext:
    def __init__(
        self,
        user_id: str,
        email: str,
        is_superadmin: bool,
        org_id: Optional[str],
        entity_ids: List[str],
        facility_ids: List[str],
        role: Optional[str],
        permissions: List[str]
    ):
        self.user_id = user_id
        self.email = email
        self.is_superadmin = is_superadmin
        self.org_id = org_id
        self.entity_ids = entity_ids
        self.facility_ids = facility_ids
        self.role = role
        self.permissions = permissions

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> CurrentUserContext:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
        
    return CurrentUserContext(
        user_id=user.id,
        email=user.email,
        is_superadmin=user.is_superadmin,
        org_id=payload.get("org_id") or user.default_org_id,
        entity_ids=payload.get("entity_ids", []),
        facility_ids=payload.get("facility_ids", []),
        role=payload.get("role"),
        permissions=payload.get("permissions", [])
    )

def require_permission(permission_code: str):
    def permission_checker(current_user: CurrentUserContext = Depends(get_current_user)):
        if current_user.is_superadmin:
            return current_user
        if permission_code not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: Missing permission '{permission_code}'"
            )
        return current_user
    return permission_checker
