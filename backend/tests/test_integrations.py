import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization
from app.models.auth import User
from app.models.carbon import ActivityData
from app.models.integrations import IntegrationConnection, FieldMapping, SyncRun, ReconciliationLog
from app.models.lineage import LineageRecord
from app.modules.integrations.services import ImportPipelineService
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integrations.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_integrations_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_csv_connector_and_field_mapping():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    conn = IntegrationConnection(
        name="Utility Meters Test Feed",
        system_type="CSV_FILE",
        credentials_vault_ref="vault://enc_csv_key_test",
        status="ACTIVE",
        org_id=org.id,
        created_by=admin.id
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)

    mapping = FieldMapping(
        connection_id=conn.id,
        target_entity="ActivityData",
        mapping_json={
            "kwh_used": "quantity",
            "fuel_name": "activity_type",
            "scope_level": "scope",
            "meter_unit": "unit"
        },
        org_id=org.id,
        created_by=admin.id
    )
    db.add(mapping)
    db.commit()

    assert conn.id is not None
    assert mapping.id is not None
    db.close()

def test_import_pipeline_creates_activity_data_and_lineage():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()
    conn = db.query(IntegrationConnection).filter(IntegrationConnection.name == "Utility Meters Test Feed").first()

    raw_csv = (
        "meter_id,scope_level,fuel_name,kwh_used,meter_unit\n"
        "MTR-01,Scope 1,Natural Gas,24500.0,kWh\n"
        "MTR-02,Scope 2,Grid Electricity,52000.0,kWh\n"
        "MTR-03,Scope 1,Diesel Fuel,4100.0,liters"
    )

    sync_run = ImportPipelineService.execute_import_pipeline(
        db=db,
        connection_id=conn.id,
        org_id=org.id,
        user_id=admin.id,
        raw_content=raw_csv,
        file_name="q1_utility_meters.csv"
    )

    assert sync_run.status == "SUCCESS"
    assert sync_run.records_processed == 3
    assert sync_run.records_imported == 3
    assert sync_run.records_rejected == 0

    # Verify ActivityData created in DB
    activities = db.query(ActivityData).filter(ActivityData.source_type == "CONNECTOR_CSV_FILE").all()
    assert len(activities) >= 3

    # Verify LineageRecord created citing source file
    last_act = activities[-1]
    lineage = db.query(LineageRecord).filter(LineageRecord.target_entity_id == last_act.id).first()
    assert lineage is not None
    assert "q1_utility_meters.csv" in lineage.source
    db.close()

def test_reconciliation_log():
    db = SessionLocal()
    sync_run = db.query(SyncRun).order_by(SyncRun.started_at.desc()).first()
    reconcil = db.query(ReconciliationLog).filter(ReconciliationLog.sync_run_id == sync_run.id).first()

    assert reconcil is not None
    assert reconcil.source_count == reconcil.imported_count + reconcil.rejected_count
    assert "Processed" in reconcil.summary_notes
    db.close()

def test_error_queue_and_failed_record_handling():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()
    conn = db.query(IntegrationConnection).filter(IntegrationConnection.name == "Utility Meters Test Feed").first()

    bad_csv = (
        "meter_id,scope_level,fuel_name,kwh_used,meter_unit\n"
        "MTR-01,Scope 1,Natural Gas,INVALID_NUMERIC,kWh\n"
        "MTR-02,Scope 2,Grid Electricity,15000.0,kWh"
    )

    sync_run = ImportPipelineService.execute_import_pipeline(
        db=db,
        connection_id=conn.id,
        org_id=org.id,
        user_id=admin.id,
        raw_content=bad_csv,
        file_name="bad_meter_data.csv"
    )

    assert sync_run.status == "PARTIAL"
    assert sync_run.records_processed == 2
    assert sync_run.records_imported == 1
    assert sync_run.records_rejected == 1
    assert len(sync_run.error_queue_json) == 1
    assert sync_run.error_queue_json[0]["record_index"] == 0
    db.close()
