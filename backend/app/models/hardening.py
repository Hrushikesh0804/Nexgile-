from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class SavedSearchQuery(AuditBase):
    __tablename__ = "saved_search_queries"
    
    title = Column(String(255), nullable=False)
    query_text = Column(String(255), nullable=False)
    filters_json = Column(JSON, default=dict) # e.g. {"entity_type": "Facility", "status": "APPROVED"}
    is_shared = Column(Boolean, default=False)

class ScheduledReport(AuditBase):
    __tablename__ = "scheduled_reports"
    
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False) # CSRD_PACKAGE, EMISSIONS_SUMMARY, PCF_CATALOG
    cron_expression = Column(String(100), default="0 0 1 * *") # Monthly 1st day
    recipients_json = Column(JSON, default=list) # List of email strings
    export_format = Column(String(20), default="PDF") # PDF, CSV, JSON
    is_active = Column(Boolean, default=True)

class LineageVerification(AuditBase):
    __tablename__ = "lineage_verifications"
    
    lineage_id = Column(String(36), nullable=False, index=True)
    auditor_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    verification_status = Column(String(50), default="VERIFIED") # VERIFIED, FLAGGED, REJECTED
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    auditor = relationship("User")

class AdminAuditLog(AuditBase):
    __tablename__ = "admin_audit_logs"
    
    action = Column(String(100), nullable=False) # USER_CREATED, ROLE_MODIFIED, ORG_SETTING_UPDATED
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(36), nullable=True)
    details_json = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
