from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class CarbonBudgetCreate(BaseModel):
    facility_id: Optional[str] = None
    entity_id: Optional[str] = None
    fiscal_year: int = 2026
    allocated_co2e_kg: float
    linked_initiative_id: Optional[str] = None

class CarbonBudgetResponse(BaseModel):
    id: str
    facility_id: Optional[str] = None
    entity_id: Optional[str] = None
    fiscal_year: int
    allocated_co2e_kg: float
    consumed_co2e_kg: float
    status: str
    linked_initiative_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InternalCarbonPriceCreate(BaseModel):
    scenario_name: str
    price_per_tco2e_usd: float
    price_type: str = "SHADOW_PRICE"
    effective_year: int = 2026
    scope_coverage: str = "Scope 1, Scope 2, Scope 3"

class InternalCarbonPriceResponse(BaseModel):
    id: str
    scenario_name: str
    price_per_tco2e_usd: float
    price_type: str
    effective_year: int
    scope_coverage: str
    created_at: datetime

    class Config:
        from_attributes = True

class CreditOffsetCreate(BaseModel):
    project_name: str
    registry: str = "Verra VCS"
    serial_number: str
    quantity_tco2e: float
    cost_per_tco2e_usd: float

class CreditOffsetResponse(BaseModel):
    id: str
    project_name: str
    registry: str
    serial_number: str
    quantity_tco2e: float
    cost_per_tco2e_usd: float
    status: str
    retirement_date: Optional[datetime] = None
    retirement_evidence_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CreditOffsetRetireRequest(BaseModel):
    retirement_evidence_url: str

class ProjectEconomicsResponse(BaseModel):
    id: str
    initiative_id: str
    capex_usd: float
    opex_annual_usd: float
    discount_rate_pct: float
    npv_usd: float
    irr_pct: float
    payback_period_years: float
    created_at: datetime

    class Config:
        from_attributes = True

class TCFDFinancialImpactResponse(BaseModel):
    id: str
    risk_category: str
    scenario_climate: str
    estimated_financial_loss_usd: float
    mitigation_strategy: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
