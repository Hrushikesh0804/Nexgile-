import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.tenant import Organization, Entity, Facility
from app.models.products import Product, SKU, Material, BOM, LCA, PCF, ScenarioPCF
from app.models.carbon import EmissionFactor
from app.models.lineage import LineageRecord
from app.modules.products.services import PCFCalculationEngine
from app.core.services.scenario_service import no_actuals_mutation
from app.seed import seed_db
from fastapi import HTTPException

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_products.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_products_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_db(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_pcf_calculation_with_bom_and_lineage():
    db = SessionLocal()
    product = db.query(Product).filter(Product.code == "PROD_SENSOR_X").first()
    assert product is not None

    boms = db.query(BOM).filter(BOM.product_id == product.id).all()
    assert len(boms) >= 2

    pcf = PCFCalculationEngine.calculate_pcf(
        db=db,
        product_id=product.id,
        user_id="user-test-123"
    )

    assert pcf.id is not None
    assert pcf.total_co2e_kg > 0.0
    assert pcf.material_co2e_kg > 0.0
    assert pcf.status == "APPROVED"
    assert pcf.lineage_id is not None

    # Verify Lineage Record in DB
    lineage = db.query(LineageRecord).filter(LineageRecord.lineage_id == pcf.lineage_id).first()
    assert lineage is not None
    assert "ISO 14067" in lineage.methodology
    db.close()

def test_alternative_material_scenario_does_not_mutate_actuals():
    db = SessionLocal()
    product = db.query(Product).filter(Product.code == "PROD_SENSOR_X").first()
    
    # Base Actual PCF
    actual_pcf = PCFCalculationEngine.calculate_pcf(
        db=db,
        product_id=product.id,
        user_id="user-test-123"
    )
    original_actual_co2e = actual_pcf.total_co2e_kg
    original_actual_version = actual_pcf.version
    original_actual_status = actual_pcf.status

    # Get Recycled Material
    recycled_mat = db.query(Material).filter(Material.name == "100% Recycled Eco-Aluminum").first()

    # Run Scenario Simulation
    scenario = PCFCalculationEngine.run_alternative_material_scenario(
        db=db,
        product_id=product.id,
        forked_from_pcf_id=actual_pcf.id,
        scenario_name="100% Eco-Aluminum Replacement",
        alternative_material_id=recycled_mat.id if recycled_mat else None,
        user_id="user-test-123",
        is_scenario=True,
        target_table="scenario_pcf"
    )

    assert scenario.id is not None
    assert scenario.total_co2e_kg < original_actual_co2e
    assert scenario.reduction_pct > 0.0
    assert scenario.assumptions_json["isolated_scenario_table"] == "scenario_pcf"

    # CRITICAL CHECK: Verify actual PCF row is STRICTLY UNCHANGED
    db.refresh(actual_pcf)
    assert actual_pcf.total_co2e_kg == original_actual_co2e
    assert actual_pcf.version == original_actual_version
    assert actual_pcf.status == original_actual_status
    db.close()

def test_no_actuals_mutation_decorator_blocks_invalid_scenario_write():
    @no_actuals_mutation
    def invalid_scenario_path(is_scenario=False, target_table="pcfs"):
        return "MUTATED_ACTUALS"

    with pytest.raises(HTTPException) as exc_info:
        invalid_scenario_path(is_scenario=False, target_table="pcfs")
    assert exc_info.value.status_code == 403

def test_pcf_report_generation():
    db = SessionLocal()
    product = db.query(Product).filter(Product.code == "PROD_SENSOR_X").first()
    pcf = db.query(PCF).filter(PCF.product_id == product.id).first()
    
    report = PCFCalculationEngine.generate_pcf_report(db=db, pcf_id=pcf.id)
    assert report["product_code"] == "PROD_SENSOR_X"
    assert report["total_pcf_co2e_kg"] == pcf.total_co2e_kg
    assert "raw_materials" in report["breakdown_by_stage"]
    assert len(report["lineage_links"]) > 0
    db.close()
