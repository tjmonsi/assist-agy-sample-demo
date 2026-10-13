# Budget Tracking Application: Requirements Specification

**Document Standard:** IEEE 29148:2018 / OpenSpec  
**Version:** 1.0  
**Date:** 2026-10-13  
**Author:** TJ  
**Status:** APPROVED  

---

## 1. Executive Summary and Business Requirements (BRD)

### 1.1 Purpose
This document defines the complete business, user, functional, and non-functional requirements for the Budget Tracking Application. The application provides an individual user with a responsive web interface and backend API to record monetary transactions, maintain a real-time ledger, and review financial balances.

### 1.2 Stakeholders

| Stakeholder | Role | Goals | Influence |
|---|---|---|---|
| End User | Primary User | Track personal income and expenses, inspect transaction history, and calculate net financial balance accurately. | High |
| Application Developer | Implementer & Maintainer | Build, verify, and run automated test suites locally without requiring Google Cloud credentials or live internet connectivity. | High |
| Cloud DevOps Engineer | Infrastructure Operator | Deploy and configure serverless cloud infrastructure on Google Cloud Platform using automated shell scripts. | Medium |

### 1.3 Business Requirements

| ID | Requirement Statement | Priority | Success Criteria |
|---|---|---|---|
| BR-001 | To provide individuals with financial visibility, the business must deliver a real-time digital ledger recording monetary inflows and outflows with automatic net balance computation. | Must | 100% of recorded transactions reflect accurately in summary calculations. |
| BR-002 | To eliminate persistent hosting costs when idle, the business must deploy the solution using serverless managed cloud services on Google Cloud Platform (Cloud Run, Firebase Hosting, and Firestore Native mode). | Must | Zero ongoing compute costs when application traffic is idle. |
| BR-003 | To ensure rapid developer feedback loops and prevent unexpected cloud usage billing, the business must provide offline local verification for all application components without live Google Cloud dependencies. | Must | Local test suites execute offline in under 30 seconds total. |
| BR-004 | To eliminate deployment errors and configuration drift, the business must provide automated shell scripts for environment provisioning and deployment. | Must | Setup and deployment scripts complete with zero manual console intervention. |

### 1.4 Business Scope

#### In Scope
- Core financial ledger operations: creation, listing, updating, and deletion of individual budget items.
- Real-time calculation of total income, total expenses, and net balance.
- Containerized FastAPI backend with Google Cloud Firestore in Native mode persistence.
- Nuxt 4 / Vue 3 web frontend with responsive user interface.
- Serverless deployment architecture targeting Google Cloud Run and Firebase Hosting.
- Fully automated Google Cloud and Firebase setup shell scripts in `scripts/`.
- Isolated offline local test suites with zero cloud credential prerequisites.

#### Out of Scope (Business Exclusions)

| Excluded Item | Reason | Deferred To |
|---|---|---|
| Multi-user accounts and tenant authentication | Initial project scope prioritizes single-user budget tracking simplicity. | Phase 2 / v2.0 |
| Multi-currency handling and real-time exchange rates | Initial release operates under a single user-chosen currency. | Phase 2 / v2.0 |
| Bank account synchronization and Open Banking APIs | External banking integration introduces security and compliance overhead beyond initial requirements. | Never |
| Continuous Integration / Continuous Deployment (CI/CD) pipelines | Local script execution and manual deployment satisfy current delivery needs. | Phase 2 |

### 1.5 Constraints
- Business Constraint: System must run within Google Cloud Platform free tier allowances during development and low-volume usage.
- Technical Constraint: Storage layer must use Google Cloud Firestore in Native mode.
- Technical Constraint: Backend must use Python 3.11+ with FastAPI located in `backend/`.
- Technical Constraint: Frontend must use Nuxt 4 with Vue 3 located in `frontend/`.
- Operational Constraint: Local tests must run offline without active GCP cloud credentials using mock or in-memory Firestore implementations.

### 1.6 Assumptions
- The end user accesses the application through a modern web browser supporting ECMAScript 2022+ standards.
- Google Cloud CLI (`gcloud`) and Firebase CLI (`firebase`) are installed and authenticated in the operator deployment workstation.
- Financial transactions occur in a single standardized decimal currency unit.

### 1.7 Business Success Metrics

