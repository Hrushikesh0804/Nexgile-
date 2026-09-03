import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User
from app.models.carbon import Calculation
from app.models.ai_analytics import ReductionInitiative
from app.models.finance import CarbonBudget, CreditOffset, ProjectEconomics
from app.modules.dashboards.services import DashboardService
from app.modules.finance.services import FinanceService
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dashboards_finance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_dashboards_finance_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_executive_dashboard_aggregation():
    db = SessionLocal()
    org = db.query(Organization).first()

    metrics = DashboardService.get_executive_metrics(db=db, org_id=org.id)
    assert metrics["total_emissions_co2e_t"] > 0.0
    assert metrics["scope1_emissions_t"] >= 0.0
    assert metrics["scope2_emissions_t"] >= 0.0
    assert metrics["scope3_emissions_t"] >= 0.0
    assert "energy" in metrics["category_breakdown"]
    assert metrics["trajectory_status"] in ["ON_TRACK", "AT_RISK", "BEHIND"]
    db.close()

def test_operational_hierarchy_drilldown():
    db = SessionLocal()
    org = db.query(Organization).first()

    # Company level -> Entities
    nodes = DashboardService.get_operational_drilldown(db=db, org_id=org.id, parent_level="COMPANY")
    assert len(nodes) >= 1
    assert nodes[0]["level"] == "ENTITY"
    assert nodes[0]["quality_score"] > 0.0

    # Entity level -> Facilities
    ent_id = nodes[0]["id"]
    fac_nodes = DashboardService.get_operational_drilldown(db=db, org_id=org.id, parent_level="ENTITY", parent_id=ent_id)
    assert len(fac_nodes) >= 1
    assert fac_nodes[0]["level"] == "FACILITY"

    # Facility level -> Departments
    fac_id = fac_nodes[0]["id"]
    dept_nodes = DashboardService.get_operational_drilldown(db=db, org_id=org.id, parent_level="FACILITY", parent_id=fac_id)
    assert len(dept_nodes) >= 1
    assert dept_nodes[0]["level"] == "DEPARTMENT"
    db.close()

def test_carbon_budget_initiative_linkage():
    db = SessionLocal()
    org = db.query(Organization).first()
    init = db.query(ReductionInitiative).first()

    # Update initiative progress to 50%
    init.actual_progress_pct = 50.0
    db.commit()

    budget = CarbonBudget(
        fiscal_year=2026,
        allocated_co2e_kg=200000.0,
        consumed_co2e_kg=0.0,
        status="ON_TRACK",
        linked_initiative_id=init.id,
        org_id=org.id
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)

    # Sync budget consumption against initiative progress
    synced = FinanceService.sync_budget_consumption(db=db, budget_id=budget.id)
    assert synced.consumed_co2e_kg == init.expected_reduction_co2e_kg * 0.50
    db.close()

def test_offset_registry_and_retirement():
    db = SessionLocal()
    org = db.query(Organization).first()
    admin = db.query(User).filter(User.email == "admin@nexgile.com").first()

    offset = CreditOffset(
        project_name="VCS Woodland Reforestation",
        registry="Verra VCS",
        serial_number="VCS-TEST-998231",
        quantity_tco2e=100.0,
        cost_per_tco2e_usd=22.00,
        status="ACTIVE",
        org_id=org.id,
        created_by=admin.id
    )
    db.add(offset)
    db.commit()

    retired = FinanceService.retire_credit_offset(
        db=db,
        offset_id=offset.id,
        evidence_url="https://registry.verra.org/proof/VCS-TEST-998231",
        user_id=admin.id
    )
    assert retired.status == "RETIRED"
    assert retired.retirement_evidence_url == "https://registry.verra.org/proof/VCS-TEST-998231"
    db.close()

def test_project_economics_calculation():
    db = SessionLocal()
    init = db.query(ReductionInitiative).first()

    econ = FinanceService.calculate_project_economics(
        db=db,
        initiative_id=init.id,
        discount_rate_pct=8.0
    )
    assert econ.npv_usd is not None
    assert econ.irr_pct > 0.0
    assert econ.payback_period_years > 0.0
    db.close()
