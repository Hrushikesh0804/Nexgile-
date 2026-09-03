from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ExecutiveMetricsResponse(BaseModel):
    total_emissions_co2e_kg: float
    total_emissions_co2e_t: float
    scope1_emissions_t: float
    scope2_emissions_t: float
    scope3_emissions_t: float
    emission_intensity_per_sqft: float
    target_annual_co2e_t: float
    trajectory_status: str # ON_TRACK, AT_RISK, BEHIND
    benchmark_comparison_pct: float # e.g. -14.5% vs Industry Benchmark
    category_breakdown: Dict[str, float] # manufacturing, supply_chain, transportation, energy, other

class OperationalDrilldownNode(BaseModel):
    id: str
    name: str
    level: str # COMPANY, ENTITY, FACILITY, DEPARTMENT, COST_CENTER, DATA_POINT
    total_co2e_t: float
    quality_score: float
    confidence_score: float
    status: str
    children_count: int
    has_children: bool
