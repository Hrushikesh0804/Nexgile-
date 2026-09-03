from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class FrameworkResponse(BaseModel):
    id: str
    name: str
    version: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class DisclosureCreate(BaseModel):
    framework_id: str
    reporting_year: int = 2026
    entity_id: Optional[str] = None
    double_materiality_json: Optional[Dict[str, Any]] = None
    transition_plan_json: Optional[Dict[str, Any]] = None

class DisclosureResponse(BaseModel):
    id: str
    framework_id: str
    reporting_year: int
    status: str
    entity_id: Optional[str] = None
    double_materiality_json: Dict[str, Any]
    transition_plan_json: Dict[str, Any]
    locked_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DisclosureDataPointResponse(BaseModel):
    id: str
    disclosure_id: str
    section: str
    requirement_code: str
    xbrl_tag: Optional[str] = None
    source_record_type: str
    source_record_id: str
    lineage_id: Optional[str] = None
    value_json: Dict[str, Any]
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CBAMDeclarationResponse(BaseModel):
    id: str
    disclosure_id: str
    imported_product_id: Optional[str] = None
    quarterly_period: str
    embedded_emissions_tco2e: float
    data_origin: str
    certificates_purchased: int
    adjustment_eur: float
    created_at: datetime

    class Config:
        from_attributes = True

class EUTaxonomyAlignmentResponse(BaseModel):
    id: str
    disclosure_id: str
    economic_activity_code: str
    eligibility_status: bool
    alignment_status: bool
    dnsh_checklist_json: Dict[str, Any]
    capex_aligned_usd: float
    opex_aligned_usd: float
    revenue_aligned_usd: float
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalActionRequest(BaseModel):
    action: str # SUBMITTED, APPROVED, REJECTED, LOCKED
    comments: Optional[str] = None

class ReviewApprovalResponse(BaseModel):
    id: str
    disclosure_id: str
    reviewer_user_id: str
    action: str
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DisclosurePackageExportResponse(BaseModel):
    disclosure_id: str
    framework_name: str
    reporting_year: int
    status: str
    data_points: List[Dict[str, Any]]
    lineage_appendix: List[Dict[str, Any]] # Full audit trail of lineage_id chains
    evidence_attachments: List[Dict[str, Any]]
    exported_at: datetime
