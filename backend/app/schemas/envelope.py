from typing import Generic, TypeVar, Optional, List, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")

class MetaDataQuality(BaseModel):
    completeness_score: Optional[float] = Field(default=1.0)
    confidence_score: Optional[float] = Field(default=0.95)
    validation_status: Optional[str] = Field(default="VALIDATED")

class MetaEnvelope(BaseModel):
    lineage_id: Optional[str] = None
    data_quality: Optional[MetaDataQuality] = Field(default_factory=MetaDataQuality)

class APIEnvelope(BaseModel, Generic[T]):
    data: Optional[T] = None
    meta: MetaEnvelope = Field(default_factory=MetaEnvelope)
    errors: List[str] = Field(default_factory=list)

    @classmethod
    def success(cls, data: Any, lineage_id: Optional[str] = None, data_quality: Optional[Dict[str, Any]] = None):
        dq = MetaDataQuality(**data_quality) if data_quality else MetaDataQuality()
        meta = MetaEnvelope(lineage_id=lineage_id, data_quality=dq)
        return cls(data=data, meta=meta, errors=[])

    @classmethod
    def error(cls, error_messages: List[str]):
        return cls(data=None, meta=MetaEnvelope(), errors=error_messages)
