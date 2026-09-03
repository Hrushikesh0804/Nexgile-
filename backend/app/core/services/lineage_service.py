import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.lineage import LineageRecord

class LineageService:
    @staticmethod
    def create_lineage_record(
        db: Session,
        source: str,
        methodology: str,
        formula: str,
        factor_version: str,
        data_version: str,
        user_id: str,
        target_entity_type: str,
        target_entity_id: str,
        org_id: Optional[str] = None,
        calculation_params: Optional[Dict[str, Any]] = None,
        superseded_by_id: Optional[str] = None
    ) -> str:
        lineage_id = str(uuid.uuid4())
        record = LineageRecord(
            lineage_id=lineage_id,
            target_entity_type=target_entity_type,
            target_entity_id=target_entity_id,
            source=source,
            methodology=methodology,
            formula=formula,
            factor_version=factor_version,
            data_version=data_version,
            org_id=org_id,
            created_by=user_id,
            calculation_params=calculation_params or {},
            superseded_by_id=superseded_by_id
        )

        db.add(record)
        db.commit()
        db.refresh(record)
        return lineage_id

    @staticmethod
    def get_lineage_trail(db: Session, target_entity_id: str):
        return db.query(LineageRecord).filter(
            LineageRecord.target_entity_id == target_entity_id
        ).order_by(LineageRecord.created_at.desc()).all()
