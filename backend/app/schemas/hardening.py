from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class GlobalSearchRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None # Organization, Entity, Facility, Supplier, Product, ActivityData, EmissionFactor, Calculation, Disclosure, ReductionInitiative
    limit: int = 20

class GlobalSearchResultItem(BaseModel):
    id: str
    entity_type: str
    title: str
    subtitle: str
    snippet: str
    metadata: Dict[str, Any]

class GlobalSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[GlobalSearchResultItem]
    provider: str = "PostgresTSVector"

class SavedSearchQueryCreate(BaseModel):
    title: str
    query_text: str
    filters_json: Optional[Dict[str, Any]] = None
    is_shared: bool = False

class SavedSearchQueryResponse(BaseModel):
    id: str
    title: str
    query_text: str
    filters_json: Dict[str, Any]
    is_shared: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ScheduledReportCreate(BaseModel):
    report_name: str
    report_type: str = "CSRD_PACKAGE"
    cron_expression: str = "0 0 1 * *"
    recipients_json: List[str]
    export_format: str = "PDF"

class ScheduledReportResponse(BaseModel):
    id: str
    report_name: str
    report_type: str
    cron_expression: str
    recipients_json: List[str]
    export_format: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LineageVerificationCreate(BaseModel):
    lineage_id: str
    verification_status: str = "VERIFIED" # VERIFIED, FLAGGED, REJECTED
    verification_notes: Optional[str] = "Audited & Verified line item calculations."

class LineageVerificationResponse(BaseModel):
    id: str
    lineage_id: str
    auditor_user_id: str
    verification_status: str
    verification_notes: Optional[str] = None
    verified_at: datetime

    class Config:
        from_attributes = True

class DataQualityConsoleItem(BaseModel):
    id: str
    target_entity_type: str
    target_entity_id: str
    completeness_score: float
    confidence_score: float
    message: str
    status: str
    severity: str = "MEDIUM"
    remediation_task_id: Optional[str] = None
    created_at: datetime

class AdminAuditLogResponse(BaseModel):
    id: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details_json: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
