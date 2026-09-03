from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.models.products import Product, SKU, Material, Process, Packaging, FunctionalUnit, BOM, LCA, PCF, ScenarioPCF
from app.schemas.products import (
    ProductCreate, ProductResponse,
    MaterialCreate, MaterialResponse,
    BOMCreate, BOMResponse,
    LCACreate, LCAResponse,
    PCFResponse, ScenarioPCFCreate, ScenarioPCFResponse,
    PCFReportResponse
)
from app.schemas.envelope import APIEnvelope
from app.modules.products.services import PCFCalculationEngine

router = APIRouter(prefix="/products", tags=["Product LCA & PCF Module"])

# ==========================================
# PRODUCTS & MATERIALS API
# ==========================================

@router.get("", response_model=APIEnvelope[List[ProductResponse]])
def list_products(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, Product, current_user)
    products = query.all()
    return APIEnvelope.success(data=products)

@router.post("", response_model=APIEnvelope[ProductResponse])
def create_product(
    payload: ProductCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    existing = db.query(Product).filter(Product.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists")

    product = Product(
        name=payload.name,
        code=payload.code,
        category=payload.category,
        functional_unit=payload.functional_unit or "1 Unit",
        description=payload.description,
        org_id=payload.org_id or current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return APIEnvelope.success(data=product)

@router.get("/materials", response_model=APIEnvelope[List[MaterialResponse]])
def list_materials(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    materials = db.query(Material).all()
    return APIEnvelope.success(data=materials)

@router.post("/materials", response_model=APIEnvelope[MaterialResponse])
def create_material(
    payload: MaterialCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    mat = Material(
        name=payload.name,
        category=payload.category,
        default_emission_factor_id=payload.default_emission_factor_id,
        recycled_content_pct=payload.recycled_content_pct or 0.0,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return APIEnvelope.success(data=mat)

# ==========================================
# BILL OF MATERIALS (BOM) API
# ==========================================

@router.get("/{id}/boms", response_model=APIEnvelope[List[BOMResponse]])
def list_product_boms(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    boms = db.query(BOM).filter(BOM.product_id == id).all()
    return APIEnvelope.success(data=boms)

@router.post("/boms", response_model=APIEnvelope[BOMResponse])
def add_bom_component(
    payload: BOMCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    bom = BOM(
        product_id=payload.product_id,
        parent_bom_id=payload.parent_bom_id,
        material_id=payload.material_id,
        component_name=payload.component_name,
        quantity=payload.quantity,
        unit=payload.unit,
        loss_rate_pct=payload.loss_rate_pct or 0.0,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(bom)
    db.commit()
    db.refresh(bom)
    return APIEnvelope.success(data=bom)

# ==========================================
# LCA & PCF CALCULATION ENGINE API
# ==========================================

@router.post("/lcas", response_model=APIEnvelope[LCAResponse])
def create_lca_context(
    payload: LCACreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    lca = LCA(
        product_id=payload.product_id,
        name=payload.name,
        boundary_type=payload.boundary_type,
        system_boundary_description=payload.system_boundary_description,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(lca)
    db.commit()
    db.refresh(lca)
    return APIEnvelope.success(data=lca)

@router.post("/{id}/calculate-pcf", response_model=APIEnvelope[PCFResponse])
def calculate_product_carbon_footprint(
    id: str,
    lca_id: Optional[str] = None,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    pcf = PCFCalculationEngine.calculate_pcf(
        db=db,
        product_id=id,
        user_id=current_user.user_id,
        lca_id=lca_id
    )
    return APIEnvelope.success(data=pcf, lineage_id=pcf.lineage_id)

@router.get("/{id}/pcfs", response_model=APIEnvelope[List[PCFResponse]])
def get_product_pcfs(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pcfs = db.query(PCF).filter(PCF.product_id == id).order_by(PCF.created_at.desc()).all()
    return APIEnvelope.success(data=pcfs)

# ==========================================
# SCENARIO SIMULATION API (Guarded by @no_actuals_mutation)
# ==========================================

@router.post("/{id}/scenarios", response_model=APIEnvelope[ScenarioPCFResponse])
def run_product_material_scenario(
    id: str,
    payload: ScenarioPCFCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    scenario = PCFCalculationEngine.run_alternative_material_scenario(
        db=db,
        product_id=id,
        forked_from_pcf_id=payload.forked_from_pcf_id,
        scenario_name=payload.scenario_name,
        alternative_material_id=payload.alternative_material_id,
        user_id=current_user.user_id,
        is_scenario=True,
        target_table="scenario_pcf"
    )
    return APIEnvelope.success(data=scenario)

@router.get("/{id}/scenarios", response_model=APIEnvelope[List[ScenarioPCFResponse]])
def list_product_scenarios(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = db.query(ScenarioPCF).filter(ScenarioPCF.product_id == id).order_by(ScenarioPCF.created_at.desc()).all()
    return APIEnvelope.success(data=scenarios)

# ==========================================
# REPORT EXPORT API
# ==========================================

@router.get("/pcfs/{pcf_id}/report", response_model=APIEnvelope[PCFReportResponse])
def download_pcf_report(
    pcf_id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report_data = PCFCalculationEngine.generate_pcf_report(db=db, pcf_id=pcf_id)
    return APIEnvelope.success(data=report_data)
