# [spec-budget-app -> FR-001 -> FR-006] REST API route handlers for budget items and summary
from fastapi import APIRouter, Depends, HTTPException, status

from database import BaseBudgetRepository, get_repository
from models import (
    BudgetItem,
    BudgetItemCreate,
    BudgetItemUpdate,
    BudgetSummary,
)

router = APIRouter(prefix="/api", tags=["budget"])


# [spec-budget-app -> FR-001 -> UR-001 -> NFR-003] Create a new budget transaction
@router.post("/items", response_model=BudgetItem, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: BudgetItemCreate,
    repo: BaseBudgetRepository = Depends(get_repository),
) -> BudgetItem:
    return repo.create_item(payload)


# [spec-budget-app -> FR-002 -> UR-002 -> NFR-007] Retrieve transaction ledger ordered chronologically descending
@router.get("/items", response_model=list[BudgetItem], status_code=status.HTTP_200_OK)
def list_items(
    repo: BaseBudgetRepository = Depends(get_repository),
) -> list[BudgetItem]:
    return repo.list_items()


# [spec-budget-app -> FR-003 -> UR-002] Retrieve a single budget transaction by identifier
@router.get("/items/{id}", response_model=BudgetItem, status_code=status.HTTP_200_OK)
def get_item(
    id: str,
    repo: BaseBudgetRepository = Depends(get_repository),
) -> BudgetItem:
    item = repo.get_item(id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget item not found",
        )
    return item


# [spec-budget-app -> FR-004 -> UR-003 -> NFR-003] Update an existing budget transaction
@router.put("/items/{id}", response_model=BudgetItem, status_code=status.HTTP_200_OK)
def update_item(
    id: str,
    payload: BudgetItemUpdate,
    repo: BaseBudgetRepository = Depends(get_repository),
) -> BudgetItem:
    updated = repo.update_item(id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget item not found",
        )
    return updated


# [spec-budget-app -> FR-005 -> UR-004] Remove a budget transaction permanently
@router.delete("/items/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    id: str,
    repo: BaseBudgetRepository = Depends(get_repository),
) -> None:
    deleted = repo.delete_item(id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget item not found",
        )


# [spec-budget-app -> FR-006 -> UR-005 -> NFR-002] Compute aggregate financial totals
@router.get("/summary", response_model=BudgetSummary, status_code=status.HTTP_200_OK)
def get_summary(
    repo: BaseBudgetRepository = Depends(get_repository),
) -> BudgetSummary:
    return repo.get_summary()
