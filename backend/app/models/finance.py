from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class CarbonBudget(AuditBase):
    __tablename__ = "carbon_budgets"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=True, index=True)
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=True, index=True)
    fiscal_year = Column(Integer, nullable=False)
    
    allocated_co2e_kg = Column(Float, nullable=False) # Total carbon budget allowance
    consumed_co2e_kg = Column(Float, default=0.0) # Consumed to date
    status = Column(String(50), default="ON_TRACK") # ON_TRACK, AT_RISK, EXCEEDED
    
    linked_initiative_id = Column(String(36), ForeignKey("reduction_initiatives.id"), nullable=True)

    facility = relationship("Facility")
    entity = relationship("Entity")
    linked_initiative = relationship("ReductionInitiative")

class InternalCarbonPrice(AuditBase):
    __tablename__ = "internal_carbon_prices"
    
    scenario_name = Column(String(255), nullable=False)
    price_per_tco2e_usd = Column(Float, nullable=False)
    price_type = Column(String(50), default="SHADOW_PRICE") # SHADOW_PRICE, CARBON_FEE, IMPLICIT
    effective_year = Column(Integer, default=2026)
    scope_coverage = Column(String(100), default="Scope 1, Scope 2, Scope 3")

class CreditOffset(AuditBase):
    __tablename__ = "credit_offsets"
    
    project_name = Column(String(255), nullable=False)
    registry = Column(String(100), default="Verra VCS") # Verra VCS, Gold Standard, American Carbon Registry
    serial_number = Column(String(255), nullable=False, unique=True)
    quantity_tco2e = Column(Float, nullable=False)
    cost_per_tco2e_usd = Column(Float, nullable=False)
    
    status = Column(String(50), default="ACTIVE") # ACTIVE, RETIRED
    retirement_date = Column(DateTime, nullable=True)
    retirement_evidence_url = Column(Text, nullable=True)

class ProjectEconomics(AuditBase):
    __tablename__ = "project_economics"
    
    initiative_id = Column(String(36), ForeignKey("reduction_initiatives.id"), nullable=False, index=True)
    capex_usd = Column(Float, nullable=False)
    opex_annual_usd = Column(Float, default=0.0)
    discount_rate_pct = Column(Float, default=8.0)
    
    npv_usd = Column(Float, nullable=False) # Net Present Value ($)
    irr_pct = Column(Float, nullable=False) # Internal Rate of Return (%)
    payback_period_years = Column(Float, nullable=False) # Simple payback period (years)

    initiative = relationship("ReductionInitiative")

class TCFDFinancialImpact(AuditBase):
    __tablename__ = "tcfd_financial_impacts"
    
    risk_category = Column(String(100), nullable=False) # PHYSICAL_ACUTE, TRANSITION_POLICY, TRANSITION_MARKET
    scenario_climate = Column(String(100), default="1.5C_NET_ZERO") # 1.5C_NET_ZERO, 2C_STATED_POLICIES, 3C_HIGH_EMISSIONS
    estimated_financial_loss_usd = Column(Float, nullable=False)
    mitigation_strategy = Column(Text, nullable=True)
