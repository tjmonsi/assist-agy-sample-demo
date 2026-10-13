# Budget Tracker

<!-- [spec-budget-app -> BR-001 -> BR-002 -> BR-003 -> BR-004 -> UR-006 -> UR-007 -> NFR-004 -> NFR-005 -> NFR-009 -> NFR-010 -> NFR-011] -->

Serverless full-stack budget tracking application featuring a FastAPI REST API deployed to Google Cloud Run, a Nuxt 4 single-page application hosted on Firebase Hosting, and Google Cloud Firestore in Native mode for persistence.

The repository includes a decoupled in-memory repository architecture. Both backend and frontend unit test suites execute completely offline without Google Cloud credentials, internet connectivity, or database emulators.

---

## Architecture Overview

```
+-------------------------------------------------------------+
|                     Client Web Browser                      |
|                  Nuxt 4 / Vue 3 SPA Client                  |
+------------------------------+------------------------------+
                               |
            HTTPS REST Calls   |   Static Assets
                               v   (CDN Delivery)
+------------------------------+------------------------------+
|     Google Cloud Run         |       Firebase Hosting       |
|    FastAPI Python 3.12       |    Global Edge CDN Hosting   |
|   Scale-to-zero (0..5)       |    Pre-rendered SPA Shell    |
+--------------+---------------+------------------------------+
               |
               | gRPC over TLS (Least-privilege SA)
               v
+-------------------------------------------------------------+
|              Google Cloud Firestore (Native Mode)           |
|                Root Collection: `budget_items`              |
+-------------------------------------------------------------+
```

### Repository Structure

```
.
├── backend/                  # FastAPI backend service
│   ├── database.py           # Firestore Native SDK and in-memory mock repositories
│   ├── Dockerfile            # Container specification for Cloud Run deployment
│   ├── main.py               # FastAPI entrypoint, CORS, and security middleware
│   ├── models.py             # Pydantic v2 domain schemas and input validators
│   ├── requirements.txt      # Python runtime and testing dependencies
│   ├── routes.py             # REST API route handlers (/api/items, /api/summary)
│   └── tests/
│       └── test_api.py       # Offline pytest test suite (44 tests, >= 70% coverage)
├── docs/                     # Specifications and architectural documentation
│   ├── requirements.md       # IEEE 29148 system requirements specification
│   └── task-plan.md          # Phased engineering implementation plan
├── frontend/                 # Nuxt 4 / Vue 3 single-page application
│   ├── app.vue               # Global layout, header, and dismissible alert banners
│   ├── components/
│   │   ├── BudgetItemForm.vue  # Transaction creation and editing form
│   │   ├── BudgetItemList.vue  # Chronological ledger table with delete confirmation
│   │   └── BudgetSummary.vue   # Income, expense, and net balance metric cards
│   ├── composables/
│   │   └── useBudget.ts      # Reactive state management and REST API client
│   ├── nuxt.config.ts        # Static Nitro generation and runtime API configuration
│   ├── package.json          # Node.js dependencies and lifecycle scripts
│   ├── pages/
│   │   └── index.vue         # Main budget dashboard page
│   └── tests/                # Offline Vitest component and composable test suites
├── firebase.json             # Firebase Hosting SPA routing and cache headers
└── scripts/                  # Automated DevOps shell provisioning and deployment
    ├── deploy-backend.sh     # Cloud Build container build and Cloud Run deployment
    ├── deploy-frontend.sh    # Static Nuxt generation and Firebase Hosting deployment
    └── setup-gcloud.sh       # Google Cloud APIs, Firestore, Artifact Registry, IAM setup
```

---

## Prerequisites

- **Python**: version 3.12 or newer
- **Node.js**: version 18 or newer (with `npm`)
- **Google Cloud CLI (`gcloud`)**: required for cloud deployment
- **Firebase CLI (`firebase-tools`)**: required for Firebase Hosting deployment (or via `npx`)
- **Docker**: optional (Cloud Build handles remote container compilation)

---

## Local Development Quickstart

### 1. Backend Service Setup

The backend defaults to the in-memory mock repository when `USE_MOCK_DB=true`. No Google Cloud credentials or emulators are needed.