| ID | Metric Description | Measurement Method | Target Value |
|---|---|---|---|
| SC-001 | Calculation Accuracy | Automated verification against mathematical test cases | 100.0% accurate sum and balance calculations |
| SC-002 | Local Verification Speed | Cold execution of backend and frontend test runners | Under 30 seconds total runtime |
| SC-003 | Infrastructure Automation | Script execution time from clean GCP project to operational state | Under 10 minutes total setup time |

---

## 2. User Requirements (URD)

### 2.1 Purpose
This section specifies the capabilities and operational behaviors required by end users, developers, and DevOps operators. Every user requirement traces directly to one or more business requirements.

### 2.2 Stakeholder User Requirements

| ID | User Requirement Statement | Stakeholder | Traces To | Priority |
|---|---|---|---|---|
| UR-001 | The end user shall be able to record a new budget item by entering a description, monetary amount, date, and explicit transaction type (`income` or `expense`). | End User | BR-001 | Must |
| UR-002 | The end user shall be able to view a chronological list of all recorded budget items displaying their descriptions, amounts, dates, and types. | End User | BR-001 | Must |
| UR-003 | The end user shall be able to edit any existing budget item to correct descriptions, amounts, dates, or transaction types. | End User | BR-001 | Must |
| UR-004 | The end user shall be able to delete an unwanted budget item from the ledger with immediate confirmation. | End User | BR-001 | Must |
| UR-005 | The end user shall be able to view an aggregate financial summary card displaying total income, total expenses, and the calculated net balance. | End User | BR-001 | Must |
| UR-006 | The developer shall be able to execute automated test suites locally without cloud credentials, emulator internet connectivity, or remote GCP dependencies. | Developer | BR-003 | Must |
| UR-007 | The cloud administrator shall be able to provision GCP infrastructure (Firestore Native, Cloud Run, Firebase Hosting) and deploy applications using shell scripts located in `scripts/`. | Cloud DevOps Engineer | BR-002, BR-004 | Must |

### 2.3 Use Case Summaries

#### UC-001: Add Budget Item
- **Primary Actor:** End User
- **Precondition:** Web frontend is loaded and connected to the backend API.
- **Success Guarantee:** The new item is saved in Firestore Native, appears in the transaction list, and updates the summary card.
- **Main Scenario:**
  1. User opens the transaction entry form.
  2. User inputs description, monetary amount, date, and selects type (`income` or `expense`).
  3. User submits the form.
  4. System validates inputs, persists the record, and clears form fields.
  5. System updates the transaction list and financial summary cards.
- **Extensions:**
  - 3a. Invalid inputs provided (e.g., negative amount, blank description, invalid type).
    - System displays descriptive inline validation messages and halts submission.

#### UC-002: View Transaction Ledger
- **Primary Actor:** End User
- **Precondition:** Application is initialized.
- **Success Guarantee:** Complete list of all recorded transactions is rendered in order.
- **Main Scenario:**
  1. User navigates to the application main page.
  2. System retrieves existing budget items from the backend API.
  3. System displays transaction rows with format-specific indicators for income and expenses.
- **Extensions:**
  - 2a. No transactions exist in store.
    - System displays an empty state banner informing the user that no items are recorded yet.

#### UC-003: Update Budget Item
- **Primary Actor:** End User
- **Precondition:** Target transaction exists in the ledger.
- **Success Guarantee:** Modified values overwrite existing item data and summary numbers recalculate.
- **Main Scenario:**
  1. User selects "Edit" on a transaction row.
  2. System populates the form with existing item values.
  3. User modifies desired fields and submits updates.
  4. System validates inputs and updates the record in Firestore Native.
  5. System updates the transaction row and recalculates summary totals.
- **Extensions:**
  - 3a. User cancels editing without saving.
    - System reverts the form to initial state without altering existing data.

#### UC-004: Delete Budget Item
- **Primary Actor:** End User
- **Precondition:** Target transaction exists in the ledger.
- **Success Guarantee:** Transaction record is purged from storage and removed from UI list.
- **Main Scenario:**
  1. User clicks "Delete" on a transaction row.
  2. System prompts for user confirmation.
  3. User confirms deletion.
  4. System purges record from Firestore Native.
  5. System removes row from UI and decrements summary figures.

