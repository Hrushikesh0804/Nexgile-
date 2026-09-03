from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class EmissionFactor(AuditBase):
    __tablename__ = "emission_factors"
    
    factor_key = Column(String(100), nullable=False, index=True) # e.g. "GRID_ELEC_US"
    name = Column(String(255), nullable=False)
    version_tag = Column(String(50), nullable=False, default="v1.0")
    co2e_factor = Column(Float, nullable=False) # Factor value in kgCO2e per unit
    co2_factor = Column(Float, nullable=True)
    ch4_factor = Column(Float, nullable=True)
    n2o_factor = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False) # e.g., "kWh", "liter", "USD", "kg"
    country = Column(String(100), default="GLOBAL")
    scope = Column(String(20), nullable=False) # "Scope 1", "Scope 2", "Scope 3"
    category = Column(String(100), nullable=False) # e.g., "Stationary Combustion", "Category 1: Purchased Goods"
    source_library = Column(String(100), nullable=False, default="DEFRA 2024") # e.g. DEFRA, eGRID, IPCC, EXIOBASE
    valid_from_year = Column(Integer, nullable=True, default=2024)
    valid_to_year = Column(Integer, nullable=True, default=2026)
    is_active = Column(Boolean, default=True)

class ActivityData(AuditBase):
    __tablename__ = "activity_data"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False, index=True)
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=True, index=True)
    scope = Column(String(20), nullable=False) # "Scope 1", "Scope 2", "Scope 3"
    category = Column(String(100), nullable=False) # e.g. "Stationary Combustion", "Mobile Combustion", "Cat 1: Purchased Goods"
    activity_type = Column(String(100), nullable=False) # e.g. "Natural Gas", "Diesel", "Grid Electricity"
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False) # e.g., "kWh", "liters", "m3", "USD", "kg"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    source_type = Column(String(50), default="MANUAL") # MANUAL, INVOICE, METER, API, CSV
    status = Column(String(50), default="APPROVED") # DRAFT, APPROVED, PENDING_REVIEW

    calculations = relationship("Calculation", back_populates="activity_data", cascade="all, delete-orphan")

class MeterReading(AuditBase):
    __tablename__ = "meter_readings"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    meter_code = Column(String(100), nullable=False)
    reading_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reading_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    invoice_ref = Column(String(100), nullable=True)

class Transaction(AuditBase):
    __tablename__ = "transactions"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    supplier_name = Column(String(255), nullable=False)
    spend_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    spend_category = Column(String(100), nullable=False)
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Calculation(AuditBase):
    __tablename__ = "calculations"
    
    activity_data_id = Column(String(36), ForeignKey("activity_data.id", ondelete="CASCADE"), nullable=False, index=True)
    factor_id = Column(String(36), ForeignKey("emission_factors.id"), nullable=False, index=True)
    
    formula_expression = Column(Text, nullable=False) # e.g., "quantity * unit_conversion * co2e_factor * allocation"
    unit_conversion_ratio = Column(Float, default=1.0)
    allocation_pct = Column(Float, default=100.0)
    input_quantity = Column(Float, nullable=False)
    
    calculated_co2e_kg = Column(Float, nullable=False)
    calculated_co2_kg = Column(Float, nullable=True)
    calculated_ch4_kg = Column(Float, nullable=True)
    calculated_n2o_kg = Column(Float, nullable=True)
    
    lineage_id = Column(String(36), nullable=False, index=True)
    status = Column(String(50), default="APPROVED") # APPROVED, REVISED, SUPERSEDED
    
    activity_data = relationship("ActivityData", back_populates="calculations")
    emission_factor = relationship("EmissionFactor")

class Allocation(AuditBase):
    __tablename__ = "allocations"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=False)
    rule_type = Column(String(50), nullable=False) # FLOOR_AREA, HEADCOUNT, EQUITY_SHARE
    allocation_percentage = Column(Float, nullable=False)

class Emission(AuditBase):
    __tablename__ = "emissions"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    year = Column(Integer, nullable=False)
    scope = Column(String(20), nullable=False)
    category = Column(String(100), nullable=False)
    total_co2e_kg = Column(Float, nullable=False)

class Intensity(AuditBase):
    __tablename__ = "intensities"
    
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=False)
    year = Column(Integer, nullable=False)
    co2e_per_sqm = Column(Float, nullable=True)
    co2e_per_employee = Column(Float, nullable=True)
    co2e_per_revenue_usd = Column(Float, nullable=True)

class Baseline(AuditBase):
    __tablename__ = "baselines"
    
    base_year = Column(Integer, nullable=False)
    scope1_co2e_kg = Column(Float, nullable=False)
    scope2_co2e_kg = Column(Float, nullable=False)
    scope3_co2e_kg = Column(Float, nullable=False)
    total_co2e_kg = Column(Float, nullable=False)

class Target(AuditBase):
    __tablename__ = "targets"
    
    name = Column(String(255), nullable=False)
    target_year = Column(Integer, nullable=False)
    reduction_percentage = Column(Float, nullable=False)
    sbti_status = Column(String(50), default="NEAR_TERM") # NEAR_TERM, NET_ZERO, ALIGNED
    scope_coverage = Column(String(100), default="Scope 1 + 2 + 3")
