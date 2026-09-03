from typing import Type
from sqlalchemy.orm import Session, Query
from app.core.security.rbac import CurrentUserContext

def get_scoped_query(db: Session, model: Type, user: CurrentUserContext) -> Query:
    query = db.query(model)
    
    if user.is_superadmin:
        # If superadmin has an org context selected, filter by that org, otherwise return all
        if user.org_id and hasattr(model, "org_id"):
            return query.filter(model.org_id == user.org_id)
        return query

    # Non-superadmin users MUST be restricted by org_id
    if hasattr(model, "org_id"):
        query = query.filter(model.org_id == user.org_id)

    # Entity level scoping
    if user.entity_ids and hasattr(model, "entity_id"):
        query = query.filter(getattr(model, "entity_id").in_(user.entity_ids))
    elif user.entity_ids and model.__name__ == "Entity":
        query = query.filter(model.id.in_(user.entity_ids))

    # Facility level scoping
    if user.facility_ids and hasattr(model, "facility_id"):
        query = query.filter(getattr(model, "facility_id").in_(user.facility_ids))
    elif user.facility_ids and model.__name__ == "Facility":
        query = query.filter(model.id.in_(user.facility_ids))

    return query