#### UC-005: View Financial Summary
- **Primary Actor:** End User
- **Precondition:** Ledger contains zero or more transactions.
- **Success Guarantee:** Summary figures accurately show total income, total expenses, and net balance.
- **Main Scenario:**
  1. User views summary dashboard area.
  2. System displays Total Income, Total Expenses, and Net Balance (`Total Income - Total Expenses`).
  3. Visual indicator highlights positive balance or negative balance (deficit).

---

## 3. Functional Requirements (FR) and Acceptance Criteria

### 3.1 Requirements Inventory

| ID | Functional Requirement Statement | Traces To | Priority | Acceptance Criteria |
|---|---|---|---|---|
| FR-001 | The backend SHALL provide an endpoint to create a budget item storing description, amount, date, and explicit type (`income` or `expense`). | UR-001 | Must | See Section 3.2.1 |
| FR-002 | The backend SHALL provide an endpoint to list all budget items stored in Firestore Native. | UR-002 | Must | See Section 3.2.2 |
| FR-003 | The backend SHALL provide an endpoint to retrieve a single budget item by its unique identifier. | UR-002, UR-003 | Must | See Section 3.2.3 |
| FR-004 | The backend SHALL provide an endpoint to update an existing budget item by its unique identifier. | UR-003 | Must | See Section 3.2.4 |
| FR-005 | The backend SHALL provide an endpoint to delete a budget item by its unique identifier. | UR-004 | Must | See Section 3.2.5 |
| FR-006 | The backend SHALL calculate and return an aggregated financial summary containing total income, total expenses, and net balance. | UR-005 | Must | See Section 3.2.6 |
| FR-007 | The frontend SHALL render a reactive form allowing users to submit new budget items and edit existing items. | UR-001, UR-003 | Must | See Section 3.2.7 |
| FR-008 | The frontend SHALL render an interactive table displaying all budget items with actions to edit or delete individual rows. | UR-002, UR-004 | Must | See Section 3.2.8 |
| FR-009 | The frontend SHALL render a summary card displaying total income, total expenses, and net balance, updated after every ledger mutation. | UR-005 | Must | See Section 3.2.9 |
| FR-010 | The automation scripts SHALL provision Firestore Native mode, create required GCP service accounts, and configure permissions via shell script. | UR-007 | Must | See Section 3.2.10 |
| FR-011 | The automation scripts SHALL build the backend container image, deploy it to Google Cloud Run, and output the backend service URL. | UR-007 | Must | See Section 3.2.11 |
| FR-012 | The automation scripts SHALL build the Nuxt frontend and deploy static or serverless assets to Firebase Hosting. | UR-007 | Must | See Section 3.2.12 |

---

### 3.2 Functional Requirement Specifications & Scenarios

#### 3.2.1 FR-001: Create Budget Item
**Statement:** The backend SHALL accept a POST request at `/api/items` containing description, positive monetary amount, date (YYYY-MM-DD), and explicit type (`income` or `expense`), persist the record in Firestore Native, and return the created record with its assigned identifier.  
**Traces to:** UR-001  
**Priority:** Must  

##### Scenario: Successful Budget Item Creation (Happy Path)
- **GIVEN** a valid payload with description "Monthly Salary", amount `3500.00`, date "2026-10-01", and type "income"
- **WHEN** the client submits a POST request to `/api/items`
- **THEN** the backend SHALL return HTTP status 201 Created
- **AND** the response body SHALL contain a unique string `id`, description "Monthly Salary", amount `3500.00`, date "2026-10-01", and type "income"
- **AND** the new record SHALL exist in the Firestore `budget_items` collection

##### Scenario: Rejection of Invalid Transaction Type (Error Path)
- **GIVEN** a payload with description "Bonus", amount `500.00`, date "2026-10-05", and type "credit"
- **WHEN** the client submits a POST request to `/api/items`
- **THEN** the backend SHALL reject the request with HTTP status 422 Unprocessable Entity
- **AND** the response body SHALL specify that type must be either "income" or "expense"
- **AND** no record SHALL be saved to Firestore

##### Scenario: Rejection of Zero or Negative Amount (Error Path)
- **GIVEN** a payload with description "Coffee", amount `-4.50`, date "2026-10-10", and type "expense"
- **WHEN** the client submits a POST request to `/api/items`
- **THEN** the backend SHALL reject the request with HTTP status 422 Unprocessable Entity
- **AND** the response body SHALL indicate that amount must be greater than zero

