from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, require_permission, CurrentUserContext
from app.models.compliance import (
    Framework, Disclosure, DisclosureDataPoint, CBAMDeclaration,
    EUTaxonomyAlignment, ReviewApproval
)
from app.schemas.compliance import (
    FrameworkResponse, DisclosureCreate, DisclosureResponse,
    DisclosureDataPointResponse, CBAMDeclarationResponse,
    EUTaxonomyAlignmentResponse, ApprovalActionRequest,
    ReviewApprovalResponse, DisclosurePackageExportResponse
)
from app.schemas.envelope import APIEnvelope
from app.modules.compliance.services import ComplianceService

router = APIRouter(prefix="/compliance", tags=["Regulatory Compliance & Disclosure"])

# ==========================================
# FRAMEWORKS & DISCLOSURES API
# ==========================================

@router.get("/frameworks", response_model=APIEnvelope[List[FrameworkResponse]])
def list_frameworks(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    frameworks = db.query(Framework).all()
    return APIEnvelope.success(data=frameworks)

@router.post("/disclosures/csrd", response_model=APIEnvelope[DisclosureResponse])
def create_csrd_disclosure(
    reporting_year: int = 2026,
    entity_id: Optional[str] = None,
    current_user: CurrentUserContext = Depends(require_permission("compliance:write")),
    db: Session = Depends(get_db)
):
    disclosure = ComplianceService.create_csrd_disclosure(
        db=db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        reporting_year=reporting_year,
        entity_id=entity_id
    )
    return APIEnvelope.success(data=disclosure)

@router.get("/disclosures", response_model=APIEnvelope[List[DisclosureResponse]])
def list_disclosures(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    disclosures = db.query(Disclosure).filter(Disclosure.org_id == current_user.org_id).order_by(Disclosure.created_at.desc()).all()
    return APIEnvelope.success(data=disclosures)

@router.get("/disclosures/{id}/datapoints", response_model=APIEnvelope[List[DisclosureDataPointResponse]])
def get_disclosure_datapoints(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    datapoints = db.query(DisclosureDataPoint).filter(DisclosureDataPoint.disclosure_id == id).all()
    return APIEnvelope.success(data=datapoints)

# ==========================================
# APPROVAL WORKFLOW & LOCKING API
# ==========================================

@router.post("/disclosures/{id}/approval", response_model=APIEnvelope[DisclosureResponse])
def process_approval_workflow(
    id: str,
    payload: ApprovalActionRequest,
    current_user: CurrentUserContext = Depends(require_permission("compliance:approve")),
    db: Session = Depends(get_db)
):
    disclosure = ComplianceService.process_approval_workflow(
        db=db,
        disclosure_id=id,
        reviewer_user_id=current_user.user_id,
        action=payload.action,
        comments=payload.comments
    )
    return APIEnvelope.success(data=disclosure)

# ==========================================
# DISCLOSURE PACKAGE EXPORT API (WITH LINEAGE APPENDIX)
# ==========================================

@router.get("/disclosures/{id}/export", response_model=APIEnvelope[DisclosurePackageExportResponse])
def export_disclosure_package(
    id: str,
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    package = ComplianceService.export_disclosure_package(db=db, disclosure_id=id)
    return APIEnvelope.success(data=package)

# ==========================================
# CBAM DECLARATION API
# ==========================================

@router.post("/cbam", response_model=APIEnvelope[CBAMDeclarationResponse])
def create_cbam_declaration(
    disclosure_id: str,
    imported_product_id: Optional[str] = None,
    quarterly_period: str = "Q1-2026",
    embedded_emissions_tco2e: float = 450.0,
    data_origin: str = "ACTUAL_PRIMARY",
    current_user: CurrentUserContext = Depends(require_permission("compliance:write")),
    db: Session = Depends(get_db)
):
    cbam = ComplianceService.process_cbam_declaration(
        db=db,
        disclosure_id=disclosure_id,
        imported_product_id=imported_product_id,
        quarterly_period=quarterly_period,
        embedded_emissions_tco2e=embedded_emissions_tco2e,
        data_origin=data_origin,
        org_id=current_user.org_id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=cbam)

@router.get("/cbam", response_model=APIEnvelope[List[CBAMDeclarationResponse]])
def list_cbam_declarations(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cbams = db.query(CBAMDeclaration).filter(CBAMDeclaration.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=cbams)

# ==========================================
# EU TAXONOMY ALIGNMENT API
# ==========================================

@router.post("/eu-taxonomy", response_model=APIEnvelope[EUTaxonomyAlignmentResponse])
def create_eu_taxonomy_alignment(
    disclosure_id: str,
    economic_activity_code: str = "CCM 3.1 Manufacture of renewable energy technologies",
    capex_aligned_usd: float = 450000.0,
    opex_aligned_usd: float = 12000.0,
    revenue_aligned_usd: float = 1200000.0,
    current_user: CurrentUserContext = Depends(require_permission("compliance:write")),
    db: Session = Depends(get_db)
):
    align = ComplianceService.process_eu_taxonomy_alignment(
        db=db,
        disclosure_id=disclosure_id,
        activity_code=economic_activity_code,
        capex_aligned=capex_aligned_usd,
        opex_aligned=opex_aligned_usd,
        revenue_aligned=revenue_aligned_usd,
        org_id=current_user.org_id,
        user_id=current_user.user_id
    )
    return APIEnvelope.success(data=align)

@router.get("/eu-taxonomy", response_model=APIEnvelope[List[EUTaxonomyAlignmentResponse]])
def list_eu_taxonomy_alignments(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aligns = db.query(EUTaxonomyAlignment).filter(EUTaxonomyAlignment.org_id == current_user.org_id).all()
    return APIEnvelope.success(data=aligns)
