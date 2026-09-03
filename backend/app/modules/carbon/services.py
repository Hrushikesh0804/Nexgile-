from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.carbon import ActivityData, EmissionFactor, Calculation
from app.models.governance import CalculationVersion
from app.core.services.lineage_service import LineageService
from app.core.services.data_quality_service import DataQualityService
from app.core.services.calc_governance_service import CalculationGovernanceService

UNIT_CONVERSION_TABLE = {
    # Energy
    ("MWh", "kWh"): 1000.0,
    ("kWh", "kWh"): 1.0,
    ("GJ", "kWh"): 277.778,
    ("MMBtu", "kWh"): 293.071,
    # Volume / Fuel
    ("liter", "liter"): 1.0,
    ("liters", "liter"): 1.0,
    ("gallon", "liter"): 3.78541,
    ("gallons", "liter"): 3.78541,
    ("m3", "m3"): 1.0,
    # Mass
    ("kg", "kg"): 1.0,
    ("tonne", "kg"): 1000.0,
    ("tonnes", "kg"): 1000.0,
    ("lb", "kg"): 0.453592,
    # Spend
    ("USD", "USD"): 1.0,
    ("EUR", "USD"): 1.08,
    ("GBP", "USD"): 1.27
}

class CarbonCalculationEngine:
    @staticmethod
    def get_unit_conversion_ratio(from_unit: str, to_unit: str) -> float:
        if from_unit.lower() == to_unit.lower():
            return 1.0
        ratio = UNIT_CONVERSION_TABLE.get((from_unit, to_unit))
        if ratio is None:
            ratio = UNIT_CONVERSION_TABLE.get((from_unit.lower(), to_unit.lower()), 1.0)
        return ratio

    @staticmethod
    def calculate_emissions(
        db: Session,
        activity_data: ActivityData,
        factor: EmissionFactor,
        user_id: str,
        allocation_pct: float = 100.0
    ) -> Calculation:
        conversion_ratio = CarbonCalculationEngine.get_unit_conversion_ratio(activity_data.unit, factor.unit)
        effective_quantity = activity_data.quantity * conversion_ratio
        calculated_co2e_kg = effective_quantity * factor.co2e_factor * (allocation_pct / 100.0)
        
        calculated_co2_kg = effective_quantity * (factor.co2_factor or factor.co2e_factor * 0.98) * (allocation_pct / 100.0)
        calculated_ch4_kg = effective_quantity * (factor.ch4_factor or factor.co2e_factor * 0.01) * (allocation_pct / 100.0)
        calculated_n2o_kg = effective_quantity * (factor.n2o_factor or factor.co2e_factor * 0.01) * (allocation_pct / 100.0)
        
        formula = f"{activity_data.quantity} [{activity_data.unit}] * {conversion_ratio} (unit conversion) * {factor.co2e_factor} [{factor.unit}] * {allocation_pct}% allocation"
        methodology = f"GHG Protocol Corporate Standard - {activity_data.scope} ({activity_data.category})"
        
        # 1. Create immutable Lineage Record
        lineage_id = LineageService.create_lineage_record(
            db=db,
            source=f"Activity Data #{activity_data.id} ({activity_data.source_type})",
            methodology=methodology,
            formula=formula,
            factor_version=f"{factor.factor_key}:{factor.version_tag}",
            data_version=f"v{activity_data.version}",
            user_id=user_id,
            target_entity_type="Calculation",
            target_entity_id=activity_data.id,
            org_id=activity_data.org_id,
            calculation_params={
                "quantity": activity_data.quantity,
                "input_unit": activity_data.unit,
                "factor_unit": factor.unit,
                "conversion_ratio": conversion_ratio,
                "factor_value": factor.co2e_factor,
                "allocation_pct": allocation_pct,
                "co2e_result_kg": calculated_co2e_kg
            }
        )
        
        # 2. Data Quality Check
        completeness = DataQualityService.score_completeness(
            {"quantity": activity_data.quantity, "unit": activity_data.unit, "factor_id": factor.id},
            ["quantity", "unit", "factor_id"]
        )
        confidence = DataQualityService.score_confidence(activity_data.source_type or "MANUAL")
        
        if completeness < 1.0 or confidence < 0.70:
            DataQualityService.flag_anomaly(
                db=db,
                target_entity_type="Calculation",
                target_entity_id=activity_data.id,
                flag_type="LOW_CONFIDENCE" if confidence < 0.70 else "INCOMPLETE",
                severity="MEDIUM",
                message=f"Data quality audit note: Completeness = {completeness}, Confidence = {confidence}",
                org_id=activity_data.org_id,
                user_id=user_id,
                completeness_score=completeness,
                confidence_score=confidence
            )

        # 3. Create Calculation Record
        calc = Calculation(
            activity_data_id=activity_data.id,
            factor_id=factor.id,
            formula_expression=formula,
            unit_conversion_ratio=conversion_ratio,
            allocation_pct=allocation_pct,
            input_quantity=activity_data.quantity,
            calculated_co2e_kg=round(calculated_co2e_kg, 4),
            calculated_co2_kg=round(calculated_co2_kg, 4),
            calculated_ch4_kg=round(calculated_ch4_kg, 4),
            calculated_n2o_kg=round(calculated_n2o_kg, 4),
            lineage_id=lineage_id,
            status="APPROVED",
            version=1,
            org_id=activity_data.org_id,
            created_by=user_id
        )
        db.add(calc)
        db.commit()
        db.refresh(calc)
        return calc

    @staticmethod
    def recalculate_on_factor_change(db: Session, factor_id: str, user_id: str) -> List[Calculation]:
        """
        Recalculates all historical calculations affected when an emission factor changes.
        Creates NEW calculation versions — never overwrites existing rows.
        """
        existing_calcs = db.query(Calculation).filter(
            Calculation.factor_id == factor_id,
            Calculation.status == "APPROVED"
        ).all()
        
        factor = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
        if not factor:
            return []

        recalculated_list = []
        for old_calc in existing_calcs:
            activity_data = db.query(ActivityData).filter(ActivityData.id == old_calc.activity_data_id).first()
            if not activity_data:
                continue

            # Mark old calculation version as SUPERSEDED
            old_calc.status = "SUPERSEDED"
            old_calc.updated_at = datetime.now(timezone.utc)

            # Perform recalculation
            conversion_ratio = old_calc.unit_conversion_ratio
            effective_quantity = activity_data.quantity * conversion_ratio
            new_co2e_kg = effective_quantity * factor.co2e_factor * (old_calc.allocation_pct / 100.0)
            
            formula = f"[RECALCULATED v{old_calc.version + 1}] {activity_data.quantity} [{activity_data.unit}] * {factor.co2e_factor} [{factor.unit}]"
            
            # New Lineage Record
            new_lineage_id = LineageService.create_lineage_record(
                db=db,
                source=f"Recalculation engine (Factor Revision {factor.version_tag})",
                methodology=f"GHG Protocol - Factor Revision Impact Analysis",
                formula=formula,
                factor_version=f"{factor.factor_key}:{factor.version_tag}",
                data_version=f"v{activity_data.version}",
                user_id=user_id,
                target_entity_type="Calculation",
                target_entity_id=activity_data.id,
                org_id=activity_data.org_id,
                superseded_by_id=old_calc.lineage_id,
                calculation_params={
                    "previous_co2e_kg": old_calc.calculated_co2e_kg,
                    "new_co2e_kg": new_co2e_kg,
                    "revised_factor_value": factor.co2e_factor
                }
            )

            # Create NEW versioned calculation row
            new_calc = Calculation(
                activity_data_id=activity_data.id,
                factor_id=factor.id,
                formula_expression=formula,
                unit_conversion_ratio=conversion_ratio,
                allocation_pct=old_calc.allocation_pct,
                input_quantity=activity_data.quantity,
                calculated_co2e_kg=round(new_co2e_kg, 4),
                calculated_co2_kg=round(new_co2e_kg * 0.98, 4),
                calculated_ch4_kg=round(new_co2e_kg * 0.01, 4),
                calculated_n2o_kg=round(new_co2e_kg * 0.01, 4),
                lineage_id=new_lineage_id,
                status="APPROVED",
                version=old_calc.version + 1,
                org_id=activity_data.org_id,
                created_by=user_id
            )
            db.add(new_calc)
            recalculated_list.append(new_calc)

        db.commit()
        return recalculated_list
