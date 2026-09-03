from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

class SupplierCreate(BaseModel):
    name: str
    code: str
    contact_email: EmailStr
    country: str = "United States"
    tier: str = "Tier 1"
    category: str = "Raw Materials"
    org_id: Optional[str] = None

class SupplierResponse(BaseModel):
    id: str
    name: str
    code: str
    contact_email: str
    country: str
    tier: str
    category: str
    status: str
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionnaireCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    languages_list: Optional[List[str]] = ["EN", "DE", "FR", "ES", "ZH", "JA"]
    fields: Optional[List[Dict[str, Any]]] = []

class QuestionnaireResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: str
    languages_list: List[str]
    mongo_ref_id: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionAnswerPayload(BaseModel):
    questionnaire_id: str
    answers: Dict[str, Any]
    evidence_attachments: Optional[List[Dict[str, Any]]] = []

class SubmissionResponse(BaseModel):
    id: str
    supplier_id: str
    questionnaire_id: str
    status: str
    completeness_score: float
    confidence_score: float
    validation_status: str
    submitted_at: Optional[datetime] = None
    answers: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ScorecardResponse(BaseModel):
    id: str
    supplier_id: str
    maturity_level: str
    category_ranking: int
    total_disclosed_co2e_kg: float
    yoy_change_pct: float
    score_date: datetime

    class Config:
        from_attributes = True

class SupplyNetworkGraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    geographic_heatmap: Dict[str, Dict[str, Any]]

class BidItem(BaseModel):
    supplier_id: str
    supplier_name: str
    bid_price_usd: float
    disclosed_pcf_co2e_kg: float

class ProcurementBidComparisonResponse(BaseModel):
    bids: List[Dict[str, Any]]
    recommended_winner_supplier_id: str
    carbon_weighting_notes: str
