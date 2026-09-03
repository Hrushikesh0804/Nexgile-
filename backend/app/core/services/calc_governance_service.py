from typing import List
from sqlalchemy.orm import Session
from app.models.governance import CalculationVersion, EmissionFactorVersion, FormulaVersion

class CalculationGovernanceService:
    @staticmethod
    def find_affected_calculations(db: Session, factor_id: str) -> List[CalculationVersion]:
        """Finds all historical calculation versions affected when an emission factor is updated or revised."""
        return db.query(CalculationVersion).filter(
            CalculationVersion.factor_version_id == factor_id
        ).all()

    @staticmethod
    def get_active_emission_factor(db: Session, factor_key: str) -> EmissionFactorVersion:
        return db.query(EmissionFactorVersion).filter(
            EmissionFactorVersion.factor_key == factor_key,
            EmissionFactorVersion.is_active == True
        ).first()

    @staticmethod
    def get_active_formula(db: Session, formula_key: str) -> FormulaVersion:
        return db.query(FormulaVersion).filter(
            FormulaVersion.formula_key == formula_key,
            FormulaVersion.is_active == True
        ).first()
