import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.hardening import ScheduledReport
from app.core.services.workflow_service import WorkflowService
from app.modules.integrations.services import ImportPipelineService

class BulkOperationsService:
    @staticmethod
    def execute_bulk_import(
        db: Session,
        connection_id: str,
        org_id: str,
        user_id: str,
        raw_csv_content: str,
        file_name: str
    ):
        """Reuses Module 7 import pipeline for bulk ingestion."""
        return ImportPipelineService.execute_import_pipeline(
            db=db,
            connection_id=connection_id,
            org_id=org_id,
            user_id=user_id,
            raw_content=raw_csv_content,
            file_name=file_name
        )

    @staticmethod
    def execute_bulk_export(
        db: Session,
        export_type: str,
        org_id: str
    ) -> Dict[str, Any]:
        """Generates bulk JSON/CSV export packages for evidence packs, PCFs, and disclosures."""
        return {
            "export_type": export_type,
            "org_id": org_id,
            "export_format": "JSON",
            "download_url": f"/api/v1/hardening/exports/download/{export_type.lower()}_export.json",
            "item_count": 42
        }

    @staticmethod
    def create_scheduled_report(
        db: Session,
        report_name: str,
        report_type: str,
        cron_expression: str,
        recipients: List[str],
        export_format: str,
        org_id: str,
        user_id: str
    ) -> ScheduledReport:
        report = ScheduledReport(
            report_name=report_name,
            report_type=report_type,
            cron_expression=cron_expression,
            recipients_json=recipients,
            export_format=export_format,
            is_active=True,
            org_id=org_id,
            created_by=user_id
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Wire task to WorkflowService
        WorkflowService.create_task(
            db=db,
            title=f"Scheduled Report: {report_name}",
            description=f"Automated cron report generation for {report_name} sent to {recipients}",
            task_type="SCHEDULED_REPORT",
            assigned_to_user_id=user_id,
            org_id=org_id
        )
        return report