##### Scenario: Rejection of Blank Description or Malformed Date (Error Path)
- **GIVEN** a payload with description "   ", amount `25.00`, date "10-10-2026", and type "expense"
- **WHEN** the client submits a POST request to `/api/items`
- **THEN** the backend SHALL reject the request with HTTP status 422 Unprocessable Entity
- **AND** the response body SHALL list validation errors for description and date

---

#### 3.2.2 FR-002: List Budget Items
**Statement:** The backend SHALL accept a GET request at `/api/items` and return an array of all budget item records ordered chronologically by date descending.  
**Traces to:** UR-002  
**Priority:** Must  

##### Scenario: Retrieve Populated Transaction List (Happy Path)
- **GIVEN** the Firestore collection contains 3 budget items with dates "2026-10-01", "2026-10-05", and "2026-10-08"
- **WHEN** the client submits a GET request to `/api/items`
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** the response body SHALL be a JSON array containing 3 items ordered with "2026-10-08" first

##### Scenario: Retrieve Empty Transaction List (Happy Path / Boundary)
- **GIVEN** the Firestore collection contains zero items
- **WHEN** the client submits a GET request to `/api/items`
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** the response body SHALL be an empty JSON array `[]`

---

#### 3.2.3 FR-003: Retrieve Single Budget Item
**Statement:** The backend SHALL accept a GET request at `/api/items/{id}` and return the single matching budget item.  
**Traces to:** UR-002, UR-003  
**Priority:** Must  

##### Scenario: Retrieve Existing Budget Item (Happy Path)
- **GIVEN** an existing budget item with identifier "item-123" exists in Firestore
- **WHEN** the client submits a GET request to `/api/items/item-123`
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** the response body SHALL contain the full item details for "item-123"

##### Scenario: Request Non-Existent Budget Item (Error Path)
- **GIVEN** no budget item exists with identifier "item-999"
- **WHEN** the client submits a GET request to `/api/items/item-999`
- **THEN** the backend SHALL return HTTP status 404 Not Found
- **AND** the response body SHALL contain an error message stating the item was not found

---

#### 3.2.4 FR-004: Update Existing Budget Item
**Statement:** The backend SHALL accept a PUT request at `/api/items/{id}` containing updated description, amount, date, and type, update the record in Firestore Native, and return the modified record.  
**Traces to:** UR-003  
**Priority:** Must  

##### Scenario: Successful Budget Item Update (Happy Path)
- **GIVEN** an existing budget item with identifier "item-123" having amount `50.00` and description "Groceries"
- **WHEN** the client submits a PUT request to `/api/items/item-123` with amount `65.50` and description "Weekly Groceries"
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** the response body SHALL reflect amount `65.50` and description "Weekly Groceries"
- **AND** the record in Firestore SHALL reflect the updated values

##### Scenario: Update Non-Existent Budget Item (Error Path)
- **GIVEN** identifier "item-missing" does not exist in Firestore
- **WHEN** the client submits a PUT request to `/api/items/item-missing` with valid payload
- **THEN** the backend SHALL return HTTP status 404 Not Found

##### Scenario: Update with Invalid Payload (Error Path)
- **GIVEN** an existing budget item with identifier "item-123"
- **WHEN** the client submits a PUT request to `/api/items/item-123` with amount `-10.00`
- **THEN** the backend SHALL reject the request with HTTP status 422 Unprocessable Entity
- **AND** the record in Firestore SHALL remain unchanged

---

#### 3.2.5 FR-005: Delete Budget Item
**Statement:** The backend SHALL accept a DELETE request at `/api/items/{id}` and permanently remove the corresponding record from Firestore Native.  
**Traces to:** UR-004  
**Priority:** Must  

##### Scenario: Successful Budget Item Deletion (Happy Path)
- **GIVEN** an existing budget item with identifier "item-123"
- **WHEN** the client submits a DELETE request to `/api/items/item-123`
- **THEN** the backend SHALL return HTTP status 204 No Content
- **AND** subsequent GET requests to `/api/items/item-123` SHALL return HTTP status 404 Not Found

##### Scenario: Delete Non-Existent Budget Item (Error Path)
- **GIVEN** identifier "item-999" does not exist in Firestore
- **WHEN** the client submits a DELETE request to `/api/items/item-999`
- **THEN** the backend SHALL return HTTP status 404 Not Found

