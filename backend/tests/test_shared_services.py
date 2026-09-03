import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.core.services.lineage_service import LineageService
from app.core.services.data_quality_service import DataQualityService
from app.core.services.calc_governance_service import CalculationGovernanceService
from app.core.services.workflow_service import WorkflowService
from app.core.services.scenario_service import ScenarioService, no_actuals_mutation
from app.models.governance import CalculationVersion
from fastapi import HTTPException

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_services.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_lineage_service():
    db = SessionLocal()
    lineage_id = LineageService.create_lineage_record(
        db=db,
        source="Electricity Invoice #902",
        methodology="GHG Protocol Scope 2 Location-Based",
        formula="activity_kwh * grid_factor",
        factor_version="eGRID_2024_v1",
        data_version="actuals_2025_q1",
        user_id="user-123",
        target_entity_type="CalculationResult",
        target_entity_id="calc-99",
        org_id="org-1"
    )
    assert lineage_id is not None
    trail = LineageService.get_lineage_trail(db, "calc-99")
    assert len(trail) == 1
    assert trail[0].source == "Electricity Invoice #902"
    db.close()

def test_data_quality_service():
    db = SessionLocal()
    completeness = DataQualityService.score_completeness({"kwh": 500, "supplier": "PowerCo"}, ["kwh", "supplier", "meter_id"])
    assert completeness == 0.67
    
    confidence = DataQualityService.score_confidence("AUTOMATED_METER", "THIRD_PARTY_AUDITED")
    assert confidence == 1.0
    
    flag = DataQualityService.flag_anomaly(
        db=db,
        target_entity_type="MeterRead",
        target_entity_id="meter-1",
        flag_type="ANOMALY",
        severity="HIGH",
        message="Spike detected: +400% vs historical baseline"
    )
    assert flag.id is not None
    assert flag.status == "OPEN"
    db.close()

def test_workflow_service():
    db = SessionLocal()
    task = WorkflowService.create_task(
        db=db,
        title="Collect Q1 Gas Consumption",
        task_type="DATA_COLLECTION",
        assigned_to_user_id="user-fac-mgr",
        description="Please upload invoices for Q1 2025."
    )
    assert task.status == "PENDING"
    
    approved_task = WorkflowService.approve_task(db, task.id, "user-cso", "Approved with valid invoices")
    assert approved_task.status == "COMPLETED"
    db.close()

def test_scenario_decorator_guards_actuals():
    @no_actuals_mutation
    def dummy_scenario_handler(is_scenario=True, target_table="scenario_materials"):
        return "SUCCESS"
        
    assert dummy_scenario_handler(is_scenario=True, target_table="scenario_materials") == "SUCCESS"
    
    with pytest.raises(HTTPException) as exc_info:
        dummy_scenario_handler(is_scenario=False, target_table="actual_emission_records")
    assert exc_info.value.status_code == 403
