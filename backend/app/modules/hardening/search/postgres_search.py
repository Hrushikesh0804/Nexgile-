from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.hardening.search.base import BaseSearchProvider
from app.schemas.hardening import GlobalSearchResponse, GlobalSearchResultItem
from app.models.tenant import Facility, Entity, Organization
from app.models.suppliers import Supplier
from app.models.products import Product
from app.models.carbon import ActivityData, EmissionFactor, Calculation
from app.models.compliance import Disclosure
from app.models.ai_analytics import ReductionInitiative

class PostgresTSVectorSearchProvider(BaseSearchProvider):
    def search_global(
        self,
        db: Session,
        query: str,
        org_id: str,
        entity_types: Optional[List[str]] = None,
        limit: int = 20
    ) -> GlobalSearchResponse:
        results: List[GlobalSearchResultItem] = []
        q_clean = query.strip().lower()
        q_term = f"%{q_clean}%"

        # Helper filter
        def matches(text: Optional[str]) -> bool:
            if not text:
                return False
            if not q_clean or q_clean in text.lower():
                return True
            return False

        # 1. Facilities
        if not entity_types or "Facility" in entity_types:
            facs = db.query(Facility).filter(Facility.org_id == org_id).all()
            for f in facs:
                if matches(f.name) or matches(f.country) or matches(f.code) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=f.id,
                        entity_type="Facility",
                        title=f.name,
                        subtitle=f"Facility ({f.country})",
                        snippet=f"Facility code {f.code or f.id[:8]} located in {f.country}",
                        metadata={"facility_id": f.id, "country": f.country}
                    ))

        # 2. Suppliers
        if not entity_types or "Supplier" in entity_types:
            sups = db.query(Supplier).filter(Supplier.org_id == org_id).all()
            for s in sups:
                if matches(s.name) or matches(s.category) or matches(s.tier) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=s.id,
                        entity_type="Supplier",
                        title=s.name,
                        subtitle=f"Supplier Tier {s.tier}",
                        snippet=f"Category: {s.category} | Tier: {s.tier}",
                        metadata={"supplier_id": s.id, "tier": s.tier}
                    ))


        # 3. Products
        if not entity_types or "Product" in entity_types:
            prods = db.query(Product).filter(Product.org_id == org_id).all()
            for p in prods:
                if matches(p.name) or matches(p.code) or matches(p.category) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=p.id,
                        entity_type="Product",
                        title=p.name,
                        subtitle=f"Product Code {p.code}",
                        snippet=f"Functional Unit: {p.functional_unit} | Category: {p.category}",
                        metadata={"product_id": p.id, "code": p.code}
                    ))


        # 4. ActivityData
        if not entity_types or "ActivityData" in entity_types:
            acts = db.query(ActivityData).filter(ActivityData.org_id == org_id).all()
            for a in acts:
                if matches(a.activity_type) or matches(a.scope) or matches(a.category) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=a.id,
                        entity_type="ActivityData",
                        title=f"{a.activity_type} ({a.quantity} {a.unit})",
                        subtitle=f"{a.scope} - {a.category}",
                        snippet=f"Quantity: {a.quantity} {a.unit} | Source: {a.source_type}",
                        metadata={"activity_id": a.id, "scope": a.scope}
                    ))

        # 5. EmissionFactors
        if not entity_types or "EmissionFactor" in entity_types:
            efs = db.query(EmissionFactor).all()
            for ef in efs:
                if matches(ef.name) or matches(ef.factor_key) or matches(ef.category) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=ef.id,
                        entity_type="EmissionFactor",
                        title=ef.name,
                        subtitle=f"Factor Key: {ef.factor_key}",
                        snippet=f"{ef.co2e_factor} kgCO2e/{ef.unit} ({ef.source_library})",
                        metadata={"factor_key": ef.factor_key, "library": ef.source_library}
                    ))

        # 6. Calculations
        if not entity_types or "Calculation" in entity_types:
            calcs = db.query(Calculation).filter(Calculation.org_id == org_id).all()
            for c in calcs:
                if matches(c.id) or matches(str(c.calculated_co2e_kg)) or matches(c.formula_expression) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=c.id,
                        entity_type="Calculation",
                        title=f"Calculation #{c.id[:8]}",
                        subtitle=f"Result: {c.calculated_co2e_kg} kgCO2e",
                        snippet=f"Formula: {c.formula_expression} | Lineage: {c.lineage_id[:8]}...",
                        metadata={"calculation_id": c.id, "co2e_kg": c.calculated_co2e_kg}
                    ))

        # 7. Disclosures
        if not entity_types or "Disclosure" in entity_types:
            discs = db.query(Disclosure).filter(Disclosure.org_id == org_id).all()
            for d in discs:
                if matches(str(d.reporting_year)) or matches(d.status) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=d.id,
                        entity_type="Disclosure",
                        title=f"FY{d.reporting_year} Disclosure",
                        subtitle=f"Status: {d.status}",
                        snippet=f"Double Materiality Assessment & Lineage Appendix",
                        metadata={"disclosure_id": d.id, "status": d.status}
                    ))

        # 8. ReductionInitiatives
        if not entity_types or "ReductionInitiative" in entity_types:
            inits = db.query(ReductionInitiative).filter(ReductionInitiative.org_id == org_id).all()
            for i in inits:
                if matches(i.title) or matches(i.category) or not q_clean:
                    results.append(GlobalSearchResultItem(
                        id=i.id,
                        entity_type="ReductionInitiative",
                        title=i.title,
                        subtitle=f"Target Abatement: {i.expected_reduction_co2e_kg / 1000.0} tCO2e",
                        snippet=f"CapEx: ${i.capex_cost_usd} | Abatement Cost: ${i.abatement_cost_per_tco2e}/tCO2e",
                        metadata={"initiative_id": i.id, "abatement": i.expected_reduction_co2e_kg}
                    ))



        return GlobalSearchResponse(
            query=query,
            total_results=len(results),
            results=results[:limit],
            provider="PostgresTSVector"
        )
