from typing import Optional, List
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class PermissionResponse(BaseModel):
    id: str
    code: str
    module: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_system_role: bool = True
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_superadmin: bool
    default_org_id: Optional[str] = None
    role: Optional[str] = None
    entity_ids: List[str] = []
    facility_ids: List[str] = []
    permissions: List[str] = []

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
