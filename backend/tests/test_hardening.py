import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization
from app.models.auth import User
from app.models.carbon import ActivityData, Calculation
from app.models.lineage import LineageRecord
from app.models.hardening import LineageVerification, AdminAuditLog
from app.modules.hardening.search.postgres_search import PostgresTSVectorSearchProvider
from app.modules.hardening.services import DataQualityConsoleService, EvidenceAuditService
from app.modules.hardening.bulk_services import BulkOperationsService
from app.models.integrations import IntegrationConnection
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hardening.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_hardening_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_global_search_returns_results_across_multiple_entities():
    db = SessionLocal()
    org = db.query(Organization).first()

    provider = PostgresTSVectorSearchProvider()
    res = provider.search_global(db=db, query="e", org_id=org.id, limit=50)

    assert res.total_results >= 4
    entity_types_found = set([r.entity_type for r in res.results])
    # Definition of done: global search returns results across at least 4 different entity types
    assert len(entity_types_found) >= 4
    db.close()


def test_bulk_import_and_data_quality_console_surfacing():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    conn = db.query(IntegrationConnection).first()

    bulk_csv = (
        "kwh_used,fuel_type,scope_type,unit_type\n"
        "18500.0,Natural Gas,Scope 1,kWh\n"
        "32000.0,Grid Electricity,Scope 2,kWh"
    )

    sync_run = BulkOperationsService.execute_bulk_import(
        db=db,
        connection_id=conn.id,
        org_id=org.id,
        user_id=admin.id,
        raw_csv_content=bulk_csv,
        file_name="bulk_dec_feed.csv"
    )

    assert sync_run.status == "SUCCESS"
    assert sync_run.records_imported == 2

    # Check Data Quality Console flags
    flags = DataQualityConsoleService.get_console_flags(db=db, org_id=org.id)
    assert len(flags) >= 1

    # Test creating remediation task via WorkflowService
    flag = flags[0]
    task = DataQualityConsoleService.create_remediation_task(
        db=db,
        flag_id=flag.id,
        assigned_user_id=admin.id,
        org_id=org.id
    )
    assert task.id is not None
    assert task.task_type == "QUALITY_REMEDIATION"
    db.close()

def test_auditor_lineage_verification_end_to_end():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    # Query existing lineage record
    lin = db.query(LineageRecord).first()
    assert lin is not None

    # Verify line item end-to-end
    verif = EvidenceAuditService.verify_lineage_record(
        db=db,
        lineage_id=lin.lineage_id,
        auditor_user_id=admin.id,
        verification_status="VERIFIED",
        notes="Big4 Auditor signed off calculation formula and emission factor library",
        org_id=org.id
    )

    assert verif.id is not None
    assert verif.verification_status == "VERIFIED"
    assert verif.auditor_user_id == admin.id

    # Verify AdminAuditLog action recorded
    log = db.query(AdminAuditLog).filter(AdminAuditLog.action == "AUDIT_LINEAGE_VERIFIED").first()
    assert log is not None
    assert log.target_id == lin.lineage_id
    db.close()
