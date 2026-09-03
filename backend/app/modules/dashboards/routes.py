from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security.rbac import get_current_user, CurrentUserContext
from app.schemas.dashboards import ExecutiveMetricsResponse, OperationalDrilldownNode
from app.schemas.envelope import APIEnvelope
from app.modules.dashboards.services import DashboardService

router = APIRouter(prefix="/dashboards", tags=["Executive & Operational Dashboards"])

@router.get("/executive", response_model=APIEnvelope[ExecutiveMetricsResponse])
def get_executive_metrics(
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    metrics = DashboardService.get_executive_metrics(db=db, org_id=current_user.org_id)
    return APIEnvelope.success(data=metrics)

@router.get("/drilldown", response_model=APIEnvelope[List[OperationalDrilldownNode]])
def get_operational_drilldown(
    parent_level: str = Query("COMPANY", description="COMPANY, ENTITY, FACILITY, DEPARTMENT, COST_CENTER"),
    parent_id: Optional[str] = Query(None),
    current_user: CurrentUserContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    nodes = DashboardService.get_operational_drilldown(
        db=db,
        org_id=current_user.org_id,
        parent_level=parent_level,
        parent_id=parent_id
    )
    return APIEnvelope.success(data=nodes)
