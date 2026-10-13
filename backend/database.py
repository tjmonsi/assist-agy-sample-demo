# [spec-budget-app -> BR-002 -> BR-003 -> FR-001 -> NFR-001 -> NFR-009] Persistence repositories for budget items
from abc import ABC, abstractmethod
from datetime import datetime, timezone
import json
import logging
import os
import threading
import uuid

from models import (
    BudgetItem,
    BudgetItemCreate,
    BudgetItemType,
    BudgetItemUpdate,
    BudgetSummary,
)

# Structured JSON logging formatter per assist-plugin logging standards
class _JSONFormatter(logging.Formatter):
    _STANDARD_ATTRS = {
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "process",
        "taskName",
        "message",
    }

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in self._STANDARD_ATTRS and not key.startswith("_"):
                log_entry[key] = value
        if record.exc_info:
            log_entry["stack"] = self.formatException(record.exc_info)
        return json.dumps(log_entry, default=str)


logger = logging.getLogger("budget.database")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(_JSONFormatter())
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


# [spec-budget-app -> NFR-007] Domain exception for persistent storage failures
class DatabaseServiceError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


# [spec-budget-app -> FR-001 -> FR-006] Abstract repository interface for budget items
class BaseBudgetRepository(ABC):
    @abstractmethod
    def list_items(self) -> list[BudgetItem]:
        """Retrieve all budget items ordered chronologically descending by date."""

    @abstractmethod
    def get_item(self, id: str) -> BudgetItem | None:
        """Retrieve a single budget item by identifier, returning None if missing."""

    @abstractmethod
    def create_item(self, data: BudgetItemCreate) -> BudgetItem:
        """Persist a new budget item and return the created record."""

    @abstractmethod
    def update_item(self, id: str, data: BudgetItemUpdate) -> BudgetItem | None:
        """Update an existing budget item, returning None if not found."""

    @abstractmethod
    def delete_item(self, id: str) -> bool:
        """Delete an item by identifier, returning True on success and False if missing."""

    @abstractmethod
    def get_summary(self) -> BudgetSummary:
        """Compute aggregate summary totals across all recorded items."""


# [spec-budget-app -> BR-003 -> UR-006 -> NFR-009] Thread-safe in-memory mock repository for offline execution
class MockFirestoreRepository(BaseBudgetRepository):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._items: dict[str, BudgetItem] = {}

    def clear(self) -> None:
        """Reset internal store state for test isolation."""
        with self._lock:
            self._items.clear()

    def list_items(self) -> list[BudgetItem]:
        with self._lock:
            # Sort chronologically descending by date; fall back to created_at
            return sorted(
                self._items.values(),
                key=lambda item: (item.date, item.created_at),
                reverse=True,
            )

    def get_item(self, id: str) -> BudgetItem | None:
        with self._lock:
            return self._items.get(id)

    def create_item(self, data: BudgetItemCreate) -> BudgetItem:
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        item_id = str(uuid.uuid4())
        item = BudgetItem(
            id=item_id,
            description=data.description,
            amount=data.amount,
            date=data.date,
            type=data.type,
            created_at=now_iso,
            updated_at=now_iso,
        )
        with self._lock:
            self._items[item_id] = item
        return item

    def update_item(self, id: str, data: BudgetItemUpdate) -> BudgetItem | None:
        with self._lock:
            existing = self._items.get(id)
            if existing is None:
                return None

            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            updated_item = BudgetItem(
                id=existing.id,
                description=data.description if data.description is not None else existing.description,
                amount=data.amount if data.amount is not None else existing.amount,
                date=data.date if data.date is not None else existing.date,
                type=data.type if data.type is not None else existing.type,
                created_at=existing.created_at,
                updated_at=now_iso,
            )
            self._items[id] = updated_item
            return updated_item

    def delete_item(self, id: str) -> bool:
        with self._lock:
            if id in self._items:
                del self._items[id]
                return True
            return False

    def get_summary(self) -> BudgetSummary:
        with self._lock:
            items = list(self._items.values())

        total_income = round(
            sum(item.amount for item in items if item.type == BudgetItemType.income),
            2,
        )
        total_expenses = round(
            sum(item.amount for item in items if item.type == BudgetItemType.expense),
            2,
        )
        net_balance = round(total_income - total_expenses, 2)
        return BudgetSummary(
            total_income=total_income,
            total_expenses=total_expenses,
            net_balance=net_balance,
            item_count=len(items),
        )


