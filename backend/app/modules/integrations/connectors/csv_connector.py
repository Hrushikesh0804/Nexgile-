import csv
import io
from typing import List, Dict, Any
from app.modules.integrations.connectors.base import BaseConnector

class CSVConnector(BaseConnector):
    def connect(self) -> bool:
        return True

    def fetch_records(self, raw_input: Any = None) -> List[Dict[str, Any]]:
        if not raw_input:
            # Default fallback sample CSV text
            raw_input = "facility_code,scope_type,fuel_type,kwh_used,unit_type\nfac-001,Scope 1,Natural Gas,14500.0,kWh\nfac-001,Scope 2,Grid Electricity,28000.0,kWh\nfac-001,Scope 1,Diesel Fuel,3200.0,liters"
        
        records = []
        reader = csv.DictReader(io.StringIO(raw_input))
        for row in reader:
            records.append(dict(row))
        return records

    def validate_schema(self, records: List[Dict[str, Any]]) -> bool:
        return len(records) > 0
