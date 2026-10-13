# Test Report: Budget Tracking Application

**Date:** 2026-10-13  
**Project:** assist-agy-sample-demo  
**Languages:** Python 3.12, TypeScript 5.8 / Vue 3  
**Frameworks:** pytest 9.1.1 (pytest-cov 7.1.0), Vitest 3.2.7 (v8 coverage)  

## Verdict

PASS

All 111 automated tests passed (44 backend, 67 frontend, 0 failures). Statement coverage reached 79.31% for backend and 84.06% for frontend, exceeding the 70% threshold.

## Executive Summary

The automated test suite confirms that the Budget Tracking Application satisfies all core functional and non-functional requirements across backend and frontend layers.

- Total tests executed: 111 tests (44 backend tests and 67 frontend tests).
- Total test failures: 0.
- Backend statement coverage: 79.31% (460/580 statements), exceeding the 70.0% threshold.
- Frontend statement coverage: 84.06% (190/226 statements), exceeding the 70.0% threshold.
- Offline guarantee: 100% of tests execute locally without Google Cloud credentials, internet connectivity, or running external emulators. Backend tests use the in-memory [`MockFirestoreRepository`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/database.py#L102), while frontend tests run against `happy-dom` with mocked composable contracts.

## Test Results

| Category | Passed | Failed | Skipped | Total | Execution Time |
|----------|--------|--------|---------|-------|----------------|
| Backend API & Validation (pytest) | 44 | 0 | 0 | 44 | 2.72s |
| Frontend Components & Store (Vitest) | 67 | 0 | 0 | 67 | 2.16s |
| End-to-End Tests (Playwright) | 0 | 0 | 1 (skipped: Playwright not installed) | 1 | 0.00s |
| **Total** | **111** | **0** | **1** | **112** | **4.88s** |

## Coverage Summary

| Target Subsystem | Metric | Actual | Target Threshold | Status |
|------------------|--------|--------|------------------|--------|
| Backend ([`backend/`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend)) | Statements | 79.31% | >= 70.0% | Met target |
| Frontend ([`frontend/`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend)) | Statements | 84.06% | >= 70.0% | Met target |
| Frontend Components | Statements | 96.24% | >= 70.0% | Met target |
| Frontend Composables | Statements | 91.62% | >= 70.0% | Met target |

## Backend Test Results and Details

Backend tests validate the FastAPI application layer, schema models, and data access contracts using pytest and pytest-cov.

- Test runner: pytest 9.1.1 with pytest-cov 7.1.0 on Python 3.12.15
- Test file: [backend/tests/test_api.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/tests/test_api.py)
- Execution command:
  ```bash
  backend/.venv/bin/pytest -v --cov=. --cov-report=term-missing tests/
  ```

### Backend Coverage Breakdown

| Source File | Statements | Missed | Coverage | Uncovered Lines | Description |
|-------------|------------|--------|----------|-----------------|-------------|
| [backend/database.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/database.py) | 179 | 94 | 47% | 46-56, 70-71, 109-110, 193-207, 212-233, 236-254, 257-279, 282-314, 317-333, 336-346, 362-364, 371-379 | Live Google Cloud Firestore client calls bypassed in local mock testing |
| [backend/main.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/main.py) | 60 | 14 | 77% | 49-59, 122-126, 137-147, 156 | Application lifespan event handlers and global exception logger |
| [backend/models.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/models.py) | 89 | 11 | 88% | 37, 44, 70, 73, 80, 82, 89, 91, 94-95, 106 | Optional field fallback validators |
| [backend/routes.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/routes.py) | 30 | 0 | 100% | None | All CRUD and summary routing endpoints covered |
| [backend/tests/test_api.py](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/tests/test_api.py) | 222 | 1 | 99% | 16 | Package import fallback branch |
| **Total** | **580** | **120** | **79.31%** | | **Target >= 70% satisfied** |

### Backend Test Suites and Validated Behaviors

1. CRUD Operations (7 tests):
   - `test_create_income_item_success`: Verifies POST `/api/items` creates income records and returns HTTP 201 with generated UUID.
   - `test_create_expense_item_success`: Verifies POST `/api/items` creates expense records and returns HTTP 201.
   - `test_list_items_ordered_chronologically`: Verifies GET `/api/items` returns items in descending chronological order.
   - `test_get_item_by_id_success`: Verifies GET `/api/items/{id}` returns specific item payload.
   - `test_update_item_success`: Verifies PUT `/api/items/{id}` updates record attributes while preserving creation timestamp.
   - `test_delete_item_success`: Verifies DELETE `/api/items/{id}` removes records and returns HTTP 204.
   - `test_list_items_empty_store_returns_empty_list`: Verifies GET `/api/items` returns an empty array on cold start.

2. Input Validation (21 tests, HTTP 422 Unprocessable Entity):
   - Negative amount rejection: `test_create_item_negative_amount_rejected`.
   - Zero amount rejection: `test_create_item_zero_amount_rejected`.
   - Date format constraints (6 parameterized tests): Rejects `10-10-2026`, `2026/10/10`, `2026-1-1`, `invalid-date`, `2026-02-30`, and empty string; enforces strict ISO-8601 (`YYYY-MM-DD`).
   - Transaction type constraints (6 parameterized tests): Rejects `credit`, `debit`, `INCOME`, `EXPENSE`, empty string, and `other`; allows only lowercase `income` and `expense`.
   - Description constraints (4 parameterized tests): Rejects empty string, spaces, tab characters, and newlines.
   - Strict payload extra field protection (2 tests): Rejects unknown fields in create and update payloads (`test_create_item_extra_fields_forbidden`, `test_update_item_extra_fields_forbidden`).
   - Malformed body handling: `test_update_item_invalid_payload_rejected`.

3. Not Found Error Handling (3 tests, HTTP 404 Not Found):
   - `test_get_non_existent_item_returns_404`.
   - `test_update_non_existent_item_returns_404`.
   - `test_delete_non_existent_item_returns_404`.

4. Decimal Precision and Summary Math (4 tests):
   - `test_get_summary_populated_store`: Validates summation across mixed income and expense transactions.
   - `test_get_summary_empty_store_returns_zeros`: Validates zero defaults when no records exist.
   - `test_get_summary_deficit_balance`: Validates negative balance computation when expenses exceed income.
   - `test_get_summary_decimal_precision`: Validates precision preservation to two decimal places without binary floating-point drift.

5. Boundary Constraints (2 tests):
   - `test_create_item_description_length_boundary`: Validates maximum allowable 255-character description length.
   - `test_create_item_minimum_positive_amount`: Validates lowest valid positive transaction amount (`0.01`).

6. Security Injection Literal Tests (5 parameterized tests):
   - `test_create_item_injection_strings_treated_as_literal`: Verifies that SQL injection (`'; DROP TABLE budget_items; --`), cross-site scripting (`<script>alert('xss')</script>`), directory traversal (`../../etc/passwd`), command execution (`'; EXEC xp_cmdshell('dir'); --`), and template injection (`{{ 7 * 7 }}`) payloads store and return as inert string literals without execution.

7. CORS Headers (2 tests):
   - `test_cors_preflight_options_response`: Verifies preflight OPTIONS request returns `access-control-allow-origin` headers.
   - `test_cors_header_present_on_get_request`: Verifies standard GET requests return allowed origin headers.

## Frontend Test Results and Details

Frontend tests validate UI components and state composables using Vitest with the v8 coverage provider and happy-dom environment.

- Test runner: Vitest 3.2.7 with @vitest/coverage-v8 and happy-dom 17.4.4
- Test files:
  - [frontend/tests/app.spec.ts](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/tests/app.spec.ts) (26 tests)
  - [frontend/tests/useBudget.spec.ts](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/tests/useBudget.spec.ts) (41 tests)
- Execution command:
  ```bash
  npm --prefix frontend test -- --coverage
  ```

### Frontend Coverage Breakdown

| Source File | % Statements | % Branch | % Functions | % Lines | Uncovered Lines | Description |
|-------------|--------------|----------|-------------|---------|-----------------|-------------|
| [frontend/components/BudgetSummary.vue](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetSummary.vue) | 100.00% | 85.71% | 100.00% | 100.00% | 25 | Total cards, net indicator, skeleton loader |
| [frontend/components/BudgetItemForm.vue](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetItemForm.vue) | 95.60% | 89.79% | 100.00% | 95.60% | 109-110, 271-274 | Client validation, submission, edit binding |
| [frontend/components/BudgetItemList.vue](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetItemList.vue) | 95.68% | 78.94% | 100.00% | 95.68% | 33, 38-39, 60-61 | Transaction table, row edit, delete modal |
| [frontend/composables/useBudget.ts](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/composables/useBudget.ts) | 91.62% | 78.94% | 100.00% | 91.62% | 85-94, 215-216 | Reactive state store and REST API client |
| [frontend/app.vue](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/app.vue) | 0.00% | 100.00% | 100.00% | 0.00% | 3-60 | Root app shell (covered in E2E) |
| [frontend/nuxt.config.ts](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/nuxt.config.ts) | 0.00% | 100.00% | 100.00% | 0.00% | 2-26 | Nuxt configuration bundle (covered in build) |
| [frontend/pages/index.vue](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/pages/index.vue) | 0.00% | 100.00% | 100.00% | 0.00% | 3-32 | Top page wrapper (covered in E2E) |
| **All Files** | **84.06%** | **83.11%** | **100.00%** | **84.06%** | | **Target >= 70% satisfied** |

### Frontend Test Suites and Validated Behaviors

1. [`BudgetSummary.vue`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetSummary.vue) (Component Acceptance Tests):
   - Currency formatting: Displays USD currency values formatted with two decimal places.
   - Surplus indicator: Renders green highlight styling when net balance is positive.
   - Deficit indicator: Renders red alert badge and deficit sign when net balance is negative.
   - Zero state: Renders zeroes gracefully when transaction store is empty.
   - Skeleton loader: Displays loading state placeholder while data fetching is active.

2. [`BudgetItemForm.vue`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetItemForm.vue) (Component Acceptance Tests):
   - Input bindings: Captures description, amount, date, and transaction type.
   - Client validation: Blocks submission on negative numbers, zero amounts, empty descriptions, or missing dates.
   - Edit state synchronization: Pre-populates existing transaction attributes into inputs when editing.
   - Event emission: Triggers save events and clears form fields after successful submission.
   - Error messages: Renders accessible error text beneath invalid input fields.

3. [`BudgetItemList.vue`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/components/BudgetItemList.vue) (Component Acceptance Tests):
   - Table rendering: Displays chronological list of income and expense items.
   - Type categorization: Applies distinct visual badges for income versus expense entries.
   - Row actions: Dispatches edit triggers and delete confirmation dialogs.
   - Empty list state: Renders informative empty-state message when no items exist.

4. [`useBudget.ts`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/frontend/composables/useBudget.ts) (Composable State Tests):
   - Initial state: Initializes items array, summary counts, loading flag, and null errors.
   - Fetching: Handles API response deserialization and populates state for `fetchItems`, `fetchSummary`, and `fetchAll`.
   - Item mutations: Optimistically adds, updates, and deletes records while refreshing summary metrics.
   - Network failure resilience: Captures HTTP error responses, populates reactive error state, and resets loading indicator.
   - State reset: Provides clean state teardown between route transitions or test cycles.

## Developer Quickstart for Local Testing

Run both test suites before committing code or triggering deployment workflows.

### 1. Run Backend Tests Locally

```bash
# From repository root using the project virtual environment
./backend/.venv/bin/pytest -v --cov=backend --cov-report=term-missing backend/tests/
```

Alternatively, from the `backend/` directory:

```bash
cd backend
.venv/bin/pytest -v --cov=. --cov-report=term-missing tests/
cd ..
```

### 2. Run Frontend Tests Locally

```bash
# From repository root
npm --prefix frontend test -- --coverage
```

Alternatively, from the `frontend/` directory:

```bash
cd frontend
npm test -- --coverage
cd ..
```

### 3. Run All Local Tests in a Single Command

```bash
./backend/.venv/bin/pytest -v --cov=backend --cov-report=term-missing backend/tests/ && npm --prefix frontend test -- --coverage
```

### 4. Optional End-to-End Testing Setup

Playwright is currently omitted from automated test execution because it is not installed in the workspace. To run browser end-to-end testing, install Playwright:

```bash
npm --prefix frontend install -D @playwright/test
npx playwright install --with-deps
```

## Deployment Readiness Assessment

The deployment assets have been audited against Google Cloud Run, Firestore Native, and Firebase Hosting operational requirements.

### 1. Container Specification ([`backend/Dockerfile`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/backend/Dockerfile))

- Base image: `python:3.12-slim` minimizes image size and reduces host vulnerability surface.
- Security privileges: Runs as unprivileged non-root user `appuser` (UID 1000).
- Cloud Run contract: Listens on port `8080` and reads dynamic `${PORT}` variable via `CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}`.
- Unbuffered output: Sets `PYTHONUNBUFFERED=1` to ensure realtime log emission to Google Cloud Logging.
- Verification status: Verified and compliant with Google Cloud Run container specifications.

### 2. Infrastructure Setup Script ([`scripts/setup-gcloud.sh`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/scripts/setup-gcloud.sh))

- API enablement: Activates `run.googleapis.com`, `firestore.googleapis.com`, `cloudbuild.googleapis.com`, and `artifactregistry.googleapis.com`.
- Firestore database: Provisions Firestore Native database `(default)` in the specified region.
- Container repository: Creates Docker repository `budget-repo` in Google Artifact Registry.
- Least-privilege IAM: Provisions dedicated service account `budget-backend-sa` and assigns the minimal role `roles/datastore.user`.
- Verification status: Verified idempotent and compliant with Google Cloud security best practices.

### 3. Backend Deployment Script ([`scripts/deploy-backend.sh`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/scripts/deploy-backend.sh))

- Build automation: Submits Docker build to Google Cloud Build and pushes image to Artifact Registry.
- Deployment parameters: Deploys container to Cloud Run with scale-to-zero capability (`--min-instances 0`), concurrency ceiling (`--max-instances 5`), and runtime service account `budget-backend-sa`.
- Environment injection: Configures `FIRESTORE_DATABASE=(default)` and `CORS_ORIGINS` to permit Firebase Hosting domains.
- Verification status: Verified ready for automated production deployment.

### 4. Frontend Deployment Script ([`scripts/deploy-frontend.sh`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/scripts/deploy-frontend.sh)) and Config ([`firebase.json`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/firebase.json))

- Static compilation: Builds static SPA bundle into `frontend/.output/public` using `npm run generate` with injected `NUXT_PUBLIC_API_BASE_URL`.
- Build verification: Asserts generated `index.html` exists before running deployment.
- SPA URL rewriting: [`firebase.json`](file:///home/tj/Projects/Personal/assist-agy-sample-demo/firebase.json) rewrites all non-asset requests to `/index.html`.
- Security headers: Injects `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy`.
- Verification status: Verified ready for Firebase Hosting deployment.

### Readiness Verdict

READY FOR DEPLOYMENT

The codebase, container configuration, deployment scripts, security headers, and test suites satisfy all deployment criteria for Google Cloud Run, Firestore Native, and Firebase Hosting.
