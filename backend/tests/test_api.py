"""Black-box acceptance test suite for Budget Tracking FastAPI backend.

Verifies API contracts, input-space boundaries, error statuses, and summary calculations
without reading backend implementation logic.
"""

import os
import pytest
from fastapi.testclient import TestClient

# Ensure offline mock mode is active before importing application
os.environ["USE_MOCK_DB"] = "true"

try:
    from backend.main import app
    from backend.database import get_repository, MockFirestoreRepository
except ImportError:
    from main import app
    from database import get_repository, MockFirestoreRepository


@pytest.fixture
def mock_repo():
    """Provides an isolated, in-memory repository instance for each test."""
    repo = MockFirestoreRepository()
    return repo


@pytest.fixture
def client(mock_repo):
    """Provides a FastAPI TestClient configured with isolated in-memory storage."""
    app.dependency_overrides[get_repository] = lambda: mock_repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# 1. Happy Path CRUD Operations
# ==============================================================================


# [AC-1 | SPEC-budget-app | FR-001 | UR-001 | BR-001]
# [AC-1|FR-001] Happy path: POST /api/items creates income item and returns 201 Created.
def test_create_income_item_success(client):
    payload = {
        "description": "Monthly Salary",
        "amount": 3500.00,
        "date": "2026-10-01",
        "type": "income",
    }
    response = client.post("/api/items", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
    assert data["description"] == "Monthly Salary"
    assert data["amount"] == 3500.00
    assert data["date"] == "2026-10-01"
    assert data["type"] == "income"
    assert "created_at" in data
    assert "updated_at" in data


# [AC-1 | SPEC-budget-app | FR-001 | UR-001 | BR-001]
# [AC-1|FR-001] Happy path: POST /api/items creates expense item and returns 201 Created.
def test_create_expense_item_success(client):
    payload = {
        "description": "Groceries",
        "amount": 84.50,
        "date": "2026-10-02",
        "type": "expense",
    }
    response = client.post("/api/items", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["description"] == "Groceries"
    assert data["amount"] == 84.50
    assert data["date"] == "2026-10-02"
    assert data["type"] == "expense"


# [AC-2 | SPEC-budget-app | FR-002 | UR-002 | BR-001]
# [AC-2|FR-002] Happy path: GET /api/items returns all items chronologically ordered descending by date.
def test_list_items_ordered_chronologically(client):
    items_to_create = [
        {"description": "First Day", "amount": 100.00, "date": "2026-10-01", "type": "income"},
        {"description": "Fifth Day", "amount": 50.00, "date": "2026-10-05", "type": "expense"},
        {"description": "Eighth Day", "amount": 200.00, "date": "2026-10-08", "type": "income"},
    ]
    for item in items_to_create:
        res = client.post("/api/items", json=item)
        assert res.status_code == 201

    response = client.get("/api/items")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 3
    # Order must be descending by date
    assert items[0]["date"] == "2026-10-08"
    assert items[1]["date"] == "2026-10-05"
    assert items[2]["date"] == "2026-10-01"


# [AC-3 | SPEC-budget-app | FR-003 | UR-002 | BR-001]
# [AC-3|FR-003] Happy path: GET /api/items/{id} returns single existing item.
def test_get_item_by_id_success(client):
    create_payload = {
        "description": "Internet Bill",
        "amount": 60.00,
        "date": "2026-10-04",
        "type": "expense",
    }
    create_res = client.post("/api/items", json=create_payload)
    assert create_res.status_code == 201
    created_item = create_res.json()
    item_id = created_item["id"]

    response = client.get(f"/api/items/{item_id}")
    assert response.status_code == 200
    item = response.json()
    assert item["id"] == item_id
    assert item["description"] == "Internet Bill"
    assert item["amount"] == 60.00
    assert item["date"] == "2026-10-04"
    assert item["type"] == "expense"


# [AC-4 | SPEC-budget-app | FR-004 | UR-003 | BR-001]
# [AC-4|FR-004] Happy path: PUT /api/items/{id} updates fields and returns 200 OK.
def test_update_item_success(client):
    create_res = client.post(
        "/api/items",
        json={"description": "Groceries", "amount": 50.00, "date": "2026-10-02", "type": "expense"},
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    update_payload = {
        "description": "Weekly Groceries",
        "amount": 65.50,
        "date": "2026-10-03",
        "type": "expense",
    }
    update_res = client.put(f"/api/items/{item_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_item = update_res.json()
    assert updated_item["id"] == item_id
    assert updated_item["description"] == "Weekly Groceries"
    assert updated_item["amount"] == 65.50
    assert updated_item["date"] == "2026-10-03"
    assert updated_item["type"] == "expense"
    assert "updated_at" in updated_item

    # Verify change persists on subsequent GET
    get_res = client.get(f"/api/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["description"] == "Weekly Groceries"
    assert get_res.json()["amount"] == 65.50


# [AC-5 | SPEC-budget-app | FR-005 | UR-004 | BR-001]
# [AC-5|FR-005] Happy path: DELETE /api/items/{id} deletes item and returns 204 No Content.
def test_delete_item_success(client):
    create_res = client.post(
        "/api/items",
        json={"description": "To Be Deleted", "amount": 25.00, "date": "2026-10-02", "type": "expense"},
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    del_res = client.delete(f"/api/items/{item_id}")
    assert del_res.status_code == 204
    assert del_res.text == ""

    # Subsequent GET returns 404
    get_res = client.get(f"/api/items/{item_id}")
    assert get_res.status_code == 404


# [AC-6 | SPEC-budget-app | FR-006 | UR-005 | BR-001]
# [AC-6|FR-006] Happy path: GET /api/summary calculates totals and net balance accurately.
def test_get_summary_populated_store(client):
    items = [
        {"description": "Job Salary", "amount": 2000.00, "date": "2026-10-01", "type": "income"},
        {"description": "Side Gig", "amount": 500.00, "date": "2026-10-05", "type": "income"},
        {"description": "Rent", "amount": 300.00, "date": "2026-10-02", "type": "expense"},
        {"description": "Utilities", "amount": 150.00, "date": "2026-10-06", "type": "expense"},
    ]
    for item in items:
        res = client.post("/api/items", json=item)
        assert res.status_code == 201

    summary_res = client.get("/api/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_income"] == 2500.00
    assert summary["total_expenses"] == 450.00
    assert summary["net_balance"] == 2050.00
    assert summary["item_count"] == 4


# ==============================================================================
# 2. Input Validation Rejections (HTTP 422)
# ==============================================================================


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Negative amount is rejected with HTTP 422.
def test_create_item_negative_amount_rejected(client):
    payload = {
        "description": "Negative Amount",
        "amount": -4.50,
        "date": "2026-10-10",
        "type": "expense",
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Zero amount is rejected with HTTP 422.
def test_create_item_zero_amount_rejected(client):
    payload = {
        "description": "Zero Amount",
        "amount": 0.00,
        "date": "2026-10-10",
        "type": "expense",
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Invalid date format (not YYYY-MM-DD) is rejected with HTTP 422.
@pytest.mark.parametrize(
    "invalid_date",
    [
        "10-10-2026",
        "2026/10/10",
        "2026-1-1",
        "invalid-date",
        "2026-02-30",
        "",
    ],
)
def test_create_item_invalid_date_format_rejected(client, invalid_date):
    payload = {
        "description": "Invalid Date",
        "amount": 25.00,
        "date": invalid_date,
        "type": "expense",
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Invalid transaction type is rejected with HTTP 422.
@pytest.mark.parametrize("invalid_type", ["credit", "debit", "INCOME", "EXPENSE", "", "other"])
def test_create_item_invalid_type_rejected(client, invalid_type):
    payload = {
        "description": "Invalid Type",
        "amount": 100.00,
        "date": "2026-10-05",
        "type": invalid_type,
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Empty or whitespace-only description is rejected with HTTP 422.
@pytest.mark.parametrize("invalid_description", ["", "   ", "\t", "\n"])
def test_create_item_empty_description_rejected(client, invalid_description):
    payload = {
        "description": invalid_description,
        "amount": 25.00,
        "date": "2026-10-10",
        "type": "expense",
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Validation: Extra unpermitted fields are rejected with HTTP 422 (extra="forbid").
def test_create_item_extra_fields_forbidden(client):
    payload = {
        "description": "Valid Description",
        "amount": 50.00,
        "date": "2026-10-10",
        "type": "expense",
        "extra_field": "unauthorized_data",
    }
    response = client.post("/api/items", json=payload)
    assert response.status_code == 422


# [AC-4 | SPEC-budget-app | FR-004 | NFR-003]
# [AC-4|FR-004] Validation: Updating with invalid payload returns 422 and preserves original item.
def test_update_item_invalid_payload_rejected(client):
    create_res = client.post(
        "/api/items",
        json={"description": "Original Item", "amount": 40.00, "date": "2026-10-01", "type": "expense"},
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # Attempt update with negative amount
    update_res = client.put(
        f"/api/items/{item_id}",
        json={"description": "Updated", "amount": -10.00, "date": "2026-10-01", "type": "expense"},
    )
    assert update_res.status_code == 422

    # Verify original record remains intact
    get_res = client.get(f"/api/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["amount"] == 40.00
    assert get_res.json()["description"] == "Original Item"


# [AC-4 | SPEC-budget-app | FR-004 | NFR-003]
# [AC-4|FR-004] Validation: Updating with extra unpermitted fields returns 422.
def test_update_item_extra_fields_forbidden(client):
    create_res = client.post(
        "/api/items",
        json={"description": "Original Item", "amount": 40.00, "date": "2026-10-01", "type": "expense"},
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    update_res = client.put(
        f"/api/items/{item_id}",
        json={
            "description": "Updated",
            "amount": 50.00,
            "date": "2026-10-01",
            "type": "expense",
            "admin_override": True,
        },
    )
    assert update_res.status_code == 422


# ==============================================================================
# 3. Boundary and Error Conditions
# ==============================================================================


# [AC-3 | SPEC-budget-app | FR-003]
# [AC-3|FR-003] Error condition: GET /api/items/{id} for non-existent item returns 404 Not Found.
def test_get_non_existent_item_returns_404(client):
    response = client.get("/api/items/non-existent-id-999")
    assert response.status_code == 404
    assert "detail" in response.json()


# [AC-4 | SPEC-budget-app | FR-004]
# [AC-4|FR-004] Error condition: PUT /api/items/{id} for non-existent item returns 404 Not Found.
def test_update_non_existent_item_returns_404(client):
    payload = {
        "description": "Missing Update",
        "amount": 25.00,
        "date": "2026-10-01",
        "type": "expense",
    }
    response = client.put("/api/items/non-existent-id-999", json=payload)
    assert response.status_code == 404


# [AC-5 | SPEC-budget-app | FR-005]
# [AC-5|FR-005] Error condition: DELETE /api/items/{id} for non-existent item returns 404 Not Found.
def test_delete_non_existent_item_returns_404(client):
    response = client.delete("/api/items/non-existent-id-999")
    assert response.status_code == 404


# [AC-2 | SPEC-budget-app | FR-002]
# [AC-2|FR-002] Boundary condition: GET /api/items on empty store returns empty array [].
def test_list_items_empty_store_returns_empty_list(client):
    response = client.get("/api/items")
    assert response.status_code == 200
    assert response.json() == []


# [AC-6 | SPEC-budget-app | FR-006]
# [AC-6|FR-006] Boundary condition: GET /api/summary on empty store returns 0.00 totals and 0 item_count.
def test_get_summary_empty_store_returns_zeros(client):
    response = client.get("/api/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_income"] == 0.00
    assert summary["total_expenses"] == 0.00
    assert summary["net_balance"] == 0.00
    assert summary["item_count"] == 0


# [AC-6 | SPEC-budget-app | FR-006 | NFR-002]
# [AC-6|FR-006] Boundary condition: Deficit net balance calculation (expenses > income).
def test_get_summary_deficit_balance(client):
    client.post(
        "/api/items",
        json={"description": "Part-time Gig", "amount": 100.00, "date": "2026-10-01", "type": "income"},
    )
    client.post(
        "/api/items",
        json={"description": "Emergency Car Repair", "amount": 350.00, "date": "2026-10-02", "type": "expense"},
    )

    response = client.get("/api/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_income"] == 100.00
    assert summary["total_expenses"] == 350.00
    assert summary["net_balance"] == -250.00
    assert summary["item_count"] == 2


# [AC-6 | SPEC-budget-app | FR-006 | NFR-002]
# [AC-6|FR-006] Boundary condition: Fixed decimal precision prevents floating-point rounding errors.
def test_get_summary_decimal_precision(client):
    # 19.99 + 10.01 = 30.00 income; 5.55 + 4.45 = 10.00 expense; net = 20.00
    client.post("/api/items", json={"description": "Item 1", "amount": 19.99, "date": "2026-10-01", "type": "income"})
    client.post("/api/items", json={"description": "Item 2", "amount": 10.01, "date": "2026-10-02", "type": "income"})
    client.post("/api/items", json={"description": "Item 3", "amount": 5.55, "date": "2026-10-03", "type": "expense"})
    client.post("/api/items", json={"description": "Item 4", "amount": 4.45, "date": "2026-10-04", "type": "expense"})

    response = client.get("/api/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_income"] == 30.00
    assert summary["total_expenses"] == 10.00
    assert summary["net_balance"] == 20.00
    assert summary["item_count"] == 4


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Boundary condition: Maximum allowed description length (255 characters vs 256).
def test_create_item_description_length_boundary(client):
    # 255 characters should succeed
    desc_255 = "A" * 255
    res_255 = client.post(
        "/api/items",
        json={"description": desc_255, "amount": 10.00, "date": "2026-10-01", "type": "expense"},
    )
    assert res_255.status_code == 201

    # 256 characters should be rejected with 422
    desc_256 = "A" * 256
    res_256 = client.post(
        "/api/items",
        json={"description": desc_256, "amount": 10.00, "date": "2026-10-01", "type": "expense"},
    )
    assert res_256.status_code == 422


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Boundary condition: Smallest positive monetary amount (0.01) is accepted.
def test_create_item_minimum_positive_amount(client):
    response = client.post(
        "/api/items",
        json={"description": "One cent test", "amount": 0.01, "date": "2026-10-01", "type": "income"},
    )
    assert response.status_code == 201
    assert response.json()["amount"] == 0.01


# [AC-1 | SPEC-budget-app | FR-001 | NFR-003]
# [AC-1|FR-001] Security-adjacent: Special characters and injection patterns are treated as safe literal text.
@pytest.mark.parametrize(
    "attack_str",
    [
        "'; DROP TABLE budget_items; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "'; EXEC xp_cmdshell('dir'); --",
        "{{ 7 * 7 }}",
    ],
)
def test_create_item_injection_strings_treated_as_literal(client, attack_str):
    response = client.post(
        "/api/items",
        json={"description": attack_str, "amount": 15.00, "date": "2026-10-01", "type": "expense"},
    )
    assert response.status_code == 201
    item = response.json()
    assert item["description"] == attack_str


# ==============================================================================
# 4. CORS Header Verification
# ==============================================================================


# [NFR-006 | SPEC-budget-app | BR-002]
# CORS headers present on HTTP preflight OPTIONS requests.
def test_cors_preflight_options_response(client):
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/api/items", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


# [NFR-006 | SPEC-budget-app | BR-002]
# CORS header present on regular GET request when Origin header is supplied.
def test_cors_header_present_on_get_request(client):
    headers = {"Origin": "http://localhost:3000"}
    response = client.get("/api/items", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
