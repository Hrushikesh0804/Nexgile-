import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User, Role, UserOrgRole
from app.core.security.rbac import CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.core.auth.jwt import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_scoping.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    org = Organization(id="org-1", name="Test Org", code="TEST_ORG")
    db.add(org)
    
    ent = Entity(id="ent-1", org_id="org-1", name="Test Entity", code="ENT1")
    db.add(ent)
    
    fac_a = Facility(id="fac-a", org_id="org-1", entity_id="ent-1", name="Facility A", code="FACA")
    fac_b = Facility(id="fac-b", org_id="org-1", entity_id="ent-1", name="Facility B", code="FACB")
    db.add_all([fac_a, fac_b])
    
    user_fac_mgr = User(
        id="user-fac-mgr",
        email="facmgr@nexgile.com",
        hashed_password=get_password_hash("pass"),
        full_name="Facility Manager A",
        default_org_id="org-1"
    )
    db.add(user_fac_mgr)
    db.commit()
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

def test_facility_manager_cannot_see_other_facilities():
    db = SessionLocal()
    
    # Context for Facility Manager scoped ONLY to Facility A ('fac-a')
    fac_mgr_context = CurrentUserContext(
        user_id="user-fac-mgr",
        email="facmgr@nexgile.com",
        is_superadmin=False,
        org_id="org-1",
        entity_ids=["ent-1"],
        facility_ids=["fac-a"],
        role="FacilityManager",
        permissions=["facility:read"]
    )
    
    query = get_scoped_query(db, Facility, fac_mgr_context)
    visible_facilities = query.all()
    
    assert len(visible_facilities) == 1
    assert visible_facilities[0].id == "fac-a"
    assert visible_facilities[0].name == "Facility A"
    db.close()

def test_superadmin_sees_all_facilities():
    db = SessionLocal()
    
    superadmin_context = CurrentUserContext(
        user_id="user-admin",
        email="admin@nexgile.com",
        is_superadmin=True,
        org_id="org-1",
        entity_ids=[],
        facility_ids=[],
        role="SuperAdmin",
        permissions=["*"]
    )
    
    query = get_scoped_query(db, Facility, superadmin_context)
    visible_facilities = query.all()
    
    assert len(visible_facilities) == 2
    db.close()
