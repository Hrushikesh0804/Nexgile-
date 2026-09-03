import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User
from app.models.carbon import ActivityData, EmissionFactor, Calculation
from app.models.lineage import LineageRecord
from app.modules.carbon.services import CarbonCalculationEngine
from app.seed import seed_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_carbon.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_carbon_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_scope1_calculation_and_lineage():
    db = SessionLocal()
    facility = db.query(Facility).first()
    assert facility is not None

    factor = db.query(EmissionFactor).filter(EmissionFactor.factor_key == "NAT_GAS_US").first()
    assert factor is not None

    activity = ActivityData(
        org_id=facility.org_id,
        facility_id=facility.id,
        scope="Scope 1",
        category="Stationary Combustion",
        activity_type="Natural Gas",
        quantity=5000.0,
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc),
        source_type="MANUAL"
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    calc = CarbonCalculationEngine.calculate_emissions(
        db=db,
        activity_data=activity,
        factor=factor,
        user_id="user-test-123"
    )

    assert calc.id is not None
    assert calc.calculated_co2e_kg == pytest.approx(5000.0 * 0.202, rel=1e-2)
    assert calc.status == "APPROVED"
    assert calc.version == 1
    assert calc.lineage_id is not None

    # Verify Lineage Record in Database
    lineage = db.query(LineageRecord).filter(LineageRecord.lineage_id == calc.lineage_id).first()
    assert lineage is not None
    assert lineage.target_entity_id == activity.id
    assert "Natural Gas" in lineage.formula or "5000" in lineage.formula
    db.close()

def test_factor_revision_triggers_versioned_recalculation():
    db = SessionLocal()
    facility = db.query(Facility).first()
    
    # 1. Create Initial Emission Factor (Version 1.0)
    factor = EmissionFactor(
        factor_key="GRID_ELEC_TEST",
        name="Test Grid Electricity",
        version_tag="v1.0",
        co2e_factor=0.500,
        unit="kWh",
        country="Testland",
        scope="Scope 2",
        category="Grid Electricity",
        source_library="Test Library",
        org_id=facility.org_id
    )
    db.add(factor)
    db.commit()
    db.refresh(factor)

    # 2. Add Activity Data & Initial Calculation (Version 1)
    activity = ActivityData(
        org_id=facility.org_id,
        facility_id=facility.id,
        scope="Scope 2",
        category="Grid Electricity",
        activity_type="Grid Electricity",
        quantity=1000.0,
        unit="kWh",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc)
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    calc_v1 = CarbonCalculationEngine.calculate_emissions(
        db=db, activity_data=activity, factor=factor, user_id="user-test-123"
    )
    assert calc_v1.calculated_co2e_kg == 500.0
    assert calc_v1.version == 1
    assert calc_v1.status == "APPROVED"

    # 3. Update Emission Factor Value & Version Tag
    factor.co2e_factor = 0.400
    factor.version_tag = "v2.0"
    db.commit()

    # 4. Execute Factor Revision Recalculation Engine
    recalcs = CarbonCalculationEngine.recalculate_on_factor_change(
        db=db, factor_id=factor.id, user_id="user-test-123"
    )
    assert len(recalcs) == 1
    calc_v2 = recalcs[0]

    # Verify Versioning & Audit Rules
    db.refresh(calc_v1)
    assert calc_v1.status == "SUPERSEDED" # Old version preserved and marked SUPERSEDED
    assert calc_v2.status == "APPROVED"
    assert calc_v2.version == 2 # New calculation version incremented
    assert calc_v2.calculated_co2e_kg == 400.0 # Recalculated with updated factor
    assert calc_v2.lineage_id != calc_v1.lineage_id # Fresh lineage record generated
    db.close()
