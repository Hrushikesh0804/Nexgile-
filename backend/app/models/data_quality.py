from sqlalchemy import Column, String, Float, Text, DateTime, JSON
from app.models.audit import AuditBase

class DataQualityFlag(AuditBase):
    __tablename__ = "data_quality_flags"
    
    target_entity_type = Column(String(100), nullable=False)
    target_entity_id = Column(String(36), nullable=False, index=True)
    
    flag_type = Column(String(50), nullable=False) # ANOMALY, INCOMPLETE, OUTLIER, LOW_CONFIDENCE
    severity = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(20), default="OPEN") # OPEN, UNDER_REVIEW, RESOLVED, IGNORED
    
    completeness_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    message = Column(Text, nullable=False)
    details = Column(JSON, default=dict)
    resolved_by = Column(String(36), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
