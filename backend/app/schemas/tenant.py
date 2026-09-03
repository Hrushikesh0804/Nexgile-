from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str
    code: str
    country: Optional[str] = "USA"
    currency: Optional[str] = "USD"

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    code: str
    country: Optional[str] = None
    currency: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Entity Schemas
class EntityCreate(BaseModel):
    name: str
    code: str
    org_id: str
    parent_entity_id: Optional[str] = None
    country: Optional[str] = "USA"
    legal_structure: Optional[str] = None
    equity_share_pct: Optional[int] = 100

class EntityUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    legal_structure: Optional[str] = None
    equity_share_pct: Optional[int] = None

class EntityResponse(BaseModel):
    id: str
    org_id: str
    name: str
    code: str
    parent_entity_id: Optional[str] = None
    country: Optional[str] = None
    legal_structure: Optional[str] = None
    equity_share_pct: Optional[int] = 100

    class Config:
        from_attributes = True

# Facility Schemas
class FacilityCreate(BaseModel):
    name: str
    code: str
    org_id: str
    entity_id: str
    facility_type: Optional[str] = "Office"
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "USA"
    gross_floor_area_sqm: Optional[int] = None
    operational_control: Optional[bool] = True

class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    facility_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    gross_floor_area_sqm: Optional[int] = None
    operational_control: Optional[bool] = None

class FacilityResponse(BaseModel):
    id: str
    org_id: str
    entity_id: str
    name: str
    code: str
    facility_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    gross_floor_area_sqm: Optional[int] = None
    operational_control: Optional[bool] = True

    class Config:
        from_attributes = True

# User Create / Role Assignment Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    org_id: str
    role_id: str
    entity_ids: Optional[List[str]] = []
    facility_ids: Optional[List[str]] = []
