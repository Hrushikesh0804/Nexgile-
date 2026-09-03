import csv
import io
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.models.carbon import ActivityData, EmissionFactor, Calculation
from app.models.lineage import LineageRecord
from app.schemas.carbon import (
    ActivityDataCreate, ActivityDataResponse,
    EmissionFactorCreate, EmissionFactorResponse, EmissionFactorUpdate,
    CalculationResponse, LineageTrailResponse, CarbonSummaryResponse
)
from app.schemas.envelope import APIEnvelope
from app.modules.carbon.services import CarbonCalculationEngine

router = APIRouter(prefix="/carbon", tags=["Enterprise Carbon Accounting"])

# ==========================================
# EMISSION FACTORS API
# ==========================================

@router.get("/emission-factors", response_model=APIEnvelope[List[EmissionFactorResponse]])
def list_emission_factors(
    scope: Optional[str] = None,
    category: Optional[str] = None,
    country: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(EmissionFactor).filter(EmissionFactor.is_active == True)
    if scope:
        query = query.filter(EmissionFactor.scope == scope)
    if category:
        query = query.filter(EmissionFactor.category == category)
    if country:
        query = query.filter(EmissionFactor.country.in_([country, "GLOBAL"]))
    factors = query.all()
    return APIEnvelope.success(data=factors)

@router.post("/emission-factors", response_model=APIEnvelope[EmissionFactorResponse])
def create_emission_factor(
    payload: EmissionFactorCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    factor = EmissionFactor(
        factor_key=payload.factor_key,
        name=payload.name,
        version_tag=payload.version_tag,
        co2e_factor=payload.co2e_factor,
        co2_factor=payload.co2_factor,
        ch4_factor=payload.ch4_factor,
        n2o_factor=payload.n2o_factor,
        unit=payload.unit,
        country=payload.country,
        scope=payload.scope,
        category=payload.category,
        source_library=payload.source_library,
        valid_from_year=payload.valid_from_year,
        valid_to_year=payload.valid_to_year,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return APIEnvelope.success(data=factor)

@router.put("/emission-factors/{id}", response_model=APIEnvelope[EmissionFactorResponse])
def update_emission_factor_and_recalculate(
    id: str,
    payload: EmissionFactorUpdate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    factor = db.query(EmissionFactor).filter(EmissionFactor.id == id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Emission Factor not found")
        
    old_factor_val = factor.co2e_factor
    if payload.name: factor.name = payload.name
    if payload.co2e_factor is not None: factor.co2e_factor = payload.co2e_factor
    if payload.version_tag: factor.version_tag = payload.version_tag
    if payload.source_library: factor.source_library = payload.source_library
    factor.updated_at = datetime.now(timezone.utc)
    factor.updated_by = current_user.user_id
    db.commit()
    db.refresh(factor)

    # Trigger recalculation for affected historical calculations
    if payload.co2e_factor is not None and payload.co2e_factor != old_factor_val:
        CarbonCalculationEngine.recalculate_on_factor_change(db, factor.id, current_user.user_id)

    return APIEnvelope.success(data=factor)

# ==========================================
# ACTIVITY DATA & CALCULATION ENGINE API
# ==========================================

@router.post("/activity-data", response_model=APIEnvelope[CalculationResponse])
def create_activity_data_entry(
    payload: ActivityDataCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    # Create Activity Data row
    activity = ActivityData(
        org_id=payload.org_id or current_user.org_id,
        facility_id=payload.facility_id,
        entity_id=payload.entity_id,
        scope=payload.scope,
        category=payload.category,
        activity_type=payload.activity_type,
        quantity=payload.quantity,
        unit=payload.unit,
        start_date=payload.start_date,
        end_date=payload.end_date,
        source_type=payload.source_type or "MANUAL",
        created_by=current_user.user_id
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    # Find matching Emission Factor
    factor = None
    if payload.emission_factor_id:
        factor = db.query(EmissionFactor).filter(EmissionFactor.id == payload.emission_factor_id).first()
        
    if not factor:
        factor = db.query(EmissionFactor).filter(
            EmissionFactor.scope == payload.scope,
            EmissionFactor.category == payload.category,
            EmissionFactor.is_active == True
        ).first()

    if not factor:
        # Fallback default factor if specific factor library entry missing
        factor = db.query(EmissionFactor).filter(EmissionFactor.scope == payload.scope).first()

    if not factor:
        raise HTTPException(status_code=400, detail="No suitable Emission Factor found in library for this scope/category.")

    # Execute Calculation Engine & Lineage Service
    calc = CarbonCalculationEngine.calculate_emissions(
        db=db,
        activity_data=activity,
        factor=factor,
        user_id=current_user.user_id
    )

    return APIEnvelope.success(data=calc, lineage_id=calc.lineage_id)

@router.post("/activity-data/csv-import", response_model=APIEnvelope[List[CalculationResponse]])
async def import_activity_data_csv(
    facility_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    results = []
    for row in reader:
        scope = row.get("scope", "Scope 1")
        category = row.get("category", "Stationary Combustion")
        activity_type = row.get("activity_type", "Natural Gas")
        quantity = float(row.get("quantity", 0))
        unit = row.get("unit", "kWh")
        
        activity = ActivityData(
            org_id=current_user.org_id,
            facility_id=facility_id,
            scope=scope,
            category=category,
            activity_type=activity_type,
            quantity=quantity,
            unit=unit,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc),
            source_type="CSV_IMPORT",
            created_by=current_user.user_id
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

        factor = db.query(EmissionFactor).filter(
            EmissionFactor.scope == scope,
            EmissionFactor.category == category,
            EmissionFactor.is_active == True
        ).first()
        if not factor:
            factor = db.query(EmissionFactor).first()

        if factor:
            calc = CarbonCalculationEngine.calculate_emissions(
                db=db, activity_data=activity, factor=factor, user_id=current_user.user_id
            )
            results.append(calc)

    return APIEnvelope.success(data=results)

@router.get("/activity-data", response_model=APIEnvelope[List[ActivityDataResponse]])
def list_activity_data(
    scope: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, ActivityData, current_user)
    if scope:
        query = query.filter(ActivityData.scope == scope)
    activities = query.all()
    return APIEnvelope.success(data=activities)

# ==========================================
# CALCULATIONS & LINEAGE API
# ==========================================

@router.get("/calculations", response_model=APIEnvelope[List[CalculationResponse]])
def list_calculations(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, Calculation, current_user)
    calcs = query.order_by(Calculation.created_at.desc()).all()
    return APIEnvelope.success(data=calcs)

@router.get("/calculations/{id}/lineage", response_model=APIEnvelope[LineageTrailResponse])
def get_calculation_lineage(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    calc = db.query(Calculation).filter(Calculation.id == id).first()
    if not calc:
        raise HTTPException(status_code=404, detail="Calculation not found")
        
    lineage = db.query(LineageRecord).filter(LineageRecord.lineage_id == calc.lineage_id).first()
    if not lineage:
        raise HTTPException(status_code=404, detail="Lineage record not found")
        
    return APIEnvelope.success(data=lineage)

# ==========================================
# EMISSIONS SUMMARY API
# ==========================================

@router.get("/summary", response_model=APIEnvelope[CarbonSummaryResponse])
def get_emissions_summary(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_scoped_query(db, Calculation, current_user).filter(Calculation.status == "APPROVED")
    approved_calcs = query.all()
    
    total_co2e = 0.0
    scope1_co2e = 0.0
    scope2_co2e = 0.0
    scope3_co2e = 0.0
    category_breakdown = {}

    for c in approved_calcs:
        activity = db.query(ActivityData).filter(ActivityData.id == c.activity_data_id).first()
        if not activity:
            continue

        co2e = c.calculated_co2e_kg
        total_co2e += co2e
        
        if activity.scope == "Scope 1":
            scope1_co2e += co2e
        elif activity.scope == "Scope 2":
            scope2_co2e += co2e
        elif activity.scope == "Scope 3":
            scope3_co2e += co2e

        cat = activity.category
        category_breakdown[cat] = category_breakdown.get(cat, 0.0) + co2e

    summary = CarbonSummaryResponse(
        total_co2e_kg=round(total_co2e, 2),
        scope1_co2e_kg=round(scope1_co2e, 2),
        scope2_co2e_kg=round(scope2_co2e, 2),
        scope3_co2e_kg=round(scope3_co2e, 2),
        category_breakdown={k: round(v, 2) for k, v in category_breakdown.items()}
    )
    return APIEnvelope.success(data=summary)
