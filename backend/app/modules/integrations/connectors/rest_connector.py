from typing import List, Dict, Any
from app.modules.integrations.connectors.base import BaseConnector

class RESTConnector(BaseConnector):
    def connect(self) -> bool:
        return True

    def fetch_records(self, raw_input: Any = None) -> List[Dict[str, Any]]:
        # REST API pull stub
        return [
            {"facility_code": "fac-001", "scope_type": "Scope 2", "fuel_type": "Grid Electricity", "kwh_used": "19500.0", "unit_type": "kWh"},
            {"facility_code": "fac-001", "scope_type": "Scope 1", "fuel_type": "Natural Gas", "kwh_used": "8400.0", "unit_type": "kWh"}
        ]

    def validate_schema(self, records: List[Dict[str, Any]]) -> bool:
        return True
