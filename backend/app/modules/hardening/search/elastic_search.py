from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.hardening.search.base import BaseSearchProvider
from app.modules.hardening.search.postgres_search import PostgresTSVectorSearchProvider
from app.schemas.hardening import GlobalSearchResponse

class ElasticsearchSearchProvider(BaseSearchProvider):
    def __init__(self):
        # Stub for future external Elasticsearch cluster connection
        self.fallback = PostgresTSVectorSearchProvider()

    def search_global(
        self,
        db: Session,
        query: str,
        org_id: str,
        entity_types: Optional[List[str]] = None,
        limit: int = 20
    ) -> GlobalSearchResponse:
        # Transparent fallback to PostgresTSVector while preserving ES API contract
        res = self.fallback.search_global(db, query, org_id, entity_types, limit)
        res.provider = "ElasticsearchClusterStub"
        return res
