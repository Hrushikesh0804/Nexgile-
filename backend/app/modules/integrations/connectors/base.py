from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseConnector(ABC):
    @abstractmethod
    def connect(self) -> bool:
        pass

    @abstractmethod
    def fetch_records(self, raw_input: Any = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def validate_schema(self, records: List[Dict[str, Any]]) -> bool:
        pass
