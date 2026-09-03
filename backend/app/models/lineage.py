from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from app.models.audit import AuditBase

class LineageRecord(AuditBase):
    __tablename__ = "lineage_records"
    
    lineage_id = Column(String(36), unique=True, nullable=False, index=True)
    target_entity_type = Column(String(100), nullable=False) # e.g. "CalculationResult", "EmissionFactor"
    target_entity_id = Column(String(36), nullable=False, index=True)
    
    source = Column(String(255), nullable=False) # raw activity data / meter / invoice / document
    methodology = Column(String(255), nullable=False) # GHG Protocol, ISO 14064, DEFRA, etc.
    formula = Column(Text, nullable=False) # e.g. "activity_data * emission_factor"
    factor_version = Column(String(50), nullable=False)
    data_version = Column(String(50), nullable=False)
    
    calculation_params = Column(JSON, default=dict) # Input metrics snapshot
    superseded_by_id = Column(String(36), ForeignKey("lineage_records.id"), nullable=True)
    
    # Lineage immutability note: Once created, lineage records are NEVER updated or deleted.
