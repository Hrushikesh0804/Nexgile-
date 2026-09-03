import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, mongo_db
from app.models.tenant import Organization
from app.models.auth import User, Role, UserOrgRole
from app.models.suppliers import Supplier, Questionnaire, Submission, Scorecard
from app.modules.suppliers.services import SupplierService
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_suppliers.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_suppliers_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_supplier_invitation_and_role_creation():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()



    supplier = SupplierService.invite_supplier(
        db=db,
        name="Test Polymer Tech",
        code="SUP-POLY-999",
        contact_email="vendor.poly@test.com",
        category="Plastics",
        country="Japan",
        tier="Tier 1",
        org_id=org.id,
        user_id=admin.id
    )

    assert supplier.id is not None
    assert supplier.contact_email == "vendor.poly@test.com"

    # Verify user account created with Supplier role
    sup_user = db.query(User).filter(User.email == "vendor.poly@test.com").first()
    assert sup_user is not None
    user_role = db.query(UserOrgRole).filter(UserOrgRole.user_id == sup_user.id).first()
    assert user_role is not None
    db.close()

def test_mongo_questionnaire_template_and_submission_validation():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()


    supplier = db.query(Supplier).filter(Supplier.code == "SUP-ACME-001").first()

    # 1. Create Questionnaire Campaign (stores dynamic template in Mongo)
    q = SupplierService.create_questionnaire(
        db=db,
        title="2025 Tier 1 Scope 3 Survey",
        description="Dynamic template test",
        fields=[
            {"field_id": "scope1_co2e", "label": "Scope 1 Direct", "type": "number", "required": True},
            {"field_id": "scope2_co2e", "label": "Scope 2 Energy", "type": "number", "required": True}
        ],
        languages_list=["EN", "DE", "FR"],
        org_id=org.id,
        user_id=admin.id
    )
    assert q.id is not None
    assert q.mongo_ref_id is not None

    # Check Mongo Collection
    doc = mongo_db.questionnaire_templates.find_one({"postgres_ref_id": q.id})
    assert doc is not None
    assert doc["title"] == "2025 Tier 1 Scope 3 Survey"

    # 2. Submit Response
    sub = SupplierService.submit_questionnaire_response(
        db=db,
        supplier_id=supplier.id,
        questionnaire_id=q.id,
        answers={"scope1_co2e": 120.0, "scope2_co2e": 45.0},
        evidence_attachments=[{"file_name": "Audit_Cert.pdf"}],
        user_id=admin.id
    )

    assert sub.id is not None
    assert sub.completeness_score == 100.0
    assert sub.confidence_score == 90.0

    # Check Mongo Submission Document
    sub_doc = mongo_db.submission_responses.find_one({"postgres_ref_id": sub.id})
    assert sub_doc is not None
    assert sub_doc["answers"]["scope1_co2e"] == 120.0

    # 3. Validate Submission & Generate Scorecard
    scorecard = SupplierService.validate_submission_and_update_scorecard(
        db=db,
        submission_id=sub.id,
        user_id=admin.id
    )
    assert scorecard.id is not None
    assert scorecard.maturity_level == "LEADER"
    assert scorecard.total_disclosed_co2e_kg == pytest.approx(165000.0)
    db.close()

def test_carbon_weighted_bid_comparison():
    db = SessionLocal()
    bids = [
        {"supplier_id": "SUP-1", "supplier_name": "Vendor Clean", "bid_price_usd": 100000.0, "disclosed_pcf_co2e_kg": 40.0}, # Below 50 baseline -> 0% penalty
        {"supplier_id": "SUP-2", "supplier_name": "Vendor Dirty", "bid_price_usd": 95000.0, "disclosed_pcf_co2e_kg": 200.0} # 150 over -> 30% penalty = $123,500
    ]

    result = SupplierService.compare_carbon_weighted_bids(db=db, bids=bids)
    assert result["recommended_winner_supplier_id"] == "SUP-1" # Clean vendor wins despite higher initial price!
    assert result["bids"][1]["carbon_weighted_bid_price_usd"] > 95000.0
    db.close()