```bash
cd backend

# Create and activate Python virtual environment
python3.12 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run offline test suite with coverage
pytest -v --cov=. --cov-fail-under=70

# Launch local development server
USE_MOCK_DB=true uvicorn main:app --reload --port 8080
```

The REST API will be accessible at `http://localhost:8080`. Interactive OpenAPI documentation is available at `http://localhost:8080/docs`.

### 2. Frontend Application Setup

The frontend connects to the backend API base URL specified in `NUXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`).

```bash
cd frontend

# Install Node.js dependencies
npm install

# Run offline Vitest test suites
npm test

# Launch local development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## Offline Testing Guarantee

Both test suites satisfy [BR-003], [UR-006], [NFR-009], [NFR-010], and [NFR-011]:

- **Backend Pytest Suite**: Uses `MockFirestoreRepository` which stores transaction records in an in-memory dictionary. Tests verify schema validation, positive amounts, calendar date validity, CRUD operations, chronological ordering, summary calculation, deficit balances, penny rounding, and CORS preflight headers without network egress.
- **Frontend Vitest Suite**: Uses `happy-dom` and Vue Test Utils with mock API responses. Tests verify form validation, input constraints, reactive summary balance styling (positive vs deficit), edit triggers, delete confirmations, and empty state rendering without network egress.
- **Execution Speed**: The backend test suite executes in under 3 seconds cold; the frontend test suite executes in under 2 seconds.

---

## Google Cloud Deployment Guide

Deployment requires an active Google Cloud Platform project with billing enabled.

### Step 1: Provision Google Cloud Infrastructure

The provisioning script activates required APIs, provisions Firestore in Native mode, creates the Artifact Registry Docker repository, creates the runtime service account, and binds the least-privilege role `roles/datastore.user` [FR-010, NFR-012].

```bash
# Syntax: bash scripts/setup-gcloud.sh [PROJECT_ID] [REGION]
bash scripts/setup-gcloud.sh my-gcp-project-id us-central1
```

### Step 2: Deploy Backend to Google Cloud Run

The backend deployment script compiles the container image using Google Cloud Build, uploads it to Artifact Registry, and deploys it to Cloud Run with scale-to-zero autoscaling (`--min-instances 0`) [FR-011, NFR-004].

```bash
# Syntax: bash scripts/deploy-backend.sh [PROJECT_ID] [REGION] [FRONTEND_URL]
bash scripts/deploy-backend.sh my-gcp-project-id us-central1 https://my-gcp-project-id.web.app
```

The script prints the live Cloud Run backend URL upon completion (e.g., `https://budget-backend-xyz-uc.a.run.app`).

### Step 3: Deploy Frontend to Firebase Hosting

The frontend deployment script compiles the static SPA bundle via `npm run generate` with the backend URL embedded into `NUXT_PUBLIC_API_BASE_URL`, then deploys to Firebase Hosting [FR-012, NFR-005].

```bash
# Syntax: bash scripts/deploy-frontend.sh [PROJECT_ID] [BACKEND_URL]
bash scripts/deploy-frontend.sh my-gcp-project-id https://budget-backend-xyz-uc.a.run.app
```

The live web application will be accessible at:
- `https://<PROJECT_ID>.web.app`
- `https://<PROJECT_ID>.firebaseapp.com`

---

## REST API Specification

| Method | Path | Description | Success Status |
|---|---|---|---|
| `POST` | `/api/items` | Record a new budget transaction | `201 Created` |
| `GET` | `/api/items` | List all transactions ordered chronologically descending | `200 OK` |
| `GET` | `/api/items/{id}` | Retrieve a single transaction by ID | `200 OK` |
| `PUT` | `/api/items/{id}` | Update an existing transaction | `200 OK` |
| `DELETE` | `/api/items/{id}` | Delete a transaction by ID | `204 No Content` |
| `GET` | `/api/summary` | Retrieve total income, total expenses, net balance, and count | `200 OK` |
| `GET` | `/health` | Liveness and readiness health probe | `200 OK` |

### Transaction Schema

```json
{
  "description": "Monthly Salary",
  "amount": 3500.00,
  "date": "2026-10-01",
  "type": "income"
}
```

Constraints:
- `description`: 1 to 255 non-whitespace characters.
- `amount`: positive float greater than 0.00.
- `date`: valid calendar date string in `YYYY-MM-DD` format.
- `type`: strictly `"income"` or `"expense"`.
