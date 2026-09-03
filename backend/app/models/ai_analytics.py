from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class ScenarioForecast(AuditBase):
    __tablename__ = "scenario_forecasts" # Strict scenario_ prefix convention
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=True, index=True)
    target_year = Column(Integer, nullable=False)
    forecasted_co2e_kg = Column(Float, nullable=False)
    energy_kwh_forecast = Column(Float, default=0.0)
    target_achievement_prob = Column(Float, default=85.0) # Probability % of hitting target
    
    forked_from_version = Column(String(50), default="v1.0")
    model_type = Column(String(100), default="HOLT_WINTERS_TIME_SERIES")
    uncertainty_lower_co2e = Column(Float, nullable=False)
    uncertainty_upper_co2e = Column(Float, nullable=False)

    facility = relationship("Facility")

class ReductionInitiative(AuditBase):
    __tablename__ = "reduction_initiatives"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False) # Energy Efficiency, Renewable Energy, Supplier Substitution, Material Circularity
    
    expected_reduction_co2e_kg = Column(Float, nullable=False) # Total emissions avoided (kgCO2e)
    capex_cost_usd = Column(Float, default=0.0) # Upfront Capital Expenditure ($)
    opex_cost_usd = Column(Float, default=0.0) # Annual Operating Cost ($)
    abatement_cost_per_tco2e = Column(Float, nullable=False) # Marginal Abatement Cost ($ / tCO2e avoided)
    
    timeline_year = Column(Integer, default=2026)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    roi_pct = Column(Float, default=0.0)
    status = Column(String(50), default="PLANNED") # PLANNED, IN_PROGRESS, COMPLETED
    target_link_id = Column(String(36), nullable=True)
    actual_progress_pct = Column(Float, default=0.0)

    owner = relationship("User")

class MonteCarloRun(AuditBase):
    __tablename__ = "scenario_monte_carlo" # Strict scenario_ prefix convention
    
    scenario_name = Column(String(255), nullable=False)
    num_iterations = Column(Integer, default=1000)
    mean_co2e_kg = Column(Float, nullable=False)
    p5_co2e_kg = Column(Float, nullable=False)
    p95_co2e_kg = Column(Float, nullable=False)
    sensitivity_rankings_json = Column(JSON, default=dict)

class DocumentIngestion(AuditBase):
    __tablename__ = "document_ingestions"
    
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), default="application/pdf")
    status = Column(String(50), default="EXTRACTED_DRAFT") # EXTRACTED_DRAFT, APPROVED, REJECTED
    extracted_fields_json = Column(JSON, default=dict)
    created_activity_data_id = Column(String(36), ForeignKey("activity_data.id"), nullable=True)
    mongo_ref_id = Column(String(100), nullable=True) # Mongo OCR extraction _id string

    created_activity_data = relationship("ActivityData")
