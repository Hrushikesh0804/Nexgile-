from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, mongo_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.core.security.scoping import get_scoped_query
from app.models.suppliers import Supplier, Questionnaire, Submission, Scorecard, ActionPlan
from app.schemas.suppliers import (
    SupplierCreate, SupplierResponse,
    QuestionnaireCreate, QuestionnaireResponse,
    SubmissionAnswerPayload, SubmissionResponse,
    ScorecardResponse, SupplyNetworkGraphResponse,
    ProcurementBidComparisonResponse
)
from app.schemas.envelope import APIEnvelope
from app.modules.suppliers.services import SupplierService

router = APIRouter(prefix="/suppliers", tags=["Supplier Engagement Module"])

# ==========================================
# SUPPLIERS CATALOG API
# ==========================================

@router.get("", response_model=APIEnvelope[List[SupplierResponse]])
def list_suppliers(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if caller is external Supplier role
    if "Supplier" in current_user.roles and "SuperAdmin" not in current_user.roles:
        suppliers = db.query(Supplier).filter(Supplier.user_id == current_user.user_id).all()
    else:
        query = get_scoped_query(db, Supplier, current_user)
        suppliers = query.all()
    return APIEnvelope.success(data=suppliers)

@router.post("", response_model=APIEnvelope[SupplierResponse])
def invite_supplier(
    payload: SupplierCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    supplier = SupplierService.invite_supplier(
        db=db,
        name=payload.name,
        code=payload.code,
        contact_email=payload.contact_email,
        category=payload.category,
        country=payload.country,
        tier=payload.tier,
        org_id=payload.org_id or current_user.org_id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=supplier)

@router.get("/{id}", response_model=APIEnvelope[SupplierResponse])
def get_supplier_detail(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Restrict supplier role to only their own record
    if "Supplier" in current_user.roles and supplier.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only view your own supplier record")

    return APIEnvelope.success(data=supplier)

# ==========================================
# QUESTIONNAIRES API
# ==========================================

@router.post("/questionnaires", response_model=APIEnvelope[QuestionnaireResponse])
def create_questionnaire_campaign(
    payload: QuestionnaireCreate,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    q = SupplierService.create_questionnaire(
        db=db,
        title=payload.title,
        description=payload.description,
        fields=payload.fields or [],
        languages_list=payload.languages_list or ["EN", "DE", "FR", "ES", "ZH", "JA"],
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        deadline=payload.deadline
    )
    return APIEnvelope.success(data=q)

@router.get("/questionnaires", response_model=APIEnvelope[List[QuestionnaireResponse]])
def list_questionnaires(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    questionnaires = db.query(Questionnaire).all()
    res_list = []
    for q in questionnaires:
        # Fetch template fields from Mongo
        doc = mongo_db.questionnaire_templates.find_one({"postgres_ref_id": q.id})
        fields = doc.get("fields", []) if doc else []
        res_list.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "deadline": q.deadline,
            "status": q.status,
            "languages_list": q.languages_list or [],
            "mongo_ref_id": q.mongo_ref_id,
            "fields": fields,
            "created_at": q.created_at
        })
    return APIEnvelope.success(data=res_list)

# ==========================================
# SUBMISSIONS API (Supplier Restricted Scoping)
# ==========================================

@router.post("/submissions", response_model=APIEnvelope[SubmissionResponse])
def submit_questionnaire(
    payload: SubmissionAnswerPayload,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find supplier record corresponding to logged in user
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.user_id).first()
    if not supplier:
        # Fallback for admin test submission
        supplier = db.query(Supplier).first()

    sub = SupplierService.submit_questionnaire_response(
        db=db,
        supplier_id=supplier.id,
        questionnaire_id=payload.questionnaire_id,
        answers=payload.answers,
        evidence_attachments=payload.evidence_attachments or [],
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=sub)

@router.get("/submissions", response_model=APIEnvelope[List[SubmissionResponse]])
def list_submissions(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # CRITICAL SECURITY SCOPING: If caller is external Supplier role, restrict to ONLY their own submissions!
    if "Supplier" in current_user.roles and "SuperAdmin" not in current_user.roles:
        supplier = db.query(Supplier).filter(Supplier.user_id == current_user.user_id).first()
        if not supplier:
            return APIEnvelope.success(data=[])
        submissions = db.query(Submission).filter(Submission.supplier_id == supplier.id).all()
    else:
        submissions = db.query(Submission).all()

    res_list = []
    for sub in submissions:
        doc = mongo_db.submission_responses.find_one({"postgres_ref_id": sub.id})
        answers = doc.get("answers", {}) if doc else {}
        res_list.append({
            "id": sub.id,
            "supplier_id": sub.supplier_id,
            "questionnaire_id": sub.questionnaire_id,
            "status": sub.status,
            "completeness_score": sub.completeness_score,
            "confidence_score": sub.confidence_score,
            "validation_status": sub.validation_status,
            "submitted_at": sub.submitted_at,
            "answers": answers
        })
    return APIEnvelope.success(data=res_list)

@router.post("/submissions/{id}/validate", response_model=APIEnvelope[ScorecardResponse])
def validate_submission(
    id: str,
    current_user: CurrentUserContext = Depends(require_permission("carbon:write")),
    db: Session = Depends(get_db)
):
    scorecard = SupplierService.validate_submission_and_update_scorecard(
        db=db,
        submission_id=id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=scorecard)

@router.get("/scorecards/{supplier_id}", response_model=APIEnvelope[ScorecardResponse])
def get_supplier_scorecard(
    supplier_id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scorecard = db.query(Scorecard).filter(Scorecard.supplier_id == supplier_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found for supplier")
    return APIEnvelope.success(data=scorecard)

# ==========================================
# SUPPLY NETWORK GRAPH & GEOGRAPHIC MAP API
# ==========================================

@router.get("/network/graph", response_model=APIEnvelope[SupplyNetworkGraphResponse])
def get_supply_network_graph(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    graph = SupplierService.get_supply_network_graph(db=db, org_id=current_user.org_id)
    return APIEnvelope.success(data=graph)

# ==========================================
# PROCUREMENT CARBON-WEIGHTED BID COMPARISON API
# ==========================================

@router.post("/procurement/bid-comparison", response_model=APIEnvelope[ProcurementBidComparisonResponse])
def compare_carbon_weighted_bids(
    bids: List[Dict[str, Any]],
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = SupplierService.compare_carbon_weighted_bids(db=db, bids=bids)
    return APIEnvelope.success(data=result)
