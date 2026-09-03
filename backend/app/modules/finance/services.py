from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.finance import CarbonBudget, InternalCarbonPrice, CreditOffset, ProjectEconomics, TCFDFinancialImpact
from app.models.ai_analytics import ReductionInitiative

class FinanceService:
    @staticmethod
    def sync_budget_consumption(db: Session, budget_id: str) -> CarbonBudget:
        """
        Updates carbon budget consumed_co2e_kg against linked ReductionInitiative actual progress.
        """
        budget = db.query(CarbonBudget).filter(CarbonBudget.id == budget_id).first()
        if not budget:
            raise ValueError("Carbon budget not found.")

        if budget.linked_initiative_id:
            init = db.query(ReductionInitiative).filter(ReductionInitiative.id == budget.linked_initiative_id).first()
            if init:
                # Consumed co2e = expected reduction * progress %
                consumed = round(init.expected_reduction_co2e_kg * (init.actual_progress_pct / 100.0), 2)
                budget.consumed_co2e_kg = consumed
                
                # Check status threshold
                if consumed >= budget.allocated_co2e_kg:
                    budget.status = "EXCEEDED"
                elif consumed >= budget.allocated_co2e_kg * 0.85:
                    budget.status = "AT_RISK"
                else:
                    budget.status = "ON_TRACK"
                db.commit()
                db.refresh(budget)
        return budget

    @staticmethod
    def retire_credit_offset(db: Session, offset_id: str, evidence_url: str, user_id: str) -> CreditOffset:
        """
        Retires carbon credit offset with registry evidence URL proof.
        """
        offset = db.query(CreditOffset).filter(CreditOffset.id == offset_id).first()
        if not offset:
            raise ValueError("Credit offset record not found.")

        offset.status = "RETIRED"
        offset.retirement_date = datetime.now(timezone.utc)
        offset.retirement_evidence_url = evidence_url
        offset.updated_by = user_id
        db.commit()
        db.refresh(offset)
        return offset

    @staticmethod
    def calculate_project_economics(
        db: Session,
        initiative_id: str,
        discount_rate_pct: float = 8.0
    ) -> ProjectEconomics:
        """
        Calculates financial NPV, IRR, and payback period linked to Module 4 ReductionInitiative.
        """
        init = db.query(ReductionInitiative).filter(ReductionInitiative.id == initiative_id).first()
        if not init:
            raise ValueError("Reduction initiative not found.")

        capex = init.capex_cost_usd
        opex = init.opex_cost_usd

        # Estimate annual energy savings ($) based on avoided carbon (e.g. $120 per tCO2e avoided)
        avoided_tco2e = init.expected_reduction_co2e_kg / 1000.0
        annual_savings = round(avoided_tco2e * 120.0 - opex, 2)
        annual_savings = max(1000.0, annual_savings)

        # Simple payback period
        payback = round(capex / annual_savings, 1) if annual_savings > 0 else 99.0

        # NPV calculation (10-year lifespan at discount rate)
        r = discount_rate_pct / 100.0
        npv = -capex + sum(annual_savings / ((1 + r) ** t) for t in range(1, 11))
        npv = round(npv, 2)

        # Estimated IRR %
        irr = round((annual_savings / capex) * 100.0 + 3.5, 1) if capex > 0 else 25.0

        econ = db.query(ProjectEconomics).filter(ProjectEconomics.initiative_id == initiative_id).first()
        if not econ:
            econ = ProjectEconomics(
                initiative_id=initiative_id,
                capex_usd=capex,
                opex_annual_usd=opex,
                discount_rate_pct=discount_rate_pct,
                npv_usd=npv,
                irr_pct=irr,
                payback_period_years=payback,
                org_id=init.org_id,
                created_by=init.created_by
            )
            db.add(econ)
        else:
            econ.capex_usd = capex
            econ.opex_annual_usd = opex
            econ.npv_usd = npv
            econ.irr_pct = irr
            econ.payback_period_years = payback

        db.commit()
        db.refresh(econ)
        return econ
