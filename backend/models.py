# [spec-budget-app -> FR-001 -> NFR-003] Pydantic models and schemas for budget item transactions
from datetime import datetime
from enum import Enum
import re
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# [spec-budget-app -> FR-001 -> NFR-003] Classification enum for transaction direction
class BudgetItemType(str, Enum):
    income = "income"
    expense = "expense"


# [spec-budget-app -> FR-001 -> NFR-003] Base model with validation rules and extra field prohibition
class BudgetItemBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=1, max_length=255)
    amount: float = Field(gt=0.0)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    type: BudgetItemType

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Description must not be empty or whitespace only")
        return stripped

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0.0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date must be in YYYY-MM-DD format")
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as err:
            raise ValueError("Invalid calendar date") from err
        return v


# [spec-budget-app -> FR-001 -> NFR-003] Request schema for creating budget items
class BudgetItemCreate(BudgetItemBase):
    pass


# [spec-budget-app -> FR-004 -> NFR-003] Request schema for updating existing budget items
class BudgetItemUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str | None = Field(default=None, min_length=1, max_length=255)
    amount: float | None = Field(default=None, gt=0.0)
    date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    type: BudgetItemType | None = None

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        if not stripped:
            raise ValueError("Description must not be empty or whitespace only")
        return stripped

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float | None) -> float | None:
        if v is None:
            return None
        if v <= 0.0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str | None) -> str | None:
        if v is None:
            return None
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date must be in YYYY-MM-DD format")
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as err:
            raise ValueError("Invalid calendar date") from err
        return v

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> Self:
        if (
            self.description is None
            and self.amount is None
            and self.date is None
            and self.type is None
        ):
            raise ValueError("At least one field must be provided for update")
        return self


# [spec-budget-app -> FR-001 -> FR-003 -> NFR-001] Persistent budget item document representation
class BudgetItem(BudgetItemCreate):
    id: str
    created_at: str
    updated_at: str


# [spec-budget-app -> FR-006 -> NFR-002] Financial summary aggregation schema
class BudgetSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_income: float = 0.00
    total_expenses: float = 0.00
    net_balance: float = 0.00
    item_count: int = 0
