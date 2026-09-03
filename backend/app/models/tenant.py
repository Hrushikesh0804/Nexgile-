import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase, generate_uuid
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    country = Column(String(100), nullable=True)
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    entities = relationship("Entity", back_populates="organization", foreign_keys="Entity.org_id", cascade="all, delete-orphan")
    users = relationship("User", back_populates="default_org", foreign_keys="User.default_org_id")

class Entity(AuditBase):
    __tablename__ = "entities"
    
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    parent_entity_id = Column(String(36), ForeignKey("entities.id"), nullable=True)
    country = Column(String(100), nullable=True)
    legal_structure = Column(String(100), nullable=True)
    equity_share_pct = Column(Integer, default=100)
    
    organization = relationship("Organization", back_populates="entities", foreign_keys="Entity.org_id")
    parent_entity = relationship("Entity", remote_side="Entity.id", backref="sub_entities")
    facilities = relationship("Facility", foreign_keys="Facility.entity_id", cascade="all, delete-orphan")
    departments = relationship("Department", foreign_keys="Department.entity_id", cascade="all, delete-orphan")



class Facility(AuditBase):
    __tablename__ = "facilities"
    
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    facility_type = Column(String(100), nullable=True) # Manufacturing, Office, Warehouse, DataCenter, etc.
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    gross_floor_area_sqm = Column(Integer, nullable=True)
    operational_control = Column(Boolean, default=True)
    
    entity = relationship("Entity", back_populates="facilities", foreign_keys="Facility.entity_id")
    departments = relationship("Department", foreign_keys="Department.facility_id")

class Department(AuditBase):
    __tablename__ = "departments"
    
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=False)
    facility_id = Column(String(36), ForeignKey("facilities.id"), nullable=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    
    entity = relationship("Entity", back_populates="departments", foreign_keys="Department.entity_id")
    facility = relationship("Facility", back_populates="departments", foreign_keys="Department.facility_id")
    cost_centers = relationship("CostCenter", back_populates="department", foreign_keys="CostCenter.department_id")


class CostCenter(AuditBase):
    __tablename__ = "cost_centers"
    
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    manager_name = Column(String(255), nullable=True)
    
    department = relationship("Department", back_populates="cost_centers")

class ReportingBoundary(AuditBase):
    __tablename__ = "reporting_boundaries"
    
    name = Column(String(255), nullable=False)
    approach = Column(String(50), nullable=False) # Operational Control, Financial Control, Equity Share
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    included_entity_ids = Column(JSON, default=list) # Array of entity IDs included in boundary
