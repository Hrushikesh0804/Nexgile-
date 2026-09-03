from typing import List, Dict, Any
from app.modules.integrations.connectors.base import BaseConnector

class WebhookConnector(BaseConnector):
    def connect(self) -> bool:
        return True

    def fetch_records(self, raw_input: Any = None) -> List[Dict[str, Any]]:
        if isinstance(raw_input, list):
            return raw_input
        elif isinstance(raw_input, dict):
            return [raw_input]
        return []

    def validate_schema(self, records: List[Dict[str, Any]]) -> bool:
        return True