---

#### 3.2.6 FR-006: Calculate and Return Budget Summary
**Statement:** The backend SHALL provide an endpoint at `/api/summary` that computes and returns total income, total expenses, and net balance (`total_income - total_expenses`).  
**Traces to:** UR-005  
**Priority:** Must  

##### Scenario: Accurate Summary Calculation (Happy Path)
- **GIVEN** the store contains two income items (`2000.00`, `500.00`) and two expense items (`300.00`, `150.00`)
- **WHEN** the client submits a GET request to `/api/summary`
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** `total_income` SHALL equal `2500.00`
- **AND** `total_expenses` SHALL equal `450.00`
- **AND** `net_balance` SHALL equal `2050.00`

##### Scenario: Summary on Empty Store (Boundary Path)
- **GIVEN** the store contains zero budget items
- **WHEN** the client submits a GET request to `/api/summary`
- **THEN** the backend SHALL return HTTP status 200 OK
- **AND** `total_income` SHALL equal `0.00`
- **AND** `total_expenses` SHALL equal `0.00`
- **AND** `net_balance` SHALL equal `0.00`

##### Scenario: Deficit Net Balance Calculation (Boundary Path)
- **GIVEN** the store contains income of `100.00` and expenses of `350.00`
- **WHEN** the client submits a GET request to `/api/summary`
- **THEN** `total_income` SHALL equal `100.00`
- **AND** `total_expenses` SHALL equal `350.00`
- **AND** `net_balance` SHALL equal `-250.00`

---

#### 3.2.7 FR-007: Frontend Budget Item Management Form
**Statement:** The frontend SHALL provide a responsive Vue form to submit new budget items and edit existing items with client-side field validation.  
**Traces to:** UR-001, UR-003  
**Priority:** Must  

##### Scenario: Form Submission (Happy Path)
- **GIVEN** the user fills in description "Internet Bill", amount "60.00", date "2026-10-13", and type "expense"
- **WHEN** the user triggers the form submission action
- **THEN** the frontend SHALL issue a POST request to `/api/items` with matching JSON payload
- **AND** upon 201 response, the frontend SHALL reset the input fields and refresh the item ledger

##### Scenario: Client-side Validation Failure (Error Path)
- **GIVEN** the user leaves description blank and leaves amount at `0`
- **WHEN** the user clicks the submit button
- **THEN** the frontend SHALL prevent network transmission
- **AND** inline validation messages SHALL display adjacent to the description and amount fields

---

#### 3.2.8 FR-008: Frontend Budget Items List & Actions
**Statement:** The frontend SHALL render a table or card list displaying all budget items, supporting item editing and item deletion with confirmation.  
**Traces to:** UR-002, UR-004  
**Priority:** Must  

##### Scenario: Render Items with Distinct Type Styling (Happy Path)
- **GIVEN** backend returns one income item and one expense item
- **WHEN** the frontend renders the items list
- **THEN** the income item SHALL render with positive formatting or green badge
- **AND** the expense item SHALL render with negative formatting or red badge

##### Scenario: Confirm Item Deletion (Happy Path)
- **GIVEN** an item is displayed in the list
- **WHEN** the user clicks "Delete" and confirms the modal dialog
- **THEN** the frontend SHALL send DELETE to `/api/items/{id}`
- **AND** upon successful deletion, the row SHALL be removed from the view

---

#### 3.2.9 FR-009: Frontend Budget Summary Dashboard
**Statement:** The frontend SHALL render a top-level summary component displaying total income, total expenses, and net balance, reflecting all ledger state changes.  
**Traces to:** UR-005  
**Priority:** Must  

##### Scenario: Dynamic Summary Refresh (Happy Path)
- **GIVEN** current net balance displays `$500.00`
- **WHEN** the user adds a new expense of `$100.00`
- **THEN** the summary card SHALL refresh to show total expenses increased by `$100.00`
- **AND** net balance SHALL update to display `$400.00`

---

#### 3.2.10 FR-010: GCP Environment Setup Script
**Statement:** The project SHALL provide an automated shell script `scripts/setup-gcloud.sh` to enable required GCP APIs, provision Firestore in Native mode, and configure service accounts.  
**Traces to:** UR-007  
**Priority:** Must  

