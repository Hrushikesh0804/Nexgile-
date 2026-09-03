from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.hardening import GlobalSearchResponse

class BaseSearchProvider(ABC):
    @abstractmethod
    def search_global(
        self,
        db: Session,
        query: str,
        org_id: str,
        entity_types: Optional[List[str]] = None,
        limit: int = 20
    ) -> GlobalSearchResponse:
        pass
