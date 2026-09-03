from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class EmissionFactorCreate(BaseModel):
    factor_key: str
    name: str
    version_tag: str = "v1.0"
    co2e_factor: float
    co2_factor: Optional[float] = None
    ch4_factor: Optional[float] = None
    n2o_factor: Optional[float] = None
    unit: str
    country: str = "GLOBAL"
    scope: str
    category: str
    source_library: str = "DEFRA 2024"
    valid_from_year: Optional[int] = 2024
    valid_to_year: Optional[int] = 2026
    org_id: Optional[str] = None

class EmissionFactorUpdate(BaseModel):
    name: Optional[str] = None
    co2e_factor: Optional[float] = None
    version_tag: Optional[str] = None
    source_library: Optional[str] = None
    is_active: Optional[bool] = None

class EmissionFactorResponse(BaseModel):
    id: str
    factor_key: str
    name: str
    version_tag: str
    co2e_factor: float
    unit: str
    country: str
    scope: str
    category: str
    source_library: str
    valid_from_year: Optional[int] = None
    valid_to_year: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class ActivityDataCreate(BaseModel):
    facility_id: str
    entity_id: Optional[str] = None
    org_id: str
    scope: str # "Scope 1", "Scope 2", "Scope 3"
    category: str # "Stationary Combustion", "Mobile Combustion", "Grid Electricity", etc.
    activity_type: str
    quantity: float
    unit: str
    start_date: datetime
    end_date: datetime
    emission_factor_id: Optional[str] = None
    source_type: Optional[str] = "MANUAL"

class ActivityDataResponse(BaseModel):
    id: str
    org_id: str
    facility_id: str
    scope: str
    category: str
    activity_type: str
    quantity: float
    unit: str
    start_date: datetime
    end_date: datetime
    source_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CalculationResponse(BaseModel):
    id: str
    activity_data_id: str
    factor_id: str
    formula_expression: str
    unit_conversion_ratio: float
    allocation_pct: float
    input_quantity: float
    calculated_co2e_kg: float
    calculated_co2_kg: Optional[float] = None
    lineage_id: str
    status: str
    version: int
    created_at: datetime

    class Config:
        from_attributes = True

class LineageTrailResponse(BaseModel):
    lineage_id: str
    target_entity_type: str
    target_entity_id: str
    source: str
    methodology: str
    formula: str
    factor_version: str
    data_version: str
    calculation_params: Dict[str, Any]
    created_by: Optional[str]
    created_at: datetime
    superseded_by_id: Optional[str]

    class Config:
        from_attributes = True

class CarbonSummaryResponse(BaseModel):
    total_co2e_kg: float
    scope1_co2e_kg: float
    scope2_co2e_kg: float
    scope3_co2e_kg: float
    category_breakdown: Dict[str, float]
