import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, mongo_db
from app.models.tenant import Organization, Facility
from app.models.auth import User
from app.models.carbon import ActivityData, Calculation
from app.models.ai_analytics import ScenarioForecast, ReductionInitiative, DocumentIngestion
from app.models.data_quality import DataQualityFlag
from app.modules.ai_analytics.services import AIAnalyticsService
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ai_analytics.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_ai_analytics_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_what_if_and_forecasting_isolation_does_not_mutate_actuals():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    # Record baseline actuals count & values
    initial_calcs = db.query(Calculation).filter(Calculation.org_id == org.id).all()
    initial_calc_count = len(initial_calcs)
    initial_co2e_sum = sum(c.calculated_co2e_kg for c in initial_calcs)

    # 1. Run What-If Scenario
    scenario_res = AIAnalyticsService.run_what_if_scenario(
        db=db,
        scenario_name="Net-Zero 2030",
        renewable_electricity_pct=80.0,
        supplier_switch_pct=50.0,
        material_swap_recycled_pct=60.0,
        org_id=org.id,
        user_id=admin.id
    )
    assert scenario_res["reduction_pct"] > 0.0
    assert scenario_res["isolated_scenario_table"] == "scenario_pcf"

    # 2. Run Forecasting Engine
    forecast = AIAnalyticsService.generate_forecast(
        db=db,
        org_id=org.id,
        user_id=admin.id,
        target_year=2030
    )
    assert forecast.id is not None
    assert forecast.forecasted_co2e_kg > 0.0

    # CRITICAL CHECK: Verify actuals calculation table is 100% UNMUTATED
    calcs_after = db.query(Calculation).filter(Calculation.org_id == org.id).all()
    assert len(calcs_after) == initial_calc_count
    assert sum(c.calculated_co2e_kg for c in calcs_after) == initial_co2e_sum
    db.close()

def test_explainable_anomaly_detection():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()
    facility = db.query(Facility).first()

    from datetime import datetime, timezone
    # Add normal baseline ActivityData entries
    base1 = ActivityData(
        org_id=org.id,
        facility_id=facility.id,
        scope="Scope 1",
        category="Stationary Combustion",
        activity_type="Natural Gas",
        quantity=1000.0,
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        source_type="MANUAL"
    )
    base2 = ActivityData(
        org_id=org.id,
        facility_id=facility.id,
        scope="Scope 1",
        category="Stationary Combustion",
        activity_type="Natural Gas",
        quantity=1100.0,
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        source_type="MANUAL"
    )
    # Add an outlier ActivityData entry (95x mean)
    outlier = ActivityData(
        org_id=org.id,
        facility_id=facility.id,
        scope="Scope 1",
        category="Stationary Combustion",
        activity_type="Natural Gas",
        quantity=95000.0, # Massive outlier
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        source_type="MANUAL"
    )
    db.add_all([base1, base2, outlier])
    db.commit()



    anomalies = AIAnalyticsService.run_anomaly_detection(db=db, org_id=org.id, user_id=admin.id)
    assert len(anomalies) >= 1

    # Check explainability text
    flag = db.query(DataQualityFlag).filter(DataQualityFlag.target_entity_id == outlier.id).first()
    assert flag is not None
    assert flag.flag_type == "AI_ANOMALY"
    assert "exceeds" in flag.message or "std-devs" in flag.message
    db.close()


def test_document_ocr_pipeline_and_human_approval():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    # 1. OCR Ingestion
    doc = AIAnalyticsService.process_document_ocr(
        db=db,
        file_name="Jan2025_Gas_Bill.pdf",
        raw_text_content="Reliant Texas Energy Natural Gas 12500 kWh Invoice #88492",
        org_id=org.id,
        user_id=admin.id
    )
    assert doc.id is not None
    assert doc.status == "EXTRACTED_DRAFT"

    # Verify Draft ActivityData created (NOT yet an approved actual)
    draft_act = db.query(ActivityData).filter(ActivityData.id == doc.created_activity_data_id).first()
    assert draft_act is not None
    assert draft_act.source_type == "OCR_INGESTION_DRAFT"

    # 2. Human Approval Workflow
    calc = AIAnalyticsService.approve_document_draft(db=db, document_id=doc.id, user_id=admin.id)
    assert calc.id is not None
    assert calc.status == "APPROVED"

    db.refresh(doc)
    assert doc.status == "APPROVED"
    db.close()

def test_macc_reduction_planning():
    db = SessionLocal()
    org = db.query(Organization).first()

    macc = AIAnalyticsService.generate_macc(db=db, org_id=org.id)
    assert len(macc["initiatives"]) >= 3
    assert macc["total_potential_reduction_tco2e"] > 0.0

    # Verify ordering by abatement cost ($ / tCO2e)
    costs = [item["abatement_cost_per_tco2e"] for item in macc["initiatives"]]
    assert costs == sorted(costs)
    db.close()
