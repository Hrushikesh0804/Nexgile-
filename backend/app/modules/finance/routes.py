from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.models.finance import CarbonBudget, InternalCarbonPrice, CreditOffset, ProjectEconomics, TCFDFinancialImpact
from app.schemas.finance import (
    CarbonBudgetCreate, CarbonBudgetResponse,
    InternalCarbonPriceCreate, InternalCarbonPriceResponse,
    CreditOffsetCreate, CreditOffsetResponse, CreditOffsetRetireRequest,
    ProjectEconomicsResponse, TCFDFinancialImpactResponse
)
from app.schemas.envelope import APIEnvelope
from app.modules.finance.services import FinanceService

router = APIRouter(prefix="/carbon-finance", tags=["Carbon Finance & Economics"])

# ==========================================
# CARBON BUDGETS API
# ==========================================

@router.post("/budgets", response_model=APIEnvelope[CarbonBudgetResponse])
def create_carbon_budget(
    payload: CarbonBudgetCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    budget = CarbonBudget(
        facility_id=payload.facility_id,
        entity_id=payload.entity_id,
        fiscal_year=payload.fiscal_year,
        allocated_co2e_kg=payload.allocated_co2e_kg,
        consumed_co2e_kg=0.0,
        status="ON_TRACK",
        linked_initiative_id=payload.linked_initiative_id,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return APIEnvelope.success(data=budget)

@router.get("/budgets", response_model=APIEnvelope[List[CarbonBudgetResponse]])
def list_carbon_budgets(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budgets = db.query(CarbonBudget).filter(CarbonBudget.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=budgets)

@router.post("/budgets/{id}/sync", response_model=APIEnvelope[CarbonBudgetResponse])
def sync_budget_consumption(
    id: str,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    budget = FinanceService.sync_budget_consumption(db=db, budget_id=id)
    return APIEnvelope.success(data=budget)

# ==========================================
# INTERNAL CARBON PRICING API
# ==========================================

@router.post("/pricing", response_model=APIEnvelope[InternalCarbonPriceResponse])
def create_internal_carbon_price(
    payload: InternalCarbonPriceCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    price = InternalCarbonPrice(
        scenario_name=payload.scenario_name,
        price_per_tco2e_usd=payload.price_per_tco2e_usd,
        price_type=payload.price_type,
        effective_year=payload.effective_year,
        scope_coverage=payload.scope_coverage,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    return APIEnvelope.success(data=price)

@router.get("/pricing", response_model=APIEnvelope[List[InternalCarbonPriceResponse]])
def list_internal_carbon_prices(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prices = db.query(InternalCarbonPrice).filter(InternalCarbonPrice.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=prices)

# ==========================================
# CREDIT OFFSETS & RETIREMENT API
# ==========================================

@router.post("/offsets", response_model=APIEnvelope[CreditOffsetResponse])
def create_credit_offset(
    payload: CreditOffsetCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    offset = CreditOffset(
        project_name=payload.project_name,
        registry=payload.registry,
        serial_number=payload.serial_number,
        quantity_tco2e=payload.quantity_tco2e,
        cost_per_tco2e_usd=payload.cost_per_tco2e_usd,
        status="ACTIVE",
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(offset)
    db.commit()
    db.refresh(offset)
    return APIEnvelope.success(data=offset)

@router.get("/offsets", response_model=APIEnvelope[List[CreditOffsetResponse]])
def list_credit_offsets(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offsets = db.query(CreditOffset).filter(CreditOffset.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=offsets)

@router.post("/offsets/{id}/retire", response_model=APIEnvelope[CreditOffsetResponse])
def retire_credit_offset(
    id: str,
    payload: CreditOffsetRetireRequest,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    offset = FinanceService.retire_credit_offset(
        db=db,
        offset_id=id,
        evidence_url=payload.retirement_evidence_url,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=offset)

# ==========================================
# PROJECT ECONOMICS & ROI API
# ==========================================

@router.post("/economics", response_model=APIEnvelope[ProjectEconomicsResponse])
def calculate_project_economics(
    initiative_id: str,
    discount_rate_pct: float = 8.0,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    econ = FinanceService.calculate_project_economics(
        db=db,
        initiative_id=initiative_id,
        discount_rate_pct=discount_rate_pct
    )
    return APIEnvelope.success(data=econ)

@router.get("/economics", response_model=APIEnvelope[List[ProjectEconomicsResponse]])
def list_project_economics(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    econs = db.query(ProjectEconomics).filter(ProjectEconomics.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=econs)

# ==========================================
# TCFD FINANCIAL IMPACT API
# ==========================================

@router.get("/tcfd", response_model=APIEnvelope[List[TCFDFinancialImpactResponse]])
def list_tcfd_impacts(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    impacts = db.query(TCFDFinancialImpact).filter(TCFDFinancialImpact.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=impacts)
