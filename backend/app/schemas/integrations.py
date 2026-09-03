from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class IntegrationConnectionCreate(BaseModel):
    name: str
    system_type: str = "CSV_FILE"
    credentials_vault_ref: Optional[str] = None

class IntegrationConnectionResponse(BaseModel):
    id: str
    name: str
    system_type: str
    credentials_vault_ref: Optional[str] = None
    status: str
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FieldMappingCreate(BaseModel):
    connection_id: str
    target_entity: str = "ActivityData"
    mapping_json: Dict[str, str] # e.g. {"kwh_used": "quantity", "fuel": "activity_type"}
    transformation_rules_json: Optional[Dict[str, Any]] = None

class FieldMappingResponse(BaseModel):
    id: str
    connection_id: str
    target_entity: str
    mapping_json: Dict[str, str]
    transformation_rules_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class SyncRunResponse(BaseModel):
    id: str
    connection_id: str
    status: str
    records_processed: int
    records_imported: int
    records_rejected: int
    error_queue_json: List[Dict[str, Any]]
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReconciliationLogResponse(BaseModel):
    id: str
    sync_run_id: str
    source_count: int
    imported_count: int
    rejected_count: int
    summary_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExecuteImportRequest(BaseModel):
    connection_id: str
    csv_raw_content: Optional[str] = None
    file_name: Optional[str] = "utility_meter_data.csv"
