# Nexgile–DecarbX Platform Architecture & Conventions

This document specifies the platform-wide architecture and coding conventions established in Module 0. Every future module MUST strictly follow these patterns.

---

## 1. Core Principles

1. **Audit Data Lineage**: Every calculated or reported value must carry a lineage record pointing back to its source, formula, factor version, and method.
2. **Reproducibility & Versioning**: Emission factors, formulas, and calculations are versioned. Values are never silently overwritten.
3. **Scenario Isolation**: Forecasts, what-if scenarios, and alternative materials MUST NOT mutate actuals data. Scenarios reside in dedicated models/tables (prefixed `scenario_`), reference `forked_from_version_id`, and write routes use the `@no_actuals_mutation` decorator.
4. **Multi-Tenancy & Query Auto-Scoping**: Data access is scoped to the caller's permitted Organization, Entity, and Facility IDs. Query scoping is automatically applied at the ORM / dependency layer.
5. **Explainable AI & Visible Quality**: Data quality scores (completeness, confidence, validation flags) are attached to response payloads and surfaced visually.

---

## 2. API Response Envelope

All REST endpoints under `/api/v1/` MUST return the standard envelope:

```json
{
  "data": {},
  "meta": {
    "lineage_id": "optional-uuid",
    "data_quality": {
      "completeness_score": 1.0,
      "confidence_score": 0.95,
      "validation_status": "VALIDATED"
    }
  },
  "errors": []
}
```

---

## 3. Database & Model Conventions

Every SQL model representing tenant data MUST inherit from `AuditBase` (`app/models/audit.py`), providing:
- `id` (UUID string / PK)
- `org_id` (UUID / FK to `Organization`, indexed)
- `created_by` (UUID / FK to `User`)
- `created_at` (DateTime UTC)
- `updated_by` (UUID / FK to `User`)
- `updated_at` (DateTime UTC)
- `version` (Integer, incremented on update)

### Mongo Document Linkage
For schema-flexible content stored in MongoDB, documents MUST store a `postgres_ref_id` linking back to the relevant PostgreSQL record to maintain audit lineage across stores.

---

## 4. Shared Services Usage (`app/core/services/`)

All modules MUST import and consume shared services rather than re-implementing logic:

- **LineageService**: `LineageService.create_lineage_record(db, ...)` -> returns `lineage_id`. Records are immutable.
- **DataQualityService**: `DataQualityService.score_completeness(...)`, `score_confidence(...)`, `flag_anomaly(...)`.
- **CalculationGovernanceService**: Versioning for emission factors and formulas. Use `find_affected_calculations(factor_id)` during recalculations.
- **WorkflowService**: Manage `Task`, `Approval`, and `Notification` workflows.
- **ScenarioService**: Guard scenario endpoints using `@no_actuals_mutation`.

---

## 5. Security & RBAC Scoping

Endpoints derive permissions and query scoping via FastAPI dependencies:
- `get_current_user`: Validates JWT token and extracts tenant context (`org_id`, `entity_ids`, `facility_ids`, `role`).
- `require_permission(perm_code)`: Enforces RBAC permissions.
- `get_scoped_query(db, model, user)`: Automatically filters queries by `org_id` and permitted `entity_ids` / `facility_ids`.
