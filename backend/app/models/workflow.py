from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from app.models.audit import AuditBase

class Task(AuditBase):
    __tablename__ = "tasks"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(100), nullable=False) # e.g. DATA_COLLECTION, REVIEW, DISCLOSURE_APPROVAL
    status = Column(String(50), default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, OVERDUE, ESCALATED
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    
    assigned_to_user_id = Column(String(36), nullable=False, index=True)
    due_date = Column(DateTime, nullable=True)
    escalated_to_user_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, default=dict)

class Approval(AuditBase):
    __tablename__ = "approvals"
    
    task_id = Column(String(36), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False) # e.g. ActivityData, DisclosureReport
    entity_id = Column(String(36), nullable=False)
    
    approver_user_id = Column(String(36), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)

class Notification(AuditBase):
    __tablename__ = "notifications"
    
    recipient_user_id = Column(String(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO") # INFO, WARNING, ALERT, TASK_ASSIGNED
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
