from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.schemas.envelope import APIEnvelope
from app.schemas.hardening import (
    GlobalSearchRequest, GlobalSearchResponse,
    SavedSearchQueryCreate, SavedSearchQueryResponse,
    ScheduledReportCreate, ScheduledReportResponse,
    LineageVerificationCreate, LineageVerificationResponse,
    DataQualityConsoleItem, AdminAuditLogResponse
)
from app.modules.hardening.search.postgres_search import PostgresTSVectorSearchProvider
from app.modules.hardening.search.elastic_search import ElasticsearchSearchProvider
from app.modules.hardening.services import DataQualityConsoleService, EvidenceAuditService
from app.modules.hardening.bulk_services import BulkOperationsService
from app.models.hardening import SavedSearchQuery, AdminAuditLog

router = APIRouter(prefix="/hardening", tags=["Platform Hardening"])

# Search provider instance (Swappable for ElasticsearchSearchProvider)
search_provider = PostgresTSVectorSearchProvider()

@router.post("/search", response_model=APIEnvelope[GlobalSearchResponse])
def search_global(
    payload: GlobalSearchRequest,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = search_provider.search_global(
        db=db,
        query=payload.query,
        org_id=current_user.org_id,
        entity_types=payload.entity_types,
        limit=payload.limit
    )
    return APIEnvelope.success(data=results)

@router.post("/search/saved", response_model=APIEnvelope[SavedSearchQueryResponse])
def save_search_query(
    payload: SavedSearchQueryCreate,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sq = SavedSearchQuery(
        title=payload.title,
        query_text=payload.query_text,
        filters_json=payload.filters_json or {},
        is_shared=payload.is_shared,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(sq)
    db.commit()
    db.refresh(sq)
    return APIEnvelope.success(data=sq)

@router.get("/search/saved", response_model=APIEnvelope[List[SavedSearchQueryResponse]])
def list_saved_searches(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sqs = db.query(SavedSearchQuery).filter(SavedSearchQuery.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=sqs)

@router.get("/quality/console", response_model=APIEnvelope[List[DataQualityConsoleItem]])
def list_quality_console(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = DataQualityConsoleService.get_console_flags(db, current_user.org_id)
    return APIEnvelope.success(data=items)

@router.post("/quality/remediate")
def create_remediation_task(
    flag_id: str,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    task = DataQualityConsoleService.create_remediation_task(
        db=db,
        flag_id=flag_id,
        assigned_user_id=current_user.user_id,
        org_id=current_user.org_id
    )
    return APIEnvelope.success(data={"task_id": task.id, "message": "Remediation task created via WorkflowService"})

@router.get("/evidence/lineage")
def list_lineage_browser(
    entity_type: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = EvidenceAuditService.get_lineage_records(db, current_user.org_id, entity_type)
    return APIEnvelope.success(data=records)

@router.post("/evidence/verify", response_model=APIEnvelope[LineageVerificationResponse])
def verify_lineage_record(
    payload: LineageVerificationCreate,
    current_user: CurrentUserContext = Depends(require_permission("admin:manage")), # Auditor / Admin role
    db: Session = Depends(get_db)
):
    verif = EvidenceAuditService.verify_lineage_record(
        db=db,
        lineage_id=payload.lineage_id,
        auditor_user_id=current_user.user_id,
        verification_status=payload.verification_status,
        notes=payload.verification_notes or "Audited and verified line item calculation.",
        org_id=current_user.org_id
    )
    return APIEnvelope.success(data=verif)

@router.post("/bulk/import")
def execute_bulk_import(
    connection_id: str,
    raw_csv_content: str,
    file_name: Optional[str] = "bulk_import.csv",
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    run = BulkOperationsService.execute_bulk_import(
        db=db,
        connection_id=connection_id,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        raw_csv_content=raw_csv_content,
        file_name=file_name
    )
    return APIEnvelope.success(data=run)

@router.post("/bulk/export")
def execute_bulk_export(
    export_type: str = "EVIDENCE_PACK",
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pkg = BulkOperationsService.execute_bulk_export(db, export_type, current_user.org_id)
    return APIEnvelope.success(data=pkg)

@router.post("/bulk/schedule", response_model=APIEnvelope[ScheduledReportResponse])
def schedule_report(
    payload: ScheduledReportCreate,
    current_user: CurrentUserContext = Depends(require_permission("admin:manage")),
    db: Session = Depends(get_db)
):
    rep = BulkOperationsService.create_scheduled_report(
        db=db,
        report_name=payload.report_name,
        report_type=payload.report_type,
        cron_expression=payload.cron_expression,
        recipients=payload.recipients_json,
        export_format=payload.export_format,
        org_id=current_user.org_id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=rep)

@router.get("/admin/audit-logs", response_model=APIEnvelope[List[AdminAuditLogResponse]])
def list_admin_audit_logs(
    current_user: CurrentUserContext = Depends(require_permission("admin:manage")),
    db: Session = Depends(get_db)
):
    logs = db.query(AdminAuditLog).filter(AdminAuditLog.org_id == current_user.org_id).order_by(AdminAuditLog.created_at.desc()).all()
    return APIEnvelope.success(data=logs)
