from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class Supplier(AuditBase):
    __tablename__ = "suppliers"
    
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False, unique=True)
    contact_email = Column(String(255), nullable=False, index=True)
    country = Column(String(100), default="United States")
    tier = Column(String(20), default="Tier 1") # Tier 1, Tier 2, Tier 3
    category = Column(String(100), nullable=False) # e.g. Raw Materials, Logistics, Electronics, Packaging
    status = Column(String(50), default="ACTIVE") # ACTIVE, ONBOARDING, INACTIVE
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True) # Linked User account for Supplier role login

    user = relationship("User")
    submissions = relationship("Submission", back_populates="supplier", cascade="all, delete-orphan")
    scorecards = relationship("Scorecard", back_populates="supplier", cascade="all, delete-orphan")
    action_plans = relationship("ActionPlan", back_populates="supplier", cascade="all, delete-orphan")

class Questionnaire(AuditBase):
    __tablename__ = "questionnaires"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="PUBLISHED") # DRAFT, PUBLISHED, CLOSED
    languages_list = Column(JSON, default=lambda: ["EN", "DE", "FR", "ES", "ZH", "JA"])
    mongo_ref_id = Column(String(100), nullable=True) # Mongo Template _id string

    submissions = relationship("Submission", back_populates="questionnaire", cascade="all, delete-orphan")

class Submission(AuditBase):
    __tablename__ = "submissions"
    
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    questionnaire_id = Column(String(36), ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="INVITED") # INVITED, IN_PROGRESS, SUBMITTED, VALIDATED, REJECTED
    
    completeness_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    validation_status = Column(String(50), default="UNVERIFIED") # UNVERIFIED, VALIDATED, REJECTED
    
    submitted_at = Column(DateTime, nullable=True)
    mongo_ref_id = Column(String(100), nullable=True) # Mongo Submission Payload _id string

    supplier = relationship("Supplier", back_populates="submissions")
    questionnaire = relationship("Questionnaire", back_populates="submissions")

class Scorecard(AuditBase):
    __tablename__ = "scorecards"
    
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    maturity_level = Column(String(50), default="INTERMEDIATE") # BEGINNER, INTERMEDIATE, ADVANCED, LEADER
    category_ranking = Column(Integer, default=1)
    total_disclosed_co2e_kg = Column(Float, default=0.0)
    yoy_change_pct = Column(Float, default=0.0)
    score_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    supplier = relationship("Supplier", back_populates="scorecards")

class ActionPlan(AuditBase):
    __tablename__ = "action_plans"
    
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_reduction_pct = Column(Float, default=10.0)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, IN_PROGRESS, COMPLETED

    supplier = relationship("Supplier", back_populates="action_plans")
