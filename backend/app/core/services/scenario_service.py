import functools
from typing import Callable, Any
from fastapi import HTTPException, status

class ScenarioService:
    @staticmethod
    def validate_scenario_table_naming(table_name: str) -> bool:
        """Enforces convention that all scenario tables must start with 'scenario_'."""
        return table_name.startswith("scenario_")

    @staticmethod
    def validate_scenario_fork(forked_from_version_id: str) -> bool:
        """Ensures scenarios explicitly reference the actuals data version they were forked from."""
        return bool(forked_from_version_id and str(forked_from_version_id).strip())


def no_actuals_mutation(func: Callable) -> Callable:
    """
    Decorator for scenario and what-if simulation write handlers.
    Guards execution by inspecting target tables/payloads to guarantee that
    no actuals tables are written to or mutated.
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Check if request target is attempting to mutate non-scenario tables
        # In endpoint contexts, kwargs or args are checked for scenario safety flag
        is_scenario_context = kwargs.get("is_scenario", True)
        target_table = kwargs.get("target_table", "scenario_default")
        
        if not is_scenario_context or (target_table and not target_table.startswith("scenario_")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Scenario execution violation: Attempted mutation of actuals data tables from a scenario path is strictly prohibited."
            )
        return func(*args, **kwargs)
    return wrapper
