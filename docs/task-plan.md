# Task Plan: Budget Tracking Full-Stack Application

**Target Language:** Python 3.12 / TypeScript  
**Target Framework:** FastAPI (Backend) / Nuxt 4 & Vue 3 (Frontend)  
**Deployment Infrastructure:** Google Cloud Run, Firebase Hosting, Firestore Native  
**Generated:** 2026-10-13 16:20:00 UTC  

---

## Specification Summary

- **Spec ID:** `spec-budget-app` ([specs/budget-app-spec.md](file:///home/tj/Projects/Personal/assist-agy-sample-demo/specs/budget-app-spec.md))
- **Requirements Document:** [docs/requirements.md](file:///home/tj/Projects/Personal/assist-agy-sample-demo/docs/requirements.md)
- **Linked Requirements:**
  - Business Requirements: `BR-001`, `BR-002`, `BR-003`, `BR-004`
  - User Requirements: `UR-001`, `UR-002`, `UR-003`, `UR-004`, `UR-005`, `UR-006`, `UR-007`
  - Functional Requirements: `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-005`, `FR-006`, `FR-007`, `FR-008`, `FR-009`, `FR-010`, `FR-011`, `FR-012`
  - Non-Functional Requirements: `NFR-001`, `NFR-002`, `NFR-003`, `NFR-004`, `NFR-005`, `NFR-006`, `NFR-007`, `NFR-008`, `NFR-009`, `NFR-010`, `NFR-011`, `NFR-012`, `NFR-013`
- **Use Cases:** `UC-001` (Add Budget Item), `UC-002` (View Transaction Ledger), `UC-003` (Update Budget Item), `UC-004` (Delete Budget Item), `UC-005` (View Financial Summary)

A serverless full-stack budget tracking application enabling personal transaction recording, real-time balance aggregation, and full lifecycle ledger management via a FastAPI backend on Google Cloud Run, a Nuxt 4 frontend on Firebase Hosting, and Firestore in Native mode, with an offline in-memory persistence layer for local testing.

---

## Acceptance Criteria

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Successful Item Creation (Happy Path) | Valid payload with description "Monthly Salary", amount 3500.00, date "2026-10-01", type "income" | Client submits `POST /api/items` | Returns HTTP 201 Created with generated UUID id, timestamps, and persists to Firestore collection `budget_items` [FR-001, NFR-001] |
| Rejection of Invalid Transaction Type | Payload with description "Bonus", amount 500.00, date "2026-10-05", type "credit" | Client submits `POST /api/items` | Returns HTTP 422 Unprocessable Entity specifying type must be "income" or "expense" [FR-001, NFR-003] |
| Rejection of Zero or Negative Amount | Payload with description "Coffee", amount -4.50, date "2026-10-10", type "expense" | Client submits `POST /api/items` | Returns HTTP 422 Unprocessable Entity specifying amount must be greater than zero [FR-001, NFR-003] |
| Rejection of Blank Description or Malformed Date | Payload with description "   ", amount 25.00, date "10-10-2026", type "expense" | Client submits `POST /api/items` | Returns HTTP 422 Unprocessable Entity listing validation errors [FR-001, NFR-003] |
| Retrieve Populated Transaction List | Firestore contains 3 items with dates "2026-10-01", "2026-10-05", "2026-10-08" | Client submits `GET /api/items` | Returns HTTP 200 OK with JSON array ordered chronologically descending by date [FR-002, NFR-007] |
| Retrieve Empty Transaction List | Firestore collection contains zero items | Client submits `GET /api/items` | Returns HTTP 200 OK with empty array `[]` [FR-002] |
| Retrieve Single Budget Item | Existing budget item with identifier "item-123" exists in Firestore | Client submits `GET /api/items/item-123` | Returns HTTP 200 OK with item object [FR-003] |
| Request Non-Existent Budget Item | Identifier "item-999" does not exist | Client submits `GET /api/items/item-999` | Returns HTTP 404 Not Found with error detail message [FR-003] |
| Successful Budget Item Update | Existing item "item-123" has amount 50.00 and description "Groceries" | Client submits `PUT /api/items/item-123` with amount 65.50 and description "Weekly Groceries" | Returns HTTP 200 OK with updated attributes and refreshed `updated_at` timestamp [FR-004] |
| Update Non-Existent Budget Item | Identifier "item-missing" does not exist | Client submits `PUT /api/items/item-missing` with valid payload | Returns HTTP 404 Not Found [FR-004] |
| Update with Invalid Payload | Existing item "item-123" | Client submits `PUT /api/items/item-123` with amount -10.00 | Returns HTTP 422 Unprocessable Entity; record remains unchanged [FR-004, NFR-003] |
| Successful Budget Item Deletion | Existing item "item-123" exists in Firestore | Client submits `DELETE /api/items/item-123` | Returns HTTP 204 No Content; subsequent GET returns HTTP 404 [FR-005] |
| Delete Non-Existent Budget Item | Identifier "item-999" does not exist | Client submits `DELETE /api/items/item-999` | Returns HTTP 404 Not Found [FR-005] |
| Accurate Summary Calculation | Store contains income (2000.00, 500.00) and expenses (300.00, 150.00) | Client submits `GET /api/summary` | Returns HTTP 200 OK with `total_income: 2500.00`, `total_expenses: 450.00`, `net_balance: 2050.00`, `item_count: 4` [FR-006, NFR-002] |
| Summary on Empty Store | Store contains zero items | Client submits `GET /api/summary` | Returns HTTP 200 OK with zeroes for all totals and `item_count: 0` [FR-006] |
| Deficit Net Balance Calculation | Store contains income of 100.00 and expenses of 350.00 | Client submits `GET /api/summary` | Returns HTTP 200 OK with `total_income: 100.00`, `total_expenses: 350.00`, `net_balance: -250.00` [FR-006, NFR-002] |
| Frontend Form Submission | User enters description "Internet Bill", amount "60.00", date "2026-10-13", type "expense" | User clicks submit button | Frontend submits `POST /api/items`, resets form on HTTP 201, and refreshes ledger [FR-007, UR-001] |
| Frontend Client-Side Validation | User leaves description blank and amount at 0 | User clicks submit button | Form halts submission and renders inline validation error messages [FR-007, NFR-003] |
| Render Items with Type Styling | Backend returns one income item and one expense item | Frontend renders item list | Income renders with green indicator/badge; expense renders with red indicator/badge [FR-008, UR-002] |
| Confirm Item Deletion | User clicks "Delete" on transaction row | User confirms dialog | Frontend issues `DELETE /api/items/{id}`, removes row, and refreshes summary [FR-008, UR-004] |
| Dynamic Summary Refresh | Current balance is 500.00 | User adds expense of 100.00 | Summary card updates: total expenses increments by 100.00, net balance updates to 400.00 [FR-009, UR-005] |
| Clean GCP Environment Provisioning | Authenticated gcloud environment with `PROJECT_ID` | Operator executes `bash scripts/setup-gcloud.sh` | Enables APIs, creates Firestore Native mode, Artifact Registry repo, service account with `roles/datastore.user`, exits 0 [FR-010, NFR-012] |
| Missing Project ID Detection | Environment variable `PROJECT_ID` unset and no active project | Operator executes `bash scripts/setup-gcloud.sh` | Prints error message to stderr and terminates with non-zero exit code [FR-010] |
| Backend Deployment Execution | `backend/Dockerfile` and backend code present | Operator executes `bash scripts/deploy-backend.sh` | Builds container via Cloud Build, deploys to Cloud Run with `--min-instances 0`, prints service URL [FR-011, NFR-004] |
| Frontend Deployment Execution | Nuxt code and `firebase.json` present | Operator executes `bash scripts/deploy-frontend.sh` | Builds static assets via `npm --prefix frontend run generate`, deploys to Firebase Hosting, prints URL [FR-012, NFR-005] |

---

## Implementation Steps

### Phase 1: Backend Implementation Tasks (`backend/`)

#### Step 1: Project Setup and Backend Dependencies
- **Files:** `backend/requirements.txt` (create)
- **Satisfies:** [BR-002, BR-003, UR-006, FR-001, NFR-001, NFR-004, NFR-009, NFR-011]
- **Code references:** `languages/python.md`, `frameworks/fastapi.md`
- **Implementation details:**
  1. Define production dependencies:
     - `fastapi>=0.110.0` (asynchronous REST API framework)
     - `uvicorn[standard]>=0.29.0` (ASGI web server for Cloud Run container execution)
     - `pydantic>=2.6.0` (data validation and serialization)
     - `google-cloud-firestore>=2.15.0` (Google Cloud Firestore Native mode client SDK)
  2. Define testing and development dependencies:
     - `httpx>=0.27.0` (asynchronous HTTP client for FastAPI TestClient)
     - `pytest>=8.1.0` (offline test runner)
     - `pytest-cov>=5.0.0` (coverage reporting for statement and branch verification)
     - `pytest-asyncio>=0.23.0` (async test execution support)
- **Verification / Acceptance Criteria:**
  - File exists at `backend/requirements.txt`.
  - Dependencies pin compatible version ranges supporting Python 3.12 without version conflicts.

---

#### Step 2: Pydantic Data Models and Validation Schemas
- **Files:** `backend/models.py` (create)
- **Satisfies:** [BR-001, UR-001, UR-003, FR-001, FR-004, FR-006, NFR-002, NFR-003]
- **Code references:** `languages/python.md`, `frameworks/fastapi.md`, `patterns/python/rest-crud.md`
- **Implementation details:**
  1. Define transaction classification enum `BudgetItemType(str, Enum)` with values `"income"` and `"expense"`.
  2. Implement `BudgetItemBase(BaseModel)` with strict configuration `model_config = ConfigDict(extra="forbid")`:
     - `description: str` with constraints `min_length=1`, `max_length=255`, and field validator stripping leading/trailing whitespace and rejecting whitespace-only strings.
     - `amount: float` with constraint `gt=0.0`, rounded explicitly to 2 decimal places (`round(v, 2)`).
     - `date: str` validated with regex pattern `^\d{4}-\d{2}-\d{2}$` and calendar validity check (`datetime.strptime(v, "%Y-%m-%d")`).
     - `type: BudgetItemType` constraining value strictly to `"income"` or `"expense"`.
  3. Implement `BudgetItemCreate(BudgetItemBase)` for item creation requests.
  4. Implement `BudgetItemUpdate(BudgetItemBase)` for item update requests.
  5. Implement `BudgetItem(BudgetItemBase)` representing persistent documents:
     - `id: str` (UUID v4 string identifier).
     - `created_at: str` (ISO 8601 UTC timestamp `YYYY-MM-DDTHH:MM:SSZ`).
     - `updated_at: str` (ISO 8601 UTC timestamp `YYYY-MM-DDTHH:MM:SSZ`).
  6. Implement `BudgetSummary(BaseModel)` with `model_config = ConfigDict(extra="forbid")`:
     - `total_income: float` (default `0.00`, rounded to 2 decimal places).
     - `total_expenses: float` (default `0.00`, rounded to 2 decimal places).
     - `net_balance: float` (default `0.00`, rounded to 2 decimal places).
     - `item_count: int` (default `0`).
- **Verification / Acceptance Criteria:**
  - Instantiating models with invalid attributes, negative amounts, undeclared fields, empty descriptions, or malformed dates raises `pydantic.ValidationError`.
  - Serialized outputs match schemas in `specs/budget-app-spec.md` Section: RESTful API Specification.

---

#### Step 3: Firestore Native Repository and Offline In-Memory Mock
- **Files:** `backend/database.py` (create)
- **Satisfies:** [BR-002, BR-003, UR-006, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-009, NFR-012, NFR-013]
- **Code references:** `languages/python.md`, `error-handling-standards.md`, `logging-standards.md`
- **Implementation details:**
  1. Define abstract base class `BaseBudgetRepository(ABC)` specifying synchronous or async interface:
     - `list_items() -> list[BudgetItem]`
     - `get_item(item_id: str) -> BudgetItem | None`
     - `create_item(data: BudgetItemCreate) -> BudgetItem`
     - `update_item(item_id: str, data: BudgetItemUpdate) -> BudgetItem | None`
     - `delete_item(item_id: str) -> bool`
  2. Implement `MockFirestoreRepository(BaseBudgetRepository)`:
     - Maintain internal dictionary `dict[str, dict]` storing item records in RAM.
     - Generate UUID v4 for new items and attach ISO UTC `created_at` / `updated_at` timestamps.
     - Implement chronological sorting descending by `date` on `list_items()`.
     - Execute 100% in-process without Google Cloud credentials, internet connectivity, or emulator prerequisites.
  3. Implement `FirestoreRepository(BaseBudgetRepository)`:
     - Initialize `google.cloud.firestore.Client` with database `(default)` and root collection `budget_items`.
     - Translate between Firestore document dictionaries and `BudgetItem` Pydantic models.
     - Execute `order_by("date", direction=firestore.Query.DESCENDING)` for listing.
     - Catch `GoogleAPICallError` exceptions and re-raise structured domain storage exceptions.
  4. Implement repository dependency provider `get_repository() -> BaseBudgetRepository`:
     - Inspect environment variable `USE_MOCK_DB` or test override context. If `USE_MOCK_DB=="true"` or test fixture active, return singleton/scoped instance of `MockFirestoreRepository`; otherwise instantiate `FirestoreRepository`.
- **Verification / Acceptance Criteria:**
  - `MockFirestoreRepository` passes all CRUD operations in memory without network calls.
  - `FirestoreRepository` maps fields accurately to `budget_items` collection schema.

---

#### Step 4: RESTful Route Handlers and Summary Calculation Logic
- **Files:** `backend/routes.py` (create)
- **Satisfies:** [BR-001, UR-001, UR-002, UR-003, UR-004, UR-005, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-002, NFR-003, NFR-007]
- **Code references:** `languages/python.md`, `frameworks/fastapi.md`, `patterns/python/rest-crud.md`, `error-handling-standards.md`
- **Implementation details:**
  1. Create FastAPI `APIRouter(prefix="/api", tags=["budget"])`.
  2. Implement `POST /api/items`:
     - Status code: `201 Created`, response model: `BudgetItem`.
     - Accepts `BudgetItemCreate`. Invokes `repo.create_item(item)`. Returns persisted `BudgetItem`.
  3. Implement `GET /api/items`:
     - Status code: `200 OK`, response model: `list[BudgetItem]`.
     - Invokes `repo.list_items()`. Returns items ordered by date descending. Returns `[]` on empty store.
  4. Implement `GET /api/items/{id}`:
     - Status code: `200 OK`, response model: `BudgetItem`.
     - Invokes `repo.get_item(id)`. Raises `HTTPException(status_code=404, detail="Budget item not found")` if missing.
  5. Implement `PUT /api/items/{id}`:
     - Status code: `200 OK`, response model: `BudgetItem`.
     - Accepts `BudgetItemUpdate`. Invokes `repo.update_item(id, item)`. Raises 404 HTTPException if missing.
  6. Implement `DELETE /api/items/{id}`:
     - Status code: `204 No Content`.
     - Invokes `repo.delete_item(id)`. Raises 404 HTTPException if missing. Returns empty body on success.
  7. Implement `GET /api/summary`:
     - Status code: `200 OK`, response model: `BudgetSummary`.
     - Invokes `repo.list_items()`.
     - Computes:
       - `total_income = round(sum(i.amount for i in items if i.type == BudgetItemType.income), 2)`
       - `total_expenses = round(sum(i.amount for i in items if i.type == BudgetItemType.expense), 2)`
       - `net_balance = round(total_income - total_expenses, 2)`
       - `item_count = len(items)`
     - Returns `BudgetSummary` object. Handles empty list returning `0.00` totals and `item_count: 0`.
- **Verification / Acceptance Criteria:**
  - Routes return exact HTTP status codes (201, 200, 204, 404, 422).
  - Summary math produces 100% accurate net balance across positive, zero, and deficit scenarios.

---

#### Step 5: Application Entrypoint, CORS Middleware, and Error Handlers
- **Files:** `backend/main.py` (create)
- **Satisfies:** [BR-002, UR-001, FR-001, NFR-004, NFR-006, NFR-007, NFR-013]
- **Code references:** `languages/python.md`, `frameworks/fastapi.md`, `error-handling-standards.md`, `logging-standards.md`
- **Implementation details:**
  1. Instantiate `FastAPI` application with title `"Budget Tracking API"`, version `"1.0.0"`.
  2. Configure `CORSMiddleware`:
     - Read allowed origins from `CORS_ORIGINS` environment variable (comma-separated string).
     - Default allowed origins: `["http://localhost:3000", "http://127.0.0.1:3000"]`.
     - Support wildcard origins or explicit production Firebase Hosting domains when configured.
     - Allow methods `["*"]`, headers `["*"]`, allow credentials `True`.
  3. Register global exception handlers:
     - Exception handler for database connection/storage failures (`GoogleAPICallError` or custom storage exception): log diagnostic traceback and return HTTP 503 with `{"detail": "Database service unavailable. Please retry."}`.
     - Exception handler for unhandled exceptions: return HTTP 500 with structured JSON error.
  4. Implement `GET /health` endpoint returning `{"status": "healthy"}` for Cloud Run health checks.
  5. Include `routes.router` into the application.
- **Verification / Acceptance Criteria:**
  - Running `uvicorn main:app` starts without errors.
  - OPTIONS preflight request to `/api/items` with `Origin: http://localhost:3000` returns HTTP 200 with matching CORS response headers.
  - `GET /health` returns HTTP 200 OK.

---

#### Step 6: Backend Containerization Specification
- **Files:** `backend/Dockerfile` (create), `backend/.dockerignore` (create)
- **Satisfies:** [BR-002, UR-007, FR-011, NFR-004, NFR-007, NFR-013]
- **Code references:** `languages/python.md`
- **Implementation details:**
  1. Create `backend/.dockerignore` excluding `.git`, `__pycache__`, `*.pyc`, `.pytest_cache`, `.venv`, and `tests/`.
  2. Implement `backend/Dockerfile`:
     - Base image: `python:3.12-slim`.
     - Environment variables: `PYTHONUNBUFFERED=1`, `PORT=8080`.
     - Set working directory to `/app`.
     - Copy `requirements.txt` and install via `pip install --no-cache-dir -r requirements.txt`.
     - Copy backend source files (`main.py`, `models.py`, `database.py`, `routes.py`).
     - Expose port `8080`.
     - Set container execution CMD using shell form to dynamically bind to `${PORT:-8080}`:
       `CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}`.
- **Verification / Acceptance Criteria:**
  - Dockerfile builds successfully into a standalone container image under 150MB.
  - Container executes as non-root or minimal footprint and responds on assigned `$PORT`.

---

#### Step 7: Offline Backend Test Suite
- **Files:** `backend/tests/test_api.py` (create), `backend/tests/__init__.py` (create)
- **Satisfies:** [BR-003, UR-006, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-002, NFR-003, NFR-006, NFR-009, NFR-011]
- **Code references:** `languages/python.md`, `frameworks/fastapi.md`, `patterns/python/rest-crud.md`
- **Implementation details:**
  1. Configure pytest fixture injecting `MockFirestoreRepository` into FastAPI's `get_repository` dependency override via `app.dependency_overrides`.
  2. Test `POST /api/items`:
     - Successful creation returning HTTP 201, UUID `id`, and identical attributes.
     - 422 on negative amount (`amount: -10.0`).
     - 422 on zero amount (`amount: 0.0`).
     - 422 on invalid type (`type: "credit"`).
     - 422 on blank description (`description: "   "`).
     - 422 on malformed date (`date: "2026/10/10"`).
     - 422 on extra undeclared fields (`extra_field: "value"`).
  3. Test `GET /api/items`:
     - Returns empty list `[]` when repository is empty.
     - Returns items sorted chronologically descending by date.
  4. Test `GET /api/items/{id}`:
     - Returns matching item with HTTP 200.
     - Returns HTTP 404 on missing item ID.
  5. Test `PUT /api/items/{id}`:
     - Updates description, amount, date, type and returns HTTP 200 with refreshed `updated_at`.
     - Returns HTTP 404 on missing item ID.
     - Returns HTTP 422 on invalid updated payload.
  6. Test `DELETE /api/items/{id}`:
     - Returns HTTP 204 No Content on existing item; verifies item is purged from subsequent `GET`.
     - Returns HTTP 404 on non-existent item ID.
  7. Test `GET /api/summary`:
     - Empty ledger: returns `total_income: 0.0`, `total_expenses: 0.0`, `net_balance: 0.0`, `item_count: 0`.
     - Populated ledger: income (2000.00, 500.00), expenses (300.00, 150.00) yields income 2500.00, expenses 450.00, net 2050.00, count 4.
     - Deficit scenario: income 100.00, expenses 350.00 yields net -250.00.
     - Floating point precision: fractional pennies round correctly without floating-point drift.
  8. Test CORS preflight:
     - OPTIONS `/api/items` with `Origin: http://localhost:3000` returns `Access-Control-Allow-Origin: http://localhost:3000`.
- **Verification / Acceptance Criteria:**
  - `pytest -v --cov=. --cov-fail-under=70` runs completely offline with zero GCP credentials.
  - Total test suite execution runtime is under 5 seconds cold with >= 70% statement and branch coverage.

---

### Phase 2: Frontend Implementation Tasks (`frontend/`)

#### Step 8: Frontend Project Structure and Nuxt Configuration
- **Files:** `frontend/package.json` (create), `frontend/nuxt.config.ts` (create), `frontend/tsconfig.json` (create)
- **Satisfies:** [BR-002, BR-003, UR-006, FR-007, NFR-005, NFR-008, NFR-010]
- **Code references:** `languages/typescript.md`, `frameworks/nuxtjs.md`, `frameworks/vue.md`, `frameworks/vite.md`
- **Implementation details:**
  1. Create `frontend/package.json` with dependencies:
     - Production: `nuxt: "^4.0.0"` (or `^3.13.0` compatibility), `vue: "^3.4.0"`.
     - Dev dependencies: `vitest: "^1.5.0"`, `@vue/test-utils: "^2.4.5"`, `happy-dom: "^14.0.0"`, `typescript: "^5.4.0"`.
     - Scripts: `"dev": "nuxt dev"`, `"build": "nuxt build"`, `"generate": "nuxt generate"`, `"test": "vitest run"`.
  2. Implement `frontend/nuxt.config.ts`:
     - Set `ssr: false` (client-side SPA pre-rendering for Firebase Hosting static delivery).
     - Configure `nitro`: `{ preset: 'static', output: { publicDir: '.output/public' } }`.
     - Configure `runtimeConfig`: `{ public: { apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080' } }`.
     - App head metadata: title `"Budget Tracker"`, viewport meta tags.
  3. Implement `frontend/tsconfig.json` extending `.nuxt/tsconfig.json` with strict type checking.
- **Verification / Acceptance Criteria:**
  - `npm --prefix frontend install` completes with valid dependency tree.
  - Configuration files validate without TypeScript syntax errors.

---

#### Step 9: Reactive State Management and API Client Composable
- **Files:** `frontend/composables/useBudget.ts` (create)
- **Satisfies:** [BR-001, UR-001, UR-002, UR-003, UR-004, UR-005, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, NFR-002, NFR-007]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`, `frameworks/nuxtjs.md`, `patterns/typescript/rest-crud.md`, `error-handling-standards.md`
- **Implementation details:**
  1. Define TypeScript interfaces:
     - `BudgetItem { id: string; description: string; amount: number; date: string; type: 'income' | 'expense'; created_at: string; updated_at: string; }`
     - `BudgetItemInput { description: string; amount: number; date: string; type: 'income' | 'expense'; }`
     - `BudgetSummary { total_income: number; total_expenses: number; net_balance: number; item_count: number; }`
     - `UseBudgetReturn` encapsulating reactive state and methods.
  2. Initialize reactive references:
     - `items = ref<BudgetItem[]>([])`
     - `summary = ref<BudgetSummary>({ total_income: 0, total_expenses: 0, net_balance: 0, item_count: 0 })`
     - `loading = ref<boolean>(false)`
     - `error = ref<string | null>(null)`
     - `activeEditItem = ref<BudgetItem | null>(null)`
  3. Implement async methods using `$fetch` pointing to `${apiBaseUrl}/api`:
     - `fetchItems()`: GET `/api/items`, sets `items.value`.
     - `fetchSummary()`: GET `/api/summary`, sets `summary.value`.
     - `fetchAll()`: concurrent `Promise.all([fetchItems(), fetchSummary()])`.
     - `createItem(payload)`: POST `/api/items`, refreshes state on success, catches errors, returns boolean success.
     - `updateItem(id, payload)`: PUT `/api/items/${id}`, resets `activeEditItem`, refreshes state on success.
     - `deleteItem(id)`: DELETE `/api/items/${id}`, refreshes state on success.
     - `setEditItem(item)`: sets `activeEditItem.value = item`.
     - `clearError()`: sets `error.value = null`.
- **Verification / Acceptance Criteria:**
  - Composable exports type-safe interface and handles asynchronous state mutations.
  - Network errors catch gracefully and populate `error` ref without throwing uncaught exceptions.

---

#### Step 10: Financial Summary Component
- **Files:** `frontend/components/BudgetSummary.vue` (create)
- **Satisfies:** [BR-001, UR-005, FR-006, FR-009, NFR-002, NFR-008]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`
- **Implementation details:**
  1. Create `<script setup lang="ts">` consuming `summary` and `loading` from `useBudget()`.
  2. Implement currency formatting utility function (`formatCurrency(val: number): string`) producing `$X,XXX.XX` representation.
  3. Render 3 summary metric cards in responsive flex/grid layout:
     - **Total Income Card:** Displays `summary.total_income` with green text/badge indicator.
     - **Total Expenses Card:** Displays `summary.total_expenses` with red text/badge indicator.
     - **Net Balance Card:** Displays `summary.net_balance` with dynamic conditional classes:
       - Green accent and positive tag when `net_balance >= 0`.
       - Red accent and negative tag when `net_balance < 0`.
  4. Render item count indicator showing total transactions recorded.
  5. Include skeleton loading placeholders when `loading` is true.
- **Verification / Acceptance Criteria:**
  - Component renders correct formatted currency values.
  - Net balance switches visually between green (positive) and red (deficit) according to balance value.

---

#### Step 11: Transaction Entry and Edit Form Component
- **Files:** `frontend/components/BudgetItemForm.vue` (create)
- **Satisfies:** [BR-001, UR-001, UR-003, FR-001, FR-004, FR-007, NFR-003]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`, `patterns/typescript/rest-crud.md`
- **Implementation details:**
  1. Create `<script setup lang="ts">` consuming `activeEditItem`, `createItem`, `updateItem`, `setEditItem` from `useBudget()`.
  2. Maintain local form state: `description`, `amount`, `date`, `type` (`'income'` or `'expense'`), `errors` object, `isSubmitting`.
  3. Watch `activeEditItem`:
     - When populated, fill form fields with item data (Edit Mode).
     - When null, reset fields with default date set to current ISO date `YYYY-MM-DD` and type `'expense'` (Add Mode).
  4. Implement client-side form validation before dispatch:
     - Description: must be non-empty and <= 255 chars.
     - Amount: must be a positive number > 0.
     - Date: must match `YYYY-MM-DD`.
     - Inline error messages render under corresponding inputs upon validation failure.
  5. Handle form submission:
     - If in Edit Mode: invoke `updateItem(activeEditItem.id, payload)`.
     - If in Add Mode: invoke `createItem(payload)`.
     - Emit `@saved` on success and reset form.
  6. Provide "Cancel" button in Edit Mode invoking `setEditItem(null)` and emitting `@cancelled`.
- **Verification / Acceptance Criteria:**
  - Client-side validation halts submission and shows errors when description is empty or amount <= 0.
  - Submitting valid form dispatches appropriate composable method and clears form inputs.

---

#### Step 12: Ledger Items Table and Actions Component
- **Files:** `frontend/components/BudgetItemList.vue` (create)
- **Satisfies:** [BR-001, UR-002, UR-004, FR-002, FR-005, FR-008, NFR-007]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`
- **Implementation details:**
  1. Create `<script setup lang="ts">` consuming `items`, `loading`, `setEditItem`, `deleteItem` from `useBudget()`.
  2. Render transaction list in a responsive table or styled card view:
     - Columns / attributes: Date (`YYYY-MM-DD`), Description, Type (pill badge: "Income" in green, "Expense" in red), Formatted Amount (+/- prefixed), Actions.
  3. Implement "Edit" action button:
     - Clicking triggers `setEditItem(item)`.
  4. Implement "Delete" action button:
     - Clicking prompts user confirmation via accessible modal or `window.confirm("Are you sure you want to delete this budget item?")`.
     - Upon confirmation, invokes `deleteItem(item.id)`.
  5. Render friendly empty state message when `items.length === 0` and `loading === false` encouraging user to record first item.
  6. Render loading spinner / skeleton overlay when `loading === true`.
- **Verification / Acceptance Criteria:**
  - Displays all items with correct date order and type badges.
  - Clicking Delete prompts confirmation before calling deletion method.
  - Empty state renders cleanly when item list is empty.

---

#### Step 13: Dashboard Layout and Shell Page
- **Files:** `frontend/app.vue` (create), `frontend/pages/index.vue` (create)
- **Satisfies:** [BR-001, UR-001, UR-002, UR-003, UR-004, UR-005, FR-007, FR-008, FR-009, NFR-008]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`, `frameworks/nuxtjs.md`
- **Implementation details:**
  1. Implement `frontend/app.vue`:
     - Global shell layout with header bar containing application title ("Budget Tracker") and GitHub repository link.
     - Global error banner displaying `error` from `useBudget()` with a "Dismiss" button invoking `clearError()`.
     - Render `<NuxtPage />`.
  2. Implement `frontend/pages/index.vue`:
     - Import `useBudget()` and trigger `fetchAll()` in `onMounted()`.
     - Compose top summary area: `<BudgetSummary />`.
     - Compose two-column or stacked dashboard layout:
       - Left / top column: `<BudgetItemForm />`.
       - Right / bottom column: `<BudgetItemList />`.
     - Clean modern styling with CSS variables, responsive container max-width, and padding.
- **Verification / Acceptance Criteria:**
  - Page loads, mounts all three components, and fetches initial ledger data.
  - Layout is fully responsive across desktop and mobile screen viewports.

---

#### Step 14: Frontend Unit and Component Test Suite
- **Files:** `frontend/tests/app.spec.ts` (create), `frontend/vitest.config.ts` (create)
- **Satisfies:** [BR-003, UR-006, FR-007, FR-008, FR-009, NFR-010, NFR-011]
- **Code references:** `languages/typescript.md`, `frameworks/vue.md`, `frameworks/vite.md`
- **Implementation details:**
  1. Configure `frontend/vitest.config.ts` with Vue plugin and `happy-dom` test environment.
  2. Implement component unit tests using `@vue/test-utils`:
     - `BudgetSummary.vue`:
       - Verify renders total income, total expenses, net balance values accurately.
       - Verify positive balance applies positive class/styling.
       - Verify negative balance applies deficit class/styling.
     - `BudgetItemForm.vue`:
       - Verify validation halts submit when description is empty.
       - Verify validation halts submit when amount is 0 or negative.
       - Verify valid submit dispatches form data.
       - Verify edit mode populates fields from active item.
     - `BudgetItemList.vue`:
       - Verify renders list items with correct badges.
       - Verify edit button triggers edit handler.
       - Verify delete button triggers confirmation and delete handler.
       - Verify renders empty state message when items list is empty.
- **Verification / Acceptance Criteria:**
  - `npm --prefix frontend test` passes 100% offline without live backend in under 15 seconds.
  - Achieves >= 70% statement coverage across frontend components.

---

### Phase 3: Google Cloud DevOps Automation Tasks (`scripts/`, `firebase.json`)

#### Step 15: Google Cloud Project Setup and Provisioning Script
- **Files:** `scripts/setup-gcloud.sh` (create)
- **Satisfies:** [BR-002, BR-004, UR-007, FR-010, NFR-001, NFR-012, NFR-013]
- **Code references:** `logging-standards.md`, `error-handling-standards.md`
- **Implementation details:**
  1. Header: `#!/usr/bin/env bash` and `set -euo pipefail`.
  2. Parameter extraction:
     - Extract `PROJECT_ID` from `$1` or `$PROJECT_ID`. If empty, inspect `gcloud config get-value project`. If still empty, print descriptive error message to stderr and exit 1.
     - Extract `REGION` from `$2` or `$REGION` (default `us-central1`).
  3. Prerequisite validation: check `command -v gcloud` exists, exit 1 with guidance if missing.
  4. Enable required GCP Service APIs:
     - `run.googleapis.com` (Cloud Run)
     - `firestore.googleapis.com` (Firestore Native)
     - `cloudbuild.googleapis.com` (Cloud Build)
     - `artifactregistry.googleapis.com` (Artifact Registry)
     - Command: `gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="${PROJECT_ID}"`.
  5. Provision Firestore in Native mode:
     - Check if database exists; if not, execute:
       `gcloud firestore databases create --project="${PROJECT_ID}" --location="${REGION}" --type=firestore-native`.
  6. Provision Artifact Registry repository:
     - Check if repository `budget-repo` exists; if not, execute:
       `gcloud artifacts repositories create budget-repo --repository-format=docker --location="${REGION}" --description="Docker repository for budget app backend" --project="${PROJECT_ID}"`.
  7. Provision Cloud Run runtime Service Account:
     - Check if service account `budget-backend-sa` exists; if not, execute:
       `gcloud iam service-accounts create budget-backend-sa --display-name="Budget Backend Service Account" --project="${PROJECT_ID}"`.
     - Bind least-privilege IAM role `roles/datastore.user` [NFR-012]:
       `gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:budget-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com" --role="roles/datastore.user"`.
  8. Print operational summary and exit with code 0.
- **Verification / Acceptance Criteria:**
  - Script has executable permissions (`chmod +x scripts/setup-gcloud.sh`).
  - Idempotent: repeated executions succeed cleanly without duplicating resources.
  - Terminate with error code 1 if `PROJECT_ID` is unset.

---

#### Step 16: Backend Cloud Run Deployment Script
- **Files:** `scripts/deploy-backend.sh` (create)
- **Satisfies:** [BR-002, BR-004, UR-007, FR-011, NFR-004, NFR-006, NFR-007, NFR-012, NFR-013]
- **Code references:** `logging-standards.md`, `error-handling-standards.md`
- **Implementation details:**
  1. Header: `#!/usr/bin/env bash` and `set -euo pipefail`.
  2. Parameter extraction:
     - Extract `PROJECT_ID` (env or arg $1). Exit 1 if unset.
     - Extract `REGION` (default `us-central1`).
     - Extract `FRONTEND_URL` (default `http://localhost:3000`).
  3. Validate `backend/Dockerfile` exists.
  4. Submit container build to Cloud Build:
     - `IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/budget-repo/backend:latest"`
     - Execute: `gcloud builds submit --tag "${IMAGE_TAG}" backend/ --project="${PROJECT_ID}"`.
  5. Deploy container to Google Cloud Run:
     - Execute:
       ```bash
       gcloud run deploy budget-backend \
         --image "${IMAGE_TAG}" \
         --platform managed \
         --region "${REGION}" \
         --allow-unauthenticated \
         --service-account "budget-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
         --set-env-vars FIRESTORE_DATABASE="(default)",CORS_ORIGINS="${FRONTEND_URL}" \
         --min-instances 0 \
         --max-instances 5 \
         --port 8080 \
         --project="${PROJECT_ID}"
       ```
  6. Retrieve and display service URL:
     - `SERVICE_URL=$(gcloud run services describe budget-backend --platform managed --region "${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")`
     - Print: `Backend deployed successfully at: ${SERVICE_URL}`.
- **Verification / Acceptance Criteria:**
  - Script has executable permissions (`chmod +x scripts/deploy-backend.sh`).
  - Configures `--min-instances 0` ensuring zero cost when idle [NFR-004].
  - Prints deployed backend service URL.

---

#### Step 17: Firebase Hosting Configuration and Frontend Deployment Script
- **Files:** `firebase.json` (create), `scripts/deploy-frontend.sh` (create)
- **Satisfies:** [BR-002, BR-004, UR-007, FR-012, NFR-005, NFR-008, NFR-013]
- **Code references:** `logging-standards.md`, `error-handling-standards.md`
- **Implementation details:**
  1. Implement `firebase.json` at repository root:
     ```json
     {
       "hosting": {
         "public": "frontend/.output/public",
         "ignore": [
           "firebase.json",
           "**/.*",
           "**/node_modules/**"
         ],
         "rewrites": [
           {
             "source": "**",
             "destination": "/index.html"
           }
         ],
         "headers": [
           {
             "source": "**/*.@(js|css)",
             "headers": [
               {
                 "key": "Cache-Control",
                 "value": "max-age=31536000, immutable"
               }
             ]
           }
         ]
       }
     }
     ```
  2. Implement `scripts/deploy-frontend.sh`:
     - Header: `#!/usr/bin/env bash` and `set -euo pipefail`.
     - Validate `PROJECT_ID` and `BACKEND_URL` (exit 1 if unset).
     - Validate `command -v firebase` exists (exit 1 if missing).
     - Export `NUXT_PUBLIC_API_BASE_URL="${BACKEND_URL}"`.
     - Execute static generation: `npm --prefix frontend run generate` from repository root.
     - Verify `frontend/.output/public/index.html` was generated.
     - Deploy to Firebase Hosting from repository root where `firebase.json` resides:
       `firebase deploy --only hosting --project "${PROJECT_ID}"`.
     - Print deployed Firebase Hosting URL.
- **Verification / Acceptance Criteria:**
  - `firebase.json` is located in the repository root and points `public` to `frontend/.output/public`.
  - Script has executable permissions (`chmod +x scripts/deploy-frontend.sh`).
  - Builds static assets and invokes Firebase Hosting deployment.

---

### Phase 4: Testing, Verification, and Local Developer Experience

#### Step 18: Test Suite Verification and Local Developer Documentation
- **Files:** `README.md` (create)
- **Satisfies:** [BR-003, UR-006, SC-002, NFR-009, NFR-010, NFR-011]
- **Code references:** `logging-standards.md`
- **Implementation details:**
  1. Author comprehensive `README.md` covering:
     - Architecture overview and repository directory structure.
     - Prerequisites: Python 3.12, Node.js 18+, Docker (optional), gcloud CLI, firebase-tools.
     - Local Backend Quickstart:
       - `cd backend && python -m venv .venv && source .venv/bin/activate`
       - `pip install -r requirements.txt`
       - Run offline tests: `pytest -v --cov=. --cov-fail-under=70`
       - Start dev server: `USE_MOCK_DB=true uvicorn main:app --reload --port 8080`
     - Local Frontend Quickstart:
       - `cd frontend && npm install`
       - Run offline tests: `npm test`
       - Start dev server: `npm run dev` (opens on `http://localhost:3000`)
     - Google Cloud Deployment Instructions:
       - Step 1: Provision GCP resources: `bash scripts/setup-gcloud.sh <PROJECT_ID> <REGION>`
       - Step 2: Deploy Backend: `bash scripts/deploy-backend.sh <PROJECT_ID> <REGION>`
       - Step 3: Deploy Frontend: `bash scripts/deploy-frontend.sh <PROJECT_ID> <BACKEND_URL>`
     - Local offline test verification guarantee: explains that zero cloud credentials are required for local test execution.
- **Verification / Acceptance Criteria:**
  - `README.md` document provides copy-paste runnable commands for developers.
  - Test commands run completely offline in under 30 seconds combined.

---

## Ordering Rationale

- **Steps 1-2 (Backend Domain Foundation):** Dependencies (`requirements.txt`) and domain schemas (`models.py`) define the contract for all backend data handling.
- **Step 3 (Persistence Abstraction):** The database layer (`database.py`) provides both Firestore Native and the offline in-memory mock repository, allowing subsequent route development and tests to run immediately.
- **Steps 4-5 (Backend Service & API Entrypoint):** Route handlers (`routes.py`) and FastAPI application configuration (`main.py`) wire the business logic and CORS middleware together.
- **Steps 6-7 (Containerization & Offline Backend Tests):** Container definition (`Dockerfile`) and comprehensive pytest suite (`test_api.py`) validate backend completeness and enforce >= 70% coverage offline.
- **Steps 8-9 (Frontend Foundation & Composable State):** Nuxt project setup (`package.json`, `nuxt.config.ts`) and reactive state composable (`useBudget.ts`) establish client contracts and mock API interaction.
- **Steps 10-12 (Frontend UI Components):** Component development progresses from presentation cards (`BudgetSummary.vue`) to data entry (`BudgetItemForm.vue`) and list management (`BudgetItemList.vue`).
- **Steps 13-14 (Frontend Page Shell & Offline Tests):** Dashboard assembly (`app.vue`, `pages/index.vue`) and Vitest test suite (`app.spec.ts`) complete frontend verification.
- **Steps 15-17 (Cloud DevOps Automation):** Provisioning script (`setup-gcloud.sh`), backend deploy script (`deploy-backend.sh`), and frontend deploy script (`deploy-frontend.sh` + `firebase.json`) automate GCP rollout.
- **Step 18 (Verification & Documentation):** `README.md` synthesizes runnable instructions and local developer workflows.

---

## Notes for Developer

- Reference the `code` skill for language/framework conventions before implementing each step:
  - Python / FastAPI: [languages/python.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/languages/python.md), [frameworks/fastapi.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/frameworks/fastapi.md), [patterns/python/rest-crud.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/patterns/python/rest-crud.md)
  - TypeScript / Vue / Nuxt: [languages/typescript.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/languages/typescript.md), [frameworks/vue.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/frameworks/vue.md), [frameworks/nuxtjs.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/frameworks/nuxtjs.md), [patterns/typescript/rest-crud.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/patterns/typescript/rest-crud.md)
  - Standards: [error-handling-standards.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/error-handling-standards.md), [logging-standards.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/logging-standards.md), [code-slop.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/code-slop.md)
- Load traceability comments per [references/traceability-comment-format.md](file:///home/tj/.gemini/config/plugins/assist-plugin/skills/code/references/traceability-comment-format.md) (e.g. `# [FR-001] Create budget item` or `// [FR-007] Budget item management form`).
- Run code quality gates (test pass, coverage >= 70%, zero cloud credential requirements) at task completion.
