from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, JSON, Table
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase, generate_uuid
from app.database import Base

# Many-to-Many association for Role and Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superadmin = Column(Boolean, default=False)
    default_org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    default_org = relationship("Organization", back_populates="users")
    org_roles = relationship("UserOrgRole", back_populates="user", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_system_role = Column(Boolean, default=True)
    
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    user_org_roles = relationship("UserOrgRole", back_populates="role")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(100), unique=True, nullable=False, index=True) # e.g. 'org:read', 'facility:write'
    module = Column(String(50), nullable=False) # e.g. 'admin', 'carbon', 'products'
    description = Column(Text, nullable=True)
    
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class UserOrgRole(Base):
    __tablename__ = "user_org_roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    
    # Scoping constraints: JSON arrays of permitted IDs (if empty, applies to all within org)
    entity_ids = Column(JSON, default=list)
    facility_ids = Column(JSON, default=list)
    
    user = relationship("User", back_populates="org_roles")
    organization = relationship("Organization")
    role = relationship("Role", back_populates="user_org_roles")
