#!/usr/bin/env bash
# [spec-budget-app -> BR-002 -> BR-004 -> UR-007 -> FR-010 -> NFR-001 -> NFR-012 -> NFR-013]
# Google Cloud project provisioning script for Budget Tracking Application
set -euo pipefail

# Log formatting helpers
log_info() {
  echo "[INFO] $*"
}

log_error() {
  echo "[ERROR] $*" >&2
}

log_success() {
  echo "[SUCCESS] $*"
}

# 1. Prerequisite validation
if ! command -v gcloud >/dev/null 2>&1; then
  log_error "Google Cloud CLI ('gcloud') is not installed or not in PATH."
  log_error "Install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 2. Project ID resolution
PROJECT_ID="${1:-${PROJECT_ID:-}}"
if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  log_error "Google Cloud Project ID is required."
  log_error "Provide it as argument 1, set PROJECT_ID environment variable, or configure 'gcloud config set project <PROJECT_ID>'."
  echo "Usage: $0 [PROJECT_ID] [REGION]" >&2
  exit 1
fi

REGION="${2:-${REGION:-us-central1}}"

log_info "Target GCP Project: ${PROJECT_ID}"
log_info "Target Region: ${REGION}"

# 3. Enable required GCP Service APIs
log_info "Enabling required APIs (Cloud Run, Firestore, Cloud Build, Artifact Registry)..."
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}"

# 4. Provision Firestore Native Database
log_info "Checking Firestore Native database status..."
if gcloud firestore databases describe --project="${PROJECT_ID}" --database="(default)" >/dev/null 2>&1; then
  log_info "Firestore database '(default)' already exists."
else
  log_info "Creating Firestore Native database '(default)' in region '${REGION}'..."
  gcloud firestore databases create \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --type=firestore-native
fi

# 5. Provision Artifact Registry Docker Repository
REPO_NAME="budget-repo"
log_info "Checking Artifact Registry repository '${REPO_NAME}'..."
if gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  log_info "Artifact Registry repository '${REPO_NAME}' already exists."
else
  log_info "Creating Artifact Registry repository '${REPO_NAME}' in '${REGION}'..."
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for budget app backend" \
    --project="${PROJECT_ID}"
fi

# 6. Provision Service Account and IAM Binding
SA_NAME="budget-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
log_info "Checking runtime service account '${SA_NAME}'..."
if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  log_info "Service account '${SA_NAME}' already exists."
else
  log_info "Creating service account '${SA_NAME}'..."
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Budget Backend Service Account" \
    --project="${PROJECT_ID}"
fi

log_info "Binding least-privilege role 'roles/datastore.user' to '${SA_EMAIL}'..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

log_success "Google Cloud infrastructure provisioned successfully."
echo "================================================================="
echo "Project ID:        ${PROJECT_ID}"
echo "Region:            ${REGION}"
echo "Firestore Mode:    Native ((default) database)"
echo "Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"
echo "Service Account:   ${SA_EMAIL}"
echo "Assigned Role:     roles/datastore.user"
echo "================================================================="