# [spec-budget-app -> BR-002 -> NFR-001 -> NFR-012] Production repository targeting Google Cloud Firestore Native
class FirestoreRepository(BaseBudgetRepository):
    COLLECTION_NAME = "budget_items"

    def __init__(self, database: str | None = None) -> None:
        try:
            from google.cloud import firestore

            db_name = database or os.getenv("FIRESTORE_DATABASE", "(default)")
            self._client = firestore.Client(database=db_name)
            self._collection = self._client.collection(self.COLLECTION_NAME)
        except Exception as err:
            logger.error(
                "Failed to initialize Firestore client",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                },
            )
            raise DatabaseServiceError(
                "Unable to connect to Google Cloud Firestore"
            ) from err

    def list_items(self) -> list[BudgetItem]:
        try:
            from google.cloud import firestore

            query = self._collection.order_by(
                "date", direction=firestore.Query.DESCENDING
            )
            docs = query.stream()
            items: list[BudgetItem] = []
            for doc in docs:
                doc_data = doc.to_dict()
                if doc_data:
                    items.append(BudgetItem(**doc_data))
            return items
        except Exception as err:
            logger.error(
                "Firestore list_items operation failed",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                },
            )
            raise DatabaseServiceError("Failed to list budget items from storage") from err

    def get_item(self, id: str) -> BudgetItem | None:
        try:
            doc_ref = self._collection.document(id)
            snapshot = doc_ref.get()
            if not snapshot.exists:
                return None
            data = snapshot.to_dict()
            if not data:
                return None
            return BudgetItem(**data)
        except Exception as err:
            logger.error(
                "Firestore get_item operation failed",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                    "item_id": id,
                },
            )
            raise DatabaseServiceError(f"Failed to retrieve item {id} from storage") from err

    def create_item(self, data: BudgetItemCreate) -> BudgetItem:
        try:
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            item_id = str(uuid.uuid4())
            item = BudgetItem(
                id=item_id,
                description=data.description,
                amount=data.amount,
                date=data.date,
                type=data.type,
                created_at=now_iso,
                updated_at=now_iso,
            )
            self._collection.document(item_id).set(item.model_dump())
            return item
        except Exception as err:
            logger.error(
                "Firestore create_item operation failed",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                },
            )
            raise DatabaseServiceError("Failed to persist budget item") from err

    def update_item(self, id: str, data: BudgetItemUpdate) -> BudgetItem | None:
        try:
            doc_ref = self._collection.document(id)
            snapshot = doc_ref.get()
            if not snapshot.exists:
                return None

            existing_data = snapshot.to_dict()
            if not existing_data:
                return None

            existing = BudgetItem(**existing_data)
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            updated_item = BudgetItem(
                id=existing.id,
                description=data.description if data.description is not None else existing.description,
                amount=data.amount if data.amount is not None else existing.amount,
                date=data.date if data.date is not None else existing.date,
                type=data.type if data.type is not None else existing.type,
                created_at=existing.created_at,
                updated_at=now_iso,
            )
            doc_ref.set(updated_item.model_dump())
            return updated_item
        except Exception as err:
            logger.error(
                "Firestore update_item operation failed",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                    "item_id": id,
                },
            )
            raise DatabaseServiceError(f"Failed to update item {id}") from err

    def delete_item(self, id: str) -> bool:
        try:
            doc_ref = self._collection.document(id)
            snapshot = doc_ref.get()
            if not snapshot.exists:
                return False
            doc_ref.delete()
            return True
        except Exception as err:
            logger.error(
                "Firestore delete_item operation failed",
                extra={
                    "error_type": type(err).__name__,
                    "error_message": str(err),
                    "item_id": id,
                },
            )
            raise DatabaseServiceError(f"Failed to delete item {id}") from err

    def get_summary(self) -> BudgetSummary:
        items = self.list_items()
        total_income = round(
            sum(item.amount for item in items if item.type == BudgetItemType.income),
            2,
        )
        total_expenses = round(
            sum(item.amount for item in items if item.type == BudgetItemType.expense),
            2,
        )
        net_balance = round(total_income - total_expenses, 2)
        return BudgetSummary(
            total_income=total_income,
            total_expenses=total_expenses,
            net_balance=net_balance,
            item_count=len(items),
        )


# Singleton instances for in-memory and shared usage
_mock_repository_instance: MockFirestoreRepository | None = None
_prod_repository_instance: FirestoreRepository | None = None


def get_mock_repository() -> MockFirestoreRepository:
    """Retrieve shared in-memory mock repository instance."""
    global _mock_repository_instance
    if _mock_repository_instance is None:
        _mock_repository_instance = MockFirestoreRepository()
    return _mock_repository_instance


# [spec-budget-app -> BR-003 -> UR-006 -> NFR-009] Dependency injection provider for FastAPI endpoints
def get_repository() -> BaseBudgetRepository:
    """Provide budget repository instance based on configuration."""
    global _prod_repository_instance
    use_mock = os.getenv("USE_MOCK_DB", "").lower() in ("true", "1", "yes")
    if use_mock:
        return get_mock_repository()

    if _prod_repository_instance is not None:
        return _prod_repository_instance

    _prod_repository_instance = FirestoreRepository()
    return _prod_repository_instance
