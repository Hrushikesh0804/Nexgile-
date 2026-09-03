import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization
from app.models.auth import User
from app.models.carbon import Calculation
from app.models.products import PCF
from app.models.compliance import Framework, Disclosure, DisclosureDataPoint, CBAMDeclaration, EUTaxonomyAlignment
from app.modules.compliance.services import ComplianceService
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_compliance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.core.services.lineage_service import LineageService

@pytest.fixture(scope="module", autouse=True)
def setup_compliance_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()
    
    # Create lineage record
    lineage_id = LineageService.create_lineage_record(
        db=db,
        source="Stationary Combustion Meter",
        methodology="GHG Protocol Corporate Standard",
        formula="quantity * factor",
        factor_version="v2024.1",
        data_version="v1.0",
        user_id=admin.id,
        target_entity_type="Calculation",
        target_entity_id="calc-csrd-001",
        org_id=org.id
    )

    from datetime import datetime, timezone
    from app.models.carbon import ActivityData, EmissionFactor, Calculation
    from app.models.tenant import Facility

    fac = db.query(Facility).first()
    ef = db.query(EmissionFactor).first()

    act = ActivityData(
        org_id=org.id,
        facility_id=fac.id,
        scope="Scope 1",
        category="Stationary Combustion",
        activity_type="Natural Gas",
        quantity=10000.0,
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        source_type="MANUAL"
    )
    db.add(act)
    db.commit()

    # Create Calculation record
    calc = Calculation(
        id="calc-csrd-001",
        activity_data_id=act.id,
        factor_id=ef.id if ef else "ef-001",
        formula_expression="quantity * factor",
        input_quantity=10000.0,
        calculated_co2e_kg=125000.0,
        status="APPROVED",
        lineage_id=lineage_id,
        org_id=org.id,
        created_by=admin.id
    )
    db.add(calc)
    db.commit()


    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def test_csrd_disclosure_creation_with_lineage_citation():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    disclosure = ComplianceService.create_csrd_disclosure(
        db=db,
        org_id=org.id,
        user_id=admin.id,
        reporting_year=2026
    )
    assert disclosure.id is not None
    assert disclosure.status == "DRAFT"
    assert disclosure.double_materiality_json is not None

    datapoints = db.query(DisclosureDataPoint).filter(DisclosureDataPoint.disclosure_id == disclosure.id).all()
    assert len(datapoints) >= 1

    # Verify XBRL tags & Lineage ID citation
    for dp in datapoints:
        assert dp.xbrl_tag is not None
        assert dp.lineage_id is not None
        assert dp.source_record_type in ["CALCULATION", "PCF"]
    db.close()

def test_approval_workflow_and_locking():
    db = SessionLocal()
    disclosure = db.query(Disclosure).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    # 1. Submit for review
    sub = ComplianceService.process_approval_workflow(db=db, disclosure_id=disclosure.id, reviewer_user_id=admin.id, action="SUBMIT", comments="Submitted for audit")
    assert sub.status == "SUBMITTED_FOR_REVIEW"

    # 2. Approve
    appr = ComplianceService.process_approval_workflow(db=db, disclosure_id=disclosure.id, reviewer_user_id=admin.id, action="APPROVE", comments="Audit approved")
    assert appr.status == "APPROVED"

    # 3. Lock & Freeze
    locked = ComplianceService.process_approval_workflow(db=db, disclosure_id=disclosure.id, reviewer_user_id=admin.id, action="LOCK", comments="Locked for submission")
    assert locked.status == "LOCKED"
    assert locked.locked_at is not None
    db.close()

def test_disclosure_package_export_with_lineage_appendix():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    disclosure = ComplianceService.create_csrd_disclosure(
        db=db,
        org_id=org.id,
        user_id=admin.id,
        reporting_year=2026
    )

    package = ComplianceService.export_disclosure_package(db=db, disclosure_id=disclosure.id)
    assert package["disclosure_id"] == disclosure.id
    assert package["framework_name"] is not None
    assert len(package["data_points"]) >= 1
    assert "lineage_appendix" in package
    assert len(package["lineage_appendix"]) >= 1
    assert len(package["evidence_attachments"]) >= 1
    db.close()


def test_cbam_declaration_embedded_emissions():
    db = SessionLocal()
    disclosure = db.query(Disclosure).first()

    cbam = ComplianceService.process_cbam_declaration(
        db=db,
        disclosure_id=disclosure.id,
        imported_product_id="prod-steel-001",
        quarterly_period="Q1-2026",
        embedded_emissions_tco2e=450.0,
        data_origin="ACTUAL_PRIMARY"
    )
    assert cbam.id is not None
    assert cbam.certificates_purchased == 450
    assert cbam.adjustment_eur == 450.0 * 85.0
    db.close()

def test_eu_taxonomy_alignment():
    db = SessionLocal()
    disclosure = db.query(Disclosure).first()

    align = ComplianceService.process_eu_taxonomy_alignment(
        db=db,
        disclosure_id=disclosure.id,
        activity_code="CCM 3.1",
        capex_aligned=450000.0,
        opex_aligned=12000.0,
        revenue_aligned=1200000.0
    )
    assert align.id is not None
    assert align.eligibility_status is True
    assert align.alignment_status is True
    assert align.dnsh_checklist_json["climate_adaptation"] == "COMPLIANT"
    db.close()
