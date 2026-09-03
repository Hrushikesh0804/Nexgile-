from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ScenarioForecastRequest(BaseModel):
    facility_id: Optional[str] = None
    target_year: int = 2030
    model_type: Optional[str] = "HOLT_WINTERS_TIME_SERIES"

class ScenarioForecastResponse(BaseModel):
    id: str
    facility_id: Optional[str] = None
    target_year: int
    forecasted_co2e_kg: float
    energy_kwh_forecast: float
    target_achievement_prob: float
    forked_from_version: str
    model_type: str
    uncertainty_lower_co2e: float
    uncertainty_upper_co2e: float
    created_at: datetime

    class Config:
        from_attributes = True

class ReductionInitiativeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Energy Efficiency"
    expected_reduction_co2e_kg: float
    capex_cost_usd: float = 0.0
    opex_cost_usd: float = 0.0
    timeline_year: int = 2026
    owner_user_id: Optional[str] = None
    target_link_id: Optional[str] = None

class ReductionInitiativeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    expected_reduction_co2e_kg: float
    capex_cost_usd: float
    opex_cost_usd: float
    abatement_cost_per_tco2e: float
    timeline_year: int
    owner_user_id: Optional[str] = None
    roi_pct: float
    status: str
    actual_progress_pct: float
    created_at: datetime

    class Config:
        from_attributes = True

class MonteCarloRunResponse(BaseModel):
    id: str
    scenario_name: str
    num_iterations: int
    mean_co2e_kg: float
    p5_co2e_kg: float
    p95_co2e_kg: float
    sensitivity_rankings_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentIngestionResponse(BaseModel):
    id: str
    file_name: str
    status: str
    extracted_fields_json: Dict[str, Any]
    created_activity_data_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WhatIfScenarioRequest(BaseModel):
    scenario_name: str
    renewable_electricity_pct: Optional[float] = 0.0
    supplier_switch_pct: Optional[float] = 0.0
    material_swap_recycled_pct: Optional[float] = 0.0

class WhatIfScenarioResponse(BaseModel):
    scenario_name: str
    baseline_co2e_kg: float
    projected_scenario_co2e_kg: float
    reduction_co2e_kg: float
    reduction_pct: float
    assumptions_json: Dict[str, Any]
    isolated_scenario_table: str

class MACCResponse(BaseModel):
    initiatives: List[Dict[str, Any]]
    total_potential_reduction_tco2e: float
    average_abatement_cost_per_tco2e: float
