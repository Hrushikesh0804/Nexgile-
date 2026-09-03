from sqlalchemy import Column, String, Float, Text, JSON, Boolean, Integer
from app.models.audit import AuditBase

class EmissionFactorVersion(AuditBase):
    __tablename__ = "emission_factor_versions"
    
    factor_key = Column(String(100), nullable=False, index=True) # e.g., "GRID_ELECTRICITY_US_EAST"
    name = Column(String(255), nullable=False)
    version_tag = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False) # e.g. "kgCO2e/kWh"
    source_database = Column(String(100), nullable=False) # e.g., "eGRID 2024", "EXIOBASE"
    valid_from_year = Column(Integer, nullable=True)
    valid_to_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

class FormulaVersion(AuditBase):
    __tablename__ = "formula_versions"
    
    formula_key = Column(String(100), nullable=False, index=True) # e.g., "SCOPE2_LOCATION_BASED"
    name = Column(String(255), nullable=False)
    version_tag = Column(String(50), nullable=False)
    expression = Column(Text, nullable=False) # e.g., "kwh * grid_factor"
    parameters = Column(JSON, default=list) # List of required variables
    is_active = Column(Boolean, default=True)

class CalculationVersion(AuditBase):
    __tablename__ = "calculation_versions"
    
    calculation_name = Column(String(255), nullable=False)
    factor_version_id = Column(String(36), nullable=False, index=True)
    formula_version_id = Column(String(36), nullable=False, index=True)
    input_data_version = Column(String(50), nullable=False)
    output_co2e_kg = Column(Float, nullable=False)
    status = Column(String(50), default="APPROVED") # DRAFT, APPROVED, SUPERSEDED
