from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    code: str
    category: str = "Consumer Electronics"
    functional_unit: Optional[str] = "1 Unit"
    description: Optional[str] = None
    org_id: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    code: str
    category: str
    functional_unit: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialCreate(BaseModel):
    name: str
    category: str = "Metals"
    default_emission_factor_id: Optional[str] = None
    recycled_content_pct: Optional[float] = 0.0

class MaterialResponse(BaseModel):
    id: str
    name: str
    category: str
    default_emission_factor_id: Optional[str] = None
    recycled_content_pct: float

    class Config:
        from_attributes = True

class BOMCreate(BaseModel):
    product_id: str
    parent_bom_id: Optional[str] = None
    material_id: Optional[str] = None
    component_name: str
    quantity: float
    unit: str = "kg"
    loss_rate_pct: Optional[float] = 0.0

class BOMResponse(BaseModel):
    id: str
    product_id: str
    parent_bom_id: Optional[str] = None
    material_id: Optional[str] = None
    component_name: str
    quantity: float
    unit: str
    loss_rate_pct: float

    class Config:
        from_attributes = True

class LCACreate(BaseModel):
    product_id: str
    name: str
    boundary_type: str = "cradle-to-gate" # cradle-to-gate, gate-to-gate, cradle-to-grave
    system_boundary_description: Optional[str] = None

class LCAResponse(BaseModel):
    id: str
    product_id: str
    name: str
    boundary_type: str
    system_boundary_description: Optional[str] = None

    class Config:
        from_attributes = True

class PCFResponse(BaseModel):
    id: str
    product_id: str
    sku_id: Optional[str] = None
    lca_id: Optional[str] = None
    total_co2e_kg: float
    material_co2e_kg: float
    manufacturing_co2e_kg: float
    packaging_co2e_kg: float
    transport_co2e_kg: float
    energy_co2e_kg: float
    eol_co2e_kg: float
    lineage_id: str
    status: str
    version: int
    created_at: datetime

    class Config:
        from_attributes = True

class ScenarioPCFCreate(BaseModel):
    product_id: str
    forked_from_pcf_id: str
    scenario_name: str
    alternative_material_id: Optional[str] = None
    assumptions_json: Optional[Dict[str, Any]] = None

class ScenarioPCFResponse(BaseModel):
    id: str
    product_id: str
    forked_from_pcf_id: str
    scenario_name: str
    alternative_material_id: Optional[str] = None
    total_co2e_kg: float
    reduction_co2e_kg: float
    reduction_pct: float
    assumptions_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class PCFReportResponse(BaseModel):
    product_name: str
    product_code: str
    functional_unit: str
    lca_boundary: str
    total_pcf_co2e_kg: float
    breakdown_by_stage: Dict[str, float]
    lineage_links: List[Dict[str, Any]]
    assumptions: List[str]
    report_generated_at: str