##### Scenario: Clean GCP Environment Provisioning (Happy Path)
- **GIVEN** an authenticated gcloud environment with `PROJECT_ID` configured
- **WHEN** the administrator executes `bash scripts/setup-gcloud.sh`
- **THEN** the script SHALL enable `run.googleapis.com` and `firestore.googleapis.com`
- **AND** the script SHALL provision a Firestore database in Native mode if not already created
- **AND** the script SHALL exit with code 0

##### Scenario: Missing Project ID Detection (Error Path)
- **GIVEN** environment variable `PROJECT_ID` is empty and no active gcloud project is selected
- **WHEN** the administrator executes `bash scripts/setup-gcloud.sh`
- **THEN** the script SHALL output an explicit error message stating project ID is required
- **AND** the script SHALL terminate with a non-zero exit code

---

#### 3.2.11 FR-011: Backend Deployment Script
**Statement:** The project SHALL provide an automated shell script `scripts/deploy-backend.sh` to build the backend Docker container image and deploy it to Google Cloud Run.  
**Traces to:** UR-007  
**Priority:** Must  

##### Scenario: Backend Deployment Execution (Happy Path)
- **GIVEN** `backend/Dockerfile` and backend code are present
- **WHEN** the administrator executes `bash scripts/deploy-backend.sh`
- **THEN** the script SHALL submit the container build to Cloud Build or Artifact Registry
- **AND** the script SHALL deploy the service to Cloud Run with unauthenticated access enabled for API consumption
- **AND** the script SHALL print the deployed service URL

---

#### 3.2.12 FR-012: Frontend Deployment Script
**Statement:** The project SHALL provide an automated shell script `scripts/deploy-frontend.sh` to build the Nuxt application and deploy it to Firebase Hosting.  
**Traces to:** UR-007  
**Priority:** Must  

##### Scenario: Frontend Deployment Execution (Happy Path)
- **GIVEN** `firebase.json` and Nuxt frontend code are present
- **WHEN** the administrator executes `bash scripts/deploy-frontend.sh`
- **THEN** the script SHALL run `npm run build` or `npm run generate` in `frontend/`
- **AND** the script SHALL invoke `firebase deploy --only hosting`
- **AND** the script SHALL print the hosted frontend application URL

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Storage & Data Integrity

| ID | Quality Attribute | Requirement Statement | Traces To | Metric / Target |
|---|---|---|---|---|
| NFR-001 | Storage Engine | The backend SHALL persist all budget items in Google Cloud Firestore operating in Native mode under the `budget_items` collection. | BR-002, FR-001 | 100% of stored items reside in Firestore Native collection `budget_items`. |
| NFR-002 | Data Precision | The backend SHALL calculate monetary sums using fixed decimal arithmetic (2 decimal places) to prevent floating-point calculation anomalies. | BR-001, FR-006 | Zero rounding discrepancies across sum calculations. |
| NFR-003 | Data Validation | The backend SHALL reject any payload containing extra undeclared attributes or description strings exceeding 255 characters. | BR-001, FR-001 | HTTP 422 returned on non-compliant payloads. |

### 4.2 Deployment Topology & Hosting

| ID | Quality Attribute | Requirement Statement | Traces To | Metric / Target |
|---|---|---|---|---|
| NFR-004 | Backend Hosting | The backend application SHALL execute as a stateless container on Google Cloud Run configured with autoscaling to 0 instances when idle. | BR-002, FR-011 | Zero active instances during idle periods. |
| NFR-005 | Frontend Hosting | The frontend application SHALL deploy to Firebase Hosting delivering pre-rendered or static client assets over global CDN edge locations. | BR-002, FR-012 | 100% static asset delivery via Firebase Hosting CDN. |
| NFR-006 | CORS Configuration | The backend service SHALL allow Cross-Origin Resource Sharing (CORS) requests originating from configured Firebase Hosting domains and `http://localhost:3000`. | BR-002, FR-001 | Preflight OPTIONS requests return HTTP 200 with matching `Access-Control-Allow-Origin` header. |

### 4.3 Performance & Responsiveness

