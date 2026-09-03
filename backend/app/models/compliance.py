from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class Framework(AuditBase):
    __tablename__ = "compliance_frameworks"
    
    name = Column(String(100), nullable=False, unique=True) # CSRD_ESRS, CBAM, TCFD, EU_TAXONOMY, SEC_CLIMATE, CDP
    version = Column(String(50), default="2025.1")
    description = Column(Text, nullable=True)

class Disclosure(AuditBase):
    __tablename__ = "compliance_disclosures"
    
    framework_id = Column(String(36), ForeignKey("compliance_frameworks.id"), nullable=False, index=True)
    reporting_year = Column(Integer, nullable=False)
    status = Column(String(50), default="DRAFT") # DRAFT, SUBMITTED_FOR_REVIEW, APPROVED, LOCKED
    entity_id = Column(String(36), ForeignKey("entities.id"), nullable=True)
    
    double_materiality_json = Column(JSON, default=dict)
    transition_plan_json = Column(JSON, default=dict)
    locked_at = Column(DateTime, nullable=True)

    framework = relationship("Framework")
    entity = relationship("Entity")

class DisclosureDataPoint(AuditBase):
    __tablename__ = "compliance_datapoints"
    
    disclosure_id = Column(String(36), ForeignKey("compliance_disclosures.id"), nullable=False, index=True)
    section = Column(String(100), nullable=False) # e.g. ESRS E1-6 Gross Scopes 1, 2, 3
    requirement_code = Column(String(100), nullable=False)
    xbrl_tag = Column(String(255), nullable=True)
    
    source_record_type = Column(String(100), nullable=False) # CALCULATION, PCF, SUPPLIER_SUBMISSION, CARBON_BUDGET
    source_record_id = Column(String(36), nullable=False)
    lineage_id = Column(String(36), ForeignKey("lineage_records.id"), nullable=True)
    
    value_json = Column(JSON, default=dict)
    verification_status = Column(String(50), default="UNVERIFIED") # UNVERIFIED, VERIFIED_INTERNAL, ASSURED_THIRD_PARTY

    disclosure = relationship("Disclosure")
    lineage = relationship("LineageRecord")

class CBAMDeclaration(AuditBase):
    __tablename__ = "cbam_declarations"
    
    disclosure_id = Column(String(36), ForeignKey("compliance_disclosures.id"), nullable=False, index=True)
    imported_product_id = Column(String(36), ForeignKey("products.id"), nullable=True)
    quarterly_period = Column(String(20), nullable=False) # Q1-2026, Q2-2026
    
    embedded_emissions_tco2e = Column(Float, nullable=False)
    data_origin = Column(String(50), default="ACTUAL_PRIMARY") # ACTUAL_PRIMARY, EU_DEFAULT_FALLBACK
    certificates_purchased = Column(Integer, default=0)
    adjustment_eur = Column(Float, default=0.0)

    disclosure = relationship("Disclosure")
    imported_product = relationship("Product")

class EUTaxonomyAlignment(AuditBase):
    __tablename__ = "eu_taxonomy_alignments"
    
    disclosure_id = Column(String(36), ForeignKey("compliance_disclosures.id"), nullable=False, index=True)
    economic_activity_code = Column(String(100), nullable=False) # e.g. CCM 3.1 Manufacture of renewable energy technologies
    eligibility_status = Column(Boolean, default=True)
    alignment_status = Column(Boolean, default=False)
    
    dnsh_checklist_json = Column(JSON, default=dict) # Do No Significant Harm checklist
    capex_aligned_usd = Column(Float, default=0.0)
    opex_aligned_usd = Column(Float, default=0.0)
    revenue_aligned_usd = Column(Float, default=0.0)

    disclosure = relationship("Disclosure")

class AssuranceRequest(AuditBase):
    __tablename__ = "assurance_requests"
    
    disclosure_id = Column(String(36), ForeignKey("compliance_disclosures.id"), nullable=False, index=True)
    auditor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assurance_level = Column(String(50), default="LIMITED") # LIMITED, REASONABLE
    findings_notes = Column(Text, nullable=True)
    status = Column(String(50), default="REQUESTED") # REQUESTED, IN_PROGRESS, ASSURED

    disclosure = relationship("Disclosure")
    auditor = relationship("User")

class ReviewApproval(AuditBase):
    __tablename__ = "review_approvals"
    
    disclosure_id = Column(String(36), ForeignKey("compliance_disclosures.id"), nullable=False, index=True)
    reviewer_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False) # SUBMITTED, APPROVED, REJECTED, LOCKED
    comments = Column(Text, nullable=True)

    disclosure = relationship("Disclosure")
    reviewer = relationship("User")
