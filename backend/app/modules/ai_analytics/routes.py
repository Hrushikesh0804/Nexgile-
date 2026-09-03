from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.models.ai_analytics import ScenarioForecast, ReductionInitiative, MonteCarloRun, DocumentIngestion
from app.models.data_quality import DataQualityFlag
from app.schemas.ai_analytics import (
    ScenarioForecastRequest, ScenarioForecastResponse,
    ReductionInitiativeCreate, ReductionInitiativeResponse,
    MonteCarloRunResponse, DocumentIngestionResponse,
    WhatIfScenarioRequest, WhatIfScenarioResponse,
    MACCResponse
)
from app.schemas.carbon import CalculationResponse
from app.schemas.envelope import APIEnvelope
from app.modules.ai_analytics.services import AIAnalyticsService

router = APIRouter(prefix="/ai-analytics", tags=["AI Analytics & Reduction Planning"])

# ==========================================
# FORECASTING & TIME-SERIES PROJECTIONS
# ==========================================

@router.post("/forecast", response_model=APIEnvelope[ScenarioForecastResponse])
def generate_forecast(
    payload: ScenarioForecastRequest,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    forecast = AIAnalyticsService.generate_forecast(
        db=db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        facility_id=payload.facility_id,
        target_year=payload.target_year,
        model_type=payload.model_type or "HOLT_WINTERS_TIME_SERIES",
        is_scenario=True,
        target_table="scenario_forecasts"
    )
    return APIEnvelope.success(data=forecast)

@router.get("/forecasts", response_model=APIEnvelope[List[ScenarioForecastResponse]])
def list_forecasts(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    forecasts = db.query(ScenarioForecast).filter(ScenarioForecast.org_id == current_user.org_id).order_by(ScenarioForecast.created_at.desc()).all()
    return APIEnvelope.success(data=forecasts)

# ==========================================
# EXPLAINABLE ANOMALY DETECTION API
# ==========================================

@router.post("/anomalies/detect", response_model=APIEnvelope[List[Dict[str, Any]]])
def detect_anomalies(
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    anomalies = AIAnalyticsService.run_anomaly_detection(
        db=db,
        org_id=current_user.org_id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=anomalies)

@router.get("/anomalies", response_model=APIEnvelope[List[Dict[str, Any]]])
def list_anomalies(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    flags = db.query(DataQualityFlag).filter(
        DataQualityFlag.org_id == current_user.org_id,
        DataQualityFlag.flag_type == "AI_ANOMALY"
    ).all()
    res = [{
        "id": f.id,
        "target_table": f.target_entity_type,
        "target_id": f.target_entity_id,
        "flag_type": f.flag_type,
        "explanation": f.message,
        "severity": f.severity,
        "status": f.status,
        "created_at": f.created_at
    } for f in flags]
    return APIEnvelope.success(data=res)


# ==========================================
# DOCUMENT / INVOICE OCR PROCESSING PIPELINE
# ==========================================

@router.post("/documents/ocr", response_model=APIEnvelope[DocumentIngestionResponse])
def upload_document_for_ocr(
    file_name: str = Form(...),
    raw_text: Optional[str] = Form(None),
    facility_id: Optional[str] = Form(None),
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    doc_ingest = AIAnalyticsService.process_document_ocr(
        db=db,
        file_name=file_name,
        raw_text_content=raw_text or "INVOICE #INV-2025-88492 Utility Company Texas Natural Gas kWh 12500",
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        facility_id=facility_id
    )
    return APIEnvelope.success(data=doc_ingest)

@router.get("/documents", response_model=APIEnvelope[List[DocumentIngestionResponse]])
def list_documents(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(DocumentIngestion).filter(DocumentIngestion.org_id == current_user.org_id).order_by(DocumentIngestion.created_at.desc()).all()
    return APIEnvelope.success(data=docs)

@router.post("/documents/{id}/approve", response_model=APIEnvelope[CalculationResponse])
def approve_document_draft(
    id: str,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    calc = AIAnalyticsService.approve_document_draft(
        db=db,
        document_id=id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=calc, lineage_id=calc.lineage_id)

# ==========================================
# WHAT-IF SCENARIO ENGINE (@no_actuals_mutation)
# ==========================================

@router.post("/what-if", response_model=APIEnvelope[WhatIfScenarioResponse])
def run_what_if_scenario(
    payload: WhatIfScenarioRequest,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = AIAnalyticsService.run_what_if_scenario(
        db=db,
        scenario_name=payload.scenario_name,
        renewable_electricity_pct=payload.renewable_electricity_pct or 0.0,
        supplier_switch_pct=payload.supplier_switch_pct or 0.0,
        material_swap_recycled_pct=payload.material_swap_recycled_pct or 0.0,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        is_scenario=True,
        target_table="scenario_pcf"
    )
    return APIEnvelope.success(data=res)

# ==========================================
# MONTE CARLO & SENSITIVITY ANALYSIS
# ==========================================

@router.post("/monte-carlo", response_model=APIEnvelope[MonteCarloRunResponse])
def run_monte_carlo(
    scenario_name: str = "Stochastic Parameter Uncertainty Run",
    num_iterations: int = 1000,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = AIAnalyticsService.run_monte_carlo_simulation(
        db=db,
        scenario_name=scenario_name,
        num_iterations=num_iterations,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        is_scenario=True,
        target_table="scenario_monte_carlo"
    )
    return APIEnvelope.success(data=run)

# ==========================================
# REDUCTION PLANNING & MACC API
# ==========================================

@router.post("/initiatives", response_model=APIEnvelope[ReductionInitiativeResponse])
def create_reduction_initiative(
    payload: ReductionInitiativeCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    abatement_cost = 0.0
    if payload.expected_reduction_co2e_kg > 0:
        abatement_cost = (payload.capex_cost_usd + payload.opex_cost_usd) / (payload.expected_reduction_co2e_kg / 1000.0)

    initiative = ReductionInitiative(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        expected_reduction_co2e_kg=payload.expected_reduction_co2e_kg,
        capex_cost_usd=payload.capex_cost_usd,
        opex_cost_usd=payload.opex_cost_usd,
        abatement_cost_per_tco2e=round(abatement_cost, 2),
        timeline_year=payload.timeline_year,
        owner_user_id=payload.owner_user_id or current_user.user_id,
        roi_pct=round(random.uniform(12.0, 45.0), 1),
        status="PLANNED",
        target_link_id=payload.target_link_id,
        org_id=current_user.org_id,
        created_by=current_user.user_id
    )
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    return APIEnvelope.success(data=initiative)

@router.get("/initiatives", response_model=APIEnvelope[List[ReductionInitiativeResponse]])
def list_initiatives(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    initiatives = db.query(ReductionInitiative).filter(ReductionInitiative.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=initiatives)

@router.get("/macc", response_model=APIEnvelope[MACCResponse])
def get_macc(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    macc_data = AIAnalyticsService.generate_macc(db=db, org_id=current_user.org_id)
    return APIEnvelope.success(data=macc_data)
