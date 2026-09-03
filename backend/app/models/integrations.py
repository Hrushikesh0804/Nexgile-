from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class IntegrationConnection(AuditBase):
    __tablename__ = "integration_connections"
    
    name = Column(String(255), nullable=False)
    system_type = Column(String(100), nullable=False) # CSV_FILE, REST_API, WEBHOOK, SAP_ERP, ORACLE_FUSION
    credentials_vault_ref = Column(String(255), nullable=True) # Encrypted vault reference key (never plaintext)
    
    status = Column(String(50), default="ACTIVE") # ACTIVE, INACTIVE, ERROR
    last_sync_at = Column(DateTime, nullable=True)

class FieldMapping(AuditBase):
    __tablename__ = "field_mappings"
    
    connection_id = Column(String(36), ForeignKey("integration_connections.id"), nullable=False, index=True)
    target_entity = Column(String(100), default="ActivityData") # ActivityData, EmissionFactor, Supplier
    
    mapping_json = Column(JSON, nullable=False) # e.g. {"kwh_used": "quantity", "fuel": "activity_type", "unit": "unit"}
    transformation_rules_json = Column(JSON, default=dict)

    connection = relationship("IntegrationConnection")

class SyncSchedule(AuditBase):
    __tablename__ = "sync_schedules"
    
    connection_id = Column(String(36), ForeignKey("integration_connections.id"), nullable=False, index=True)
    cron_expression = Column(String(100), default="0 0 * * *") # Daily midnight
    is_active = Column(Boolean, default=True)

    connection = relationship("IntegrationConnection")

class SyncRun(AuditBase):
    __tablename__ = "sync_runs"
    
    connection_id = Column(String(36), ForeignKey("integration_connections.id"), nullable=False, index=True)
    status = Column(String(50), default="RUNNING") # RUNNING, SUCCESS, FAILED, PARTIAL
    
    records_processed = Column(Integer, default=0)
    records_imported = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    error_queue_json = Column(JSON, default=list)
    
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    connection = relationship("IntegrationConnection")

class ReconciliationLog(AuditBase):
    __tablename__ = "reconciliation_logs"
    
    sync_run_id = Column(String(36), ForeignKey("sync_runs.id"), nullable=False, index=True)
    source_count = Column(Integer, nullable=False)
    imported_count = Column(Integer, nullable=False)
    rejected_count = Column(Integer, nullable=False)
    summary_notes = Column(Text, nullable=True)

    sync_run = relationship("SyncRun")
