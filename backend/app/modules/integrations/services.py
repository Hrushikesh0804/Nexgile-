from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.integrations import IntegrationConnection, FieldMapping, SyncRun, ReconciliationLog
from app.models.carbon import ActivityData
from app.models.tenant import Facility
from app.core.services.lineage_service import LineageService
from app.core.services.data_quality_service import DataQualityService
from app.modules.integrations.connectors.csv_connector import CSVConnector
from app.modules.integrations.connectors.rest_connector import RESTConnector
from app.modules.integrations.connectors.webhook_connector import WebhookConnector

class ImportPipelineService:
    @staticmethod
    def execute_import_pipeline(
        db: Session,
        connection_id: str,
        org_id: str,
        user_id: str,
        raw_content: Optional[str] = None,
        file_name: Optional[str] = "utility_meter_data.csv"
    ) -> SyncRun:
        """
        Executes end-to-end import pipeline:
        Validate -> Stage -> Quality Score -> Commit to ActivityData -> Lineage Citation -> Reconciliation Report.
        """
        conn = db.query(IntegrationConnection).filter(IntegrationConnection.id == connection_id).first()
        if not conn:
            raise ValueError("Integration connection not found.")

        mapping_obj = db.query(FieldMapping).filter(FieldMapping.connection_id == connection_id).first()
        field_map = mapping_obj.mapping_json if mapping_obj else {
            "kwh_used": "quantity",
            "fuel_type": "activity_type",
            "scope_type": "scope",
            "unit_type": "unit"
        }

        # 1. Select Connector
        if conn.system_type == "CSV_FILE":
            connector = CSVConnector()
        elif conn.system_type == "REST_API":
            connector = RESTConnector()
        else:
            connector = WebhookConnector()

        # 2. Fetch raw source records
        raw_records = connector.fetch_records(raw_content)
        source_count = len(raw_records)

        # Create SyncRun record
        sync_run = SyncRun(
            connection_id=connection_id,
            status="RUNNING",
            records_processed=source_count,
            started_at=datetime.now(timezone.utc),
            org_id=org_id,
            created_by=user_id
        )
        db.add(sync_run)
        db.commit()
        db.refresh(sync_run)

        imported_count = 0
        rejected_count = 0
        error_queue = []

        # Find default facility
        facility = db.query(Facility).filter(Facility.org_id == org_id).first()
        facility_id = facility.id if facility else "fac-default"

        for idx, row in enumerate(raw_records):
            try:
                # 3. Apply Field Mapping
                mapped_data = {}
                for src_key, tgt_key in field_map.items():
                    if src_key in row:
                        val = row[src_key]
                        if tgt_key == "quantity":
                            val = float(val)
                        mapped_data[tgt_key] = val

                # Standard defaults
                scope = mapped_data.get("scope", "Scope 1")
                category = mapped_data.get("category", "Stationary Combustion")
                activity_type = mapped_data.get("activity_type", "Natural Gas")
                quantity = mapped_data.get("quantity", 1000.0)
                unit = mapped_data.get("unit", "kWh")

                # Quality Validation
                comp_score = DataQualityService.score_completeness(mapped_data, ["quantity", "activity_type", "unit"])
                if comp_score < 0.6:
                    raise ValueError(f"Incomplete record data (completeness score {comp_score})")

                # 4. Commit to Target Table (ActivityData)
                activity = ActivityData(
                    org_id=org_id,
                    facility_id=facility_id,
                    scope=scope,
                    category=category,
                    activity_type=activity_type,
                    quantity=quantity,
                    unit=unit,
                    start_date=datetime.now(timezone.utc),
                    end_date=datetime.now(timezone.utc),
                    source_type=f"CONNECTOR_{conn.system_type}",
                    status="APPROVED",
                    created_by=user_id
                )
                db.add(activity)
                db.commit()
                db.refresh(activity)

                # 5. Create LineageRecord citing file/connector as origin
                LineageService.create_lineage_record(
                    db=db,
                    source=f"{conn.name} ({file_name})",
                    methodology="Automated Data Integration Pipeline",
                    formula="Direct Mapped Key Ingestion",
                    factor_version="v1.0",
                    data_version="v1.0",
                    user_id=user_id,
                    target_entity_type="ActivityData",
                    target_entity_id=activity.id,
                    org_id=org_id
                )

                imported_count += 1

            except Exception as e:
                rejected_count += 1
                error_queue.append({
                    "record_index": idx,
                    "raw_row": row,
                    "error_message": str(e)
                })

        # 6. Update SyncRun & Reconciliation Log
        sync_run.records_imported = imported_count
        sync_run.records_rejected = rejected_count
        sync_run.error_queue_json = error_queue
        sync_run.status = "SUCCESS" if rejected_count == 0 else ("PARTIAL" if imported_count > 0 else "FAILED")
        sync_run.completed_at = datetime.now(timezone.utc)
        conn.last_sync_at = datetime.now(timezone.utc)

        reconcil = ReconciliationLog(
            sync_run_id=sync_run.id,
            source_count=source_count,
            imported_count=imported_count,
            rejected_count=rejected_count,
            summary_notes=f"Processed {source_count} records via {conn.name}. Imported: {imported_count}, Rejected: {rejected_count}.",
            org_id=org_id,
            created_by=user_id
        )
        db.add(reconcil)
        db.commit()
        db.refresh(sync_run)
        return sync_run