| ID | Quality Attribute | Requirement Statement | Traces To | Metric / Target |
|---|---|---|---|---|
| NFR-007 | API Latency | The backend API SHALL respond to CRUD and summary requests within 200 milliseconds at p95 under payloads of up to 1,000 items (excluding initial cold starts). | BR-001, FR-002 | p95 latency <= 200 ms. |
| NFR-008 | Frontend Load Time | The frontend application SHALL achieve a First Contentful Paint (FCP) of under 1.5 seconds on standard broadband connections. | BR-001, FR-007 | FCP <= 1.5 seconds. |

### 4.4 Local Testing & Testability

| ID | Quality Attribute | Requirement Statement | Traces To | Metric / Target |
|---|---|---|---|---|
| NFR-009 | Offline Backend Testing | The backend test suite SHALL execute completely offline in under 10 seconds without GCP cloud credentials or internet connectivity using mock or in-memory Firestore interfaces. | BR-003, UR-006 | Zero cloud calls during pytest execution; execution time <= 10s. |
| NFR-010 | Offline Frontend Testing | The frontend test suite SHALL execute completely offline in under 15 seconds using Vitest and Vue Test Utils without live network access. | BR-003, UR-006 | Zero network calls during test run; execution time <= 15s. |
| NFR-011 | Test Coverage Threshold | The automated test suites SHALL maintain at least 70% branch and statement coverage across backend endpoints, business logic, and frontend components. | BR-003, UR-006 | Line and branch coverage >= 70%. |

### 4.5 Security & Operational Governance

| ID | Quality Attribute | Requirement Statement | Traces To | Metric / Target |
|---|---|---|---|---|
| NFR-012 | Least Privilege IAM | The Cloud Run backend service account SHALL be granted only `roles/datastore.user` access on Firestore without project-level administrative permissions. | BR-002, FR-010 | Zero administrative IAM roles assigned to backend runtime. |
| NFR-013 | Secrets Management | The system SHALL NOT hardcode GCP service account keys or private credentials into source code, git repositories, or frontend bundles. | BR-002, BR-003 | Zero credentials detected in repository scans. |

---

## 5. Traceability Matrix

This matrix establishes complete bidirectional traceability linking Business Requirements (BR) to User Requirements (UR), Functional Requirements (FR), and Non-Functional Requirements (NFR).

| Business Requirement (BR) | User Requirement (UR) | Functional Requirement (FR) | Non-Functional Requirement (NFR) | Status |
|---|---|---|---|---|
| BR-001 (Cash Flow Visibility) | UR-001 (Record Item) | FR-001 (Create Item), FR-007 (Entry Form) | NFR-001 (Firestore), NFR-003 (Validation), NFR-007 (Latency) | Approved |
| BR-001 (Cash Flow Visibility) | UR-002 (View Ledger) | FR-002 (List Items), FR-003 (Get Item), FR-008 (Table View) | NFR-001 (Firestore), NFR-007 (Latency), NFR-008 (FCP) | Approved |
| BR-001 (Cash Flow Visibility) | UR-003 (Edit Item) | FR-004 (Update Item), FR-007 (Entry Form) | NFR-001 (Firestore), NFR-003 (Validation), NFR-007 (Latency) | Approved |
| BR-001 (Cash Flow Visibility) | UR-004 (Delete Item) | FR-005 (Delete Item), FR-008 (Table View) | NFR-001 (Firestore), NFR-007 (Latency) | Approved |
| BR-001 (Cash Flow Visibility) | UR-005 (Summary View) | FR-006 (Summary API), FR-009 (Summary Card) | NFR-002 (Precision), NFR-007 (Latency) | Approved |
| BR-002 (Serverless Cloud Topology) | UR-007 (Script Provisioning) | FR-010 (GCP Setup Script), FR-011 (Backend Deploy Script), FR-012 (Frontend Deploy Script) | NFR-004 (Cloud Run), NFR-005 (Firebase Hosting), NFR-006 (CORS), NFR-012 (IAM) | Approved |
| BR-003 (Offline Local Verification) | UR-006 (Offline Testing) | FR-001 through FR-009 | NFR-009 (Backend Offline Tests), NFR-010 (Frontend Offline Tests), NFR-011 (70% Coverage) | Approved |
| BR-004 (Infrastructure Automation) | UR-007 (Script Provisioning) | FR-010 (GCP Setup Script), FR-011 (Backend Deploy Script), FR-012 (Frontend Deploy Script) | NFR-004 (Cloud Run), NFR-005 (Firebase Hosting), NFR-013 (No Hardcoded Secrets) | Approved |

