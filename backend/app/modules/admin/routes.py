from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth.jwt import create_access_token, verify_password, get_password_hash
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User, Role, UserOrgRole, Permission
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, RoleResponse
from app.schemas.tenant import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse,
    EntityCreate, EntityUpdate, EntityResponse,
    FacilityCreate, FacilityUpdate, FacilityResponse,
    UserCreate
)
from app.schemas.envelope import APIEnvelope

router = APIRouter(prefix="/admin", tags=["Admin Module"])

# ==========================================
# AUTH ENDPOINTS
# ==========================================

@router.post("/auth/login", response_model=APIEnvelope[TokenResponse])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")
        
    org_id = user.default_org_id
    role_name = "SuperAdmin" if user.is_superadmin else None
    entity_ids = []
    facility_ids = []
    permissions = []
    
    # Extract user role assignment if available
    user_org_role = db.query(UserOrgRole).filter(UserOrgRole.user_id == user.id).first()
    if user_org_role:
        org_id = user_org_role.org_id
        role = db.query(Role).filter(Role.id == user_org_role.role_id).first()
        if role:
            role_name = role.name
            permissions = [p.code for p in role.permissions]
        entity_ids = user_org_role.entity_ids or []
        facility_ids = user_org_role.facility_ids or []
        
    if user.is_superadmin:
        all_perms = db.query(Permission.code).all()
        permissions = [p[0] for p in all_perms]
        
    token = create_access_token(
        user_id=user.id,
        email=user.email,
        org_id=org_id,
        entity_ids=entity_ids,
        facility_ids=facility_ids,
        role=role_name,
        permissions=permissions
    )
    
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superadmin=user.is_superadmin,
        default_org_id=org_id,
        role=role_name,
        entity_ids=entity_ids,
        facility_ids=facility_ids,
        permissions=permissions
    )
    
    token_resp = TokenResponse(access_token=token, token_type="bearer", user=user_resp)
    return APIEnvelope.success(data=token_resp)

@router.get("/auth/me", response_model=APIEnvelope[UserResponse])
def get_current_user_profile(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user.user_id).first()
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superadmin=user.is_superadmin,
        default_org_id=current_user.org_id,
        role=current_user.role,
        entity_ids=current_user.entity_ids,
        facility_ids=current_user.facility_ids,
        permissions=current_user.permissions
    )
    return APIEnvelope.success(data=user_resp)

# ==========================================
# ORGANIZATIONS CRUD
# ==========================================

@router.get("/organizations", response_model=APIEnvelope[List[OrganizationResponse]])
def list_organizations(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_superadmin:
        orgs = db.query(Organization).all()
    else:
        orgs = db.query(Organization).filter(Organization.id == current_user.org_id).all()
    return APIEnvelope.success(data=orgs)

@router.post("/organizations", response_model=APIEnvelope[OrganizationResponse])
def create_organization(
    payload: OrganizationCreate,
    current_user: CurrentUserContext = Depends(require_permission("org:manage")),
    db: Session = Depends(get_db)
):
    existing = db.query(Organization).filter(Organization.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization code already exists")
        
    org = Organization(
        name=payload.name,
        code=payload.code,
        country=payload.country,
        currency=payload.currency
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return APIEnvelope.success(data=org)

# ==========================================
# ENTITIES CRUD
# ==========================================

@router.get("/entities", response_model=APIEnvelope[List[EntityResponse]])
def list_entities(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, Entity, current_user)
    entities = query.all()
    return APIEnvelope.success(data=entities)

@router.post("/entities", response_model=APIEnvelope[EntityResponse])
def create_entity(
    payload: EntityCreate,
    current_user: CurrentUserContext = Depends(require_permission("entity:manage")),
    db: Session = Depends(get_db)
):
    entity = Entity(
        org_id=payload.org_id,
        name=payload.name,
        code=payload.code,
        parent_entity_id=payload.parent_entity_id,
        country=payload.country,
        legal_structure=payload.legal_structure,
        equity_share_pct=payload.equity_share_pct,
        created_by=current_user.user_id
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return APIEnvelope.success(data=entity)

# ==========================================
# FACILITIES CRUD
# ==========================================

@router.get("/facilities", response_model=APIEnvelope[List[FacilityResponse]])
def list_facilities(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, Facility, current_user)
    facilities = query.all()
    return APIEnvelope.success(data=facilities)

@router.post("/facilities", response_model=APIEnvelope[FacilityResponse])
def create_facility(
    payload: FacilityCreate,
    current_user: CurrentUserContext = Depends(require_permission("facility:manage")),
    db: Session = Depends(get_db)
):
    facility = Facility(
        org_id=payload.org_id,
        entity_id=payload.entity_id,
        name=payload.name,
        code=payload.code,
        facility_type=payload.facility_type,
        address=payload.address,
        city=payload.city,
        country=payload.country,
        gross_floor_area_sqm=payload.gross_floor_area_sqm,
        operational_control=payload.operational_control,
        created_by=current_user.user_id
    )
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return APIEnvelope.success(data=facility)

# ==========================================
# USERS & ROLES CRUD
# ==========================================

@router.get("/roles", response_model=APIEnvelope[List[RoleResponse]])
def list_roles(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).all()
    return APIEnvelope.success(data=roles)

@router.get("/users", response_model=APIEnvelope[List[UserResponse]])
def list_users(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    results = []
    for u in users:
        role_name = "SuperAdmin" if u.is_superadmin else None
        entity_ids = []
        facility_ids = []
        u_role = db.query(UserOrgRole).filter(UserOrgRole.user_id == u.id).first()
        if u_role:
            r = db.query(Role).filter(Role.id == u_role.role_id).first()
            if r:
                role_name = r.name
            entity_ids = u_role.entity_ids or []
            facility_ids = u_role.facility_ids or []
            
        results.append(UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            is_superadmin=u.is_superadmin,
            default_org_id=u.default_org_id,
            role=role_name,
            entity_ids=entity_ids,
            facility_ids=facility_ids,
            permissions=[]
        ))
    return APIEnvelope.success(data=results)

@router.post("/users", response_model=APIEnvelope[UserResponse])
def create_user(
    payload: UserCreate,
    current_user: CurrentUserContext = Depends(require_permission("user:manage")),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        default_org_id=payload.org_id,
        is_active=True,
        is_superadmin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Assign Role & Scoping
    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if role:
        u_role = UserOrgRole(
            user_id=user.id,
            org_id=payload.org_id,
            role_id=role.id,
            entity_ids=payload.entity_ids or [],
            facility_ids=payload.facility_ids or []
        )
        db.add(u_role)
        db.commit()
        
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superadmin=False,
        default_org_id=payload.org_id,
        role=role.name if role else None,
        entity_ids=payload.entity_ids or [],
        facility_ids=payload.facility_ids or [],
        permissions=[]
    )
    return APIEnvelope.success(data=user_resp)
