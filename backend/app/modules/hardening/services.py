from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.tenant import Organization
from app.models.lineage import LineageRecord
from app.models.data_quality import DataQualityFlag
from app.models.hardening import LineageVerification, AdminAuditLog

from app.core.services.workflow_service import WorkflowService
from app.schemas.hardening import DataQualityConsoleItem, LineageVerificationResponse

class DataQualityConsoleService:
    @staticmethod
    def get_console_flags(db: Session, org_id: str) -> List[DataQualityConsoleItem]:
        flags = db.query(DataQualityFlag).filter(DataQualityFlag.org_id == org_id).all()
        items = []
        for f in flags:
            items.append(DataQualityConsoleItem(
                id=f.id,
                target_entity_type=f.target_entity_type,
                target_entity_id=f.target_entity_id,
                completeness_score=0.75 if f.severity == "MEDIUM" else 0.40,
                confidence_score=0.85 if f.flag_type != "ANOMALY" else 0.50,
                message=f.message,
                status=f.status,
                severity=f.severity,
                created_at=f.created_at
            ))
        return items

    @staticmethod
    def create_remediation_task(
        db: Session,
        flag_id: str,
        assigned_user_id: str,
        org_id: str
    ):
        flag = db.query(DataQualityFlag).filter(DataQualityFlag.id == flag_id).first()
        if flag:
            flag.status = "REMEDIATING"
            db.commit()

        task = WorkflowService.create_task(
            db=db,
            title=f"Data Quality Remediation for Flag #{flag_id[:8]}",
            description=f"Resolve data quality issue on entity {flag.target_entity_type} ({flag.target_entity_id})",
            task_type="QUALITY_REMEDIATION",
            assigned_to_user_id=assigned_user_id,
            org_id=org_id
        )
        return task

class EvidenceAuditService:
    @staticmethod
    def get_lineage_records(
        db: Session,
        org_id: str,
        entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(LineageRecord).filter(LineageRecord.org_id == org_id)
        if entity_type:
            query = query.filter(LineageRecord.target_entity_type == entity_type)
        records = query.order_by(LineageRecord.created_at.desc()).all()

        results = []
        for r in records:
            verif = db.query(LineageVerification).filter(LineageVerification.lineage_id == r.lineage_id).first()
            results.append({
                "id": r.id,
                "lineage_id": r.lineage_id,
                "target_entity_type": r.target_entity_type,
                "target_entity_id": r.target_entity_id,
                "source": r.source,
                "methodology": r.methodology,
                "formula": r.formula,
                "factor_version": r.factor_version,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "verification_status": verif.verification_status if verif else "UNVERIFIED",
                "verified_by": verif.auditor_user_id if verif else None,
                "verification_notes": verif.verification_notes if verif else None
            })
        return results

    @staticmethod
    def verify_lineage_record(
        db: Session,
        lineage_id: str,
        auditor_user_id: str,
        verification_status: str,
        notes: str,
        org_id: str
    ) -> LineageVerification:
        verif = db.query(LineageVerification).filter(LineageVerification.lineage_id == lineage_id).first()
        if not verif:
            verif = LineageVerification(
                lineage_id=lineage_id,
                auditor_user_id=auditor_user_id,
                verification_status=verification_status,
                verification_notes=notes,
                org_id=org_id,
                created_by=auditor_user_id
            )
            db.add(verif)
        else:
            verif.verification_status = verification_status
            verif.verification_notes = notes
            verif.auditor_user_id = auditor_user_id

        # Log admin audit action
        audit_log = AdminAuditLog(
            action="AUDIT_LINEAGE_VERIFIED",
            target_type="LineageRecord",
            target_id=lineage_id,
            details_json={"status": verification_status, "notes": notes},
            org_id=org_id,
            created_by=auditor_user_id
        )
        db.add(audit_log)

        db.commit()
        db.refresh(verif)
        return verif