### Orphan & Dead-End Analysis
- **Orphan Requirements:** None. Every functional and non-functional requirement traces to an approved user and business requirement.
- **Dead-End Requirements:** None. Every business requirement produces downstream user, functional, and non-functional requirements.

---

## 6. Out of Scope and Deferred Features

| Excluded Item | Level | Reason | Deferred To |
|---|---|---|---|
| User Authentication & Multi-Tenancy | Business / User | Single-user prototype model prioritized; authentication layers add needless overhead for initial validation. | Phase 2 / v2.0 |
| Multi-Currency and Forex Conversion | User / Functional | Application is designed around a single uniform currency input. | Phase 2 / v2.0 |
| Bank Account Direct Integration | Business / Technical | Regulatory compliance and third-party API licensing are outside current project scope. | Never |
| Continuous Integration (CI) Automation | Operational | Developer-driven local test commands satisfy verification criteria prior to manual script deployment. | Phase 2 |
| Receipt Image Upload and OCR Parsing | Functional / Technical | File storage buckets, vision AI processing, and extraction overhead are deferred. | Future Release |
| Recurring Transaction Schedules | Functional / User | Automated recurrence logic adds scheduling background services out of current scope. | Phase 2 / v2.0 |
| Data Export/Import (CSV, JSON, PDF) | Functional / User | Manual entry and interactive review prioritized for minimum viable capability. | Phase 2 / v2.0 |
| Custom Categories & Subcategory Tags | Functional / User | System uses binary transaction classification (`income` | `expense`) per approved architecture decision. | Phase 2 / v2.0 |

---

## 7. Assumptions and Constraints

### 7.1 Assumptions
1. The user inputs monetary amounts using positive decimal numbers; negative numbers are rejected because transaction direction is determined by the `type` attribute.
2. The deployment operator possesses an active Google Cloud Platform project with billing enabled.
3. The host executing deployment scripts has `bash`, `gcloud`, `firebase-tools`, `docker`, and `node` (npm) installed and configured.
4. The local development system runs Python 3.11+ and Node.js 18+.

### 7.2 Constraints
1. **Directory Structure:**
   - Backend source code and configuration must reside in `backend/`.
   - Frontend source code and configuration must reside in `frontend/`.
   - Cloud deployment and setup shell scripts must reside in `scripts/`.
   - Technical specifications and requirements documents must reside in `docs/` and `specs/`.
2. **Persistence:** Storage must utilize Google Cloud Firestore in Native mode (not Datastore mode).
3. **Execution Runtime:** Backend container must execute on Google Cloud Run listening on port designated by the `$PORT` environment variable (default 8080).
4. **Local Isolation:** Automated test runners must run without network access to Google Cloud services by using mock or in-memory Firestore interfaces.

---

## 8. Glossary

| Term | Definition |
|---|---|
| **Budget Item** | A single financial transaction record containing an identifier, description, monetary amount, date, and type. |
| **Type** | The classification of a budget item, strictly constrained to either `income` or `expense`. |
| **Income** | A positive inflow of money recorded in the budget. |
| **Expense** | A financial outflow or expenditure recorded in the budget. |
| **Net Balance** | The mathematical difference between aggregated total income and aggregated total expenses (`Total Income - Total Expenses`). |
| **Firestore Native Mode** | A NoSQL document database mode in Google Cloud offering real-time updates, client libraries, and sub-collection hierarchies. |
| **Cloud Run** | A managed compute platform in Google Cloud that runs stateless containers invocable via web requests. |
| **Firebase Hosting** | Managed static and dynamic web content hosting configured via `firebase.json`. |
| **In-Memory Mock** | A local software component that simulates database storage in RAM to allow offline test execution without remote cloud connectivity. |
| **RFC 2119** | Standard defining requirement binding levels: `SHALL`/`MUST` (mandatory), `SHOULD` (recommended), `MAY` (optional). |
| **IEEE 29148** | International standard specifying processes and quality criteria for engineering requirements specifications. |

---

## 9. Revision History

| Version | Date | Author | Description of Changes |
|---|---|---|---|
| 1.0 | 2026-10-13 | TJ | Initial comprehensive requirements document for budget tracking application. |
