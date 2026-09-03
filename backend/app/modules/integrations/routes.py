from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.models.integrations import IntegrationConnection, FieldMapping, SyncRun, ReconciliationLog
from app.schemas.integrations import (
    IntegrationConnectionCreate, IntegrationConnectionResponse,
    FieldMappingCreate, FieldMappingResponse,
    SyncRunResponse, ReconciliationLogResponse, ExecuteImportRequest
)
from app.schemas.envelope import APIEnvelope
from app.modules.integrations.services import ImportPipelineService

router = APIRouter(prefix="/integrations", tags=["Data Integration Layer"])

@router.post("/connections", response_model=APIEnvelope[IntegrationConnectionResponse])
def create_connection(
    payload: IntegrationConnectionCreate,
    current_user: CurrentUserContext = Depends(require_permission("admin:manage")),
    db: Session = Depends(get_db)
):
    conn = IntegrationConnection(
        name=payload.name,
        system_type=payload.system_type,
        credentials_vault_ref=payload.credentials_vault_ref or "vault://enc_key_stub",
        status="ACTIVE",
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return APIEnvelope.success(data=conn)

@router.get("/connections", response_model=APIEnvelope[List[IntegrationConnectionResponse]])
def list_connections(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conns = db.query(IntegrationConnection).filter(IntegrationConnection.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=conns)

@router.post("/mappings", response_model=APIEnvelope[FieldMappingResponse])
def create_field_mapping(
    payload: FieldMappingCreate,
    current_user: CurrentUserContext = Depends(require_permission("admin:manage")),
    db: Session = Depends(get_db)
):
    mapping = FieldMapping(
        connection_id=payload.connection_id,
        target_entity=payload.target_entity,
        mapping_json=payload.mapping_json,
        transformation_rules_json=payload.transformation_rules_json or {},
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return APIEnvelope.success(data=mapping)

@router.get("/mappings", response_model=APIEnvelope[List[FieldMappingResponse]])
def list_field_mappings(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mappings = db.query(FieldMapping).filter(FieldMapping.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=mappings)

@router.post("/run", response_model=APIEnvelope[SyncRunResponse])
def execute_import_pipeline(
    payload: ExecuteImportRequest,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    sync_run = ImportPipelineService.execute_import_pipeline(
        db=db,
        connection_id=payload.connection_id,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        raw_content=payload.csv_raw_content,
        file_name=payload.file_name or "utility_meter_data.csv"
    )
    return APIEnvelope.success(data=sync_run)

@router.get("/runs", response_model=APIEnvelope[List[SyncRunResponse]])
def list_sync_runs(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    runs = db.query(SyncRun).filter(SyncRun.org_id == current_user.org_id).order_by(SyncRun.started_at.desc()).all()
    return APIEnvelope.success(data=runs)

@router.get("/reconciliation", response_model=APIEnvelope[List[ReconciliationLogResponse]])
def list_reconciliation_logs(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(ReconciliationLog).filter(ReconciliationLog.org_id == current_user.org_id).order_by(ReconciliationLog.created_at.desc()).all()
    return APIEnvelope.success(data=logs)
