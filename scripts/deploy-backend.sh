#!/usr/bin/env bash
# [spec-budget-app -> BR-002 -> BR-004 -> UR-007 -> FR-011 -> NFR-004 -> NFR-006 -> NFR-007 -> NFR-012 -> NFR-013]
# Cloud Run backend deployment script for Budget Tracking Application
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

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"

if [[ ! -f "${BACKEND_DIR}/Dockerfile" ]]; then
  log_error "Backend Dockerfile not found at ${BACKEND_DIR}/Dockerfile."
  exit 1
fi

# 2. Parameter extraction
PROJECT_ID="${1:-${PROJECT_ID:-}}"
if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  log_error "Google Cloud Project ID is required."
  log_error "Provide it as argument 1, set PROJECT_ID environment variable, or configure 'gcloud config set project <PROJECT_ID>'."
  echo "Usage: $0 [PROJECT_ID] [REGION] [FRONTEND_URL]" >&2
  exit 1
fi

REGION="${2:-${REGION:-us-central1}}"
FRONTEND_URL="${3:-${FRONTEND_URL:-https://${PROJECT_ID}.web.app,https://${PROJECT_ID}.firebaseapp.com,http://localhost:3000}}"

IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/budget-repo/backend:latest"
SA_EMAIL="budget-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
SERVICE_NAME="budget-backend"

log_info "Deploying backend for project: ${PROJECT_ID}"
log_info "Target region:                  ${REGION}"
log_info "Configured CORS origin:         ${FRONTEND_URL}"
log_info "Target container image:         ${IMAGE_TAG}"

# 3. Build container image using Cloud Build
log_info "Submitting container build to Google Cloud Build..."
gcloud builds submit \
  --tag "${IMAGE_TAG}" \
  "${BACKEND_DIR}" \
  --project="${PROJECT_ID}"

# 4. Deploy container image to Google Cloud Run
log_info "Deploying container to Google Cloud Run (${SERVICE_NAME})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --service-account "${SA_EMAIL}" \
  --set-env-vars "^@^FIRESTORE_DATABASE=(default)@CORS_ORIGINS=${FRONTEND_URL}" \
  --min-instances 0 \
  --max-instances 5 \
  --port 8080 \
  --project="${PROJECT_ID}"

# 5. Retrieve deployed service URL
SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --format="value(status.url)" \
  --project="${PROJECT_ID}")"

log_success "Backend deployed successfully to Cloud Run."
echo "================================================================="
echo "Service Name:    ${SERVICE_NAME}"
echo "Service URL:     ${SERVICE_URL}"
echo "CORS Origins:    ${FRONTEND_URL}"
echo "Min Instances:   0 (Scale-to-zero enabled)"
echo "Service Account: ${SA_EMAIL}"
echo "================================================================="
