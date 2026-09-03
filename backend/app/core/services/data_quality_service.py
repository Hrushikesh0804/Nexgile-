from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.data_quality import DataQualityFlag

class DataQualityService:
    @staticmethod
    def score_completeness(data_dict: Dict[str, Any], required_keys: list) -> float:
        if not required_keys:
            return 1.0
        present = sum(1 for key in required_keys if data_dict.get(key) is not None and data_dict.get(key) != "")
        return round(present / len(required_keys), 2)

    @staticmethod
    def score_confidence(source_type: str, verification_status: str = "UNVERIFIED") -> float:
        # Confidence score based on data origin quality
        base_scores = {
            "AUTOMATED_METER": 0.95,
            "UTILITY_INVOICE_OCR": 0.90,
            "MANUAL_ENTRY": 0.70,
            "ESTIMATION": 0.50,
            "SUPPLIER_SELF_REPORTED": 0.65
        }
        score = base_scores.get(source_type.upper(), 0.60)
        if verification_status.upper() == "THIRD_PARTY_AUDITED":
            score = min(1.0, score + 0.10)
        return round(score, 2)

    @staticmethod
    def flag_anomaly(
        db: Session,
        target_entity_type: str,
        target_entity_id: str,
        flag_type: str,
        severity: str,
        message: str,
        org_id: Optional[str] = None,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        completeness_score: Optional[float] = None,
        confidence_score: Optional[float] = None
    ) -> DataQualityFlag:
        flag = DataQualityFlag(
            target_entity_type=target_entity_type,
            target_entity_id=target_entity_id,
            flag_type=flag_type,
            severity=severity,
            status="OPEN",
            message=message,
            org_id=org_id,
            created_by=user_id,
            details=details or {},
            completeness_score=completeness_score,
            confidence_score=confidence_score
        )
        db.add(flag)
        db.commit()
        db.refresh(flag)
        return flag
