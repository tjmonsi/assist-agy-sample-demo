#!/usr/bin/env bash
# [spec-budget-app -> BR-002 -> BR-004 -> UR-007 -> FR-012 -> NFR-005 -> NFR-008 -> NFR-013]
# Firebase Hosting frontend deployment script for Budget Tracking Application
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
if ! command -v npm >/dev/null 2>&1; then
  log_error "Node Package Manager ('npm') is not installed or not in PATH."
  exit 1
fi

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_CMD=(firebase)
elif command -v npx >/dev/null 2>&1; then
  FIREBASE_CMD=(npx --yes firebase-tools)
else
  log_error "Neither 'firebase' CLI nor 'npx' is available in PATH."
  log_error "Install Firebase CLI via 'npm install -g firebase-tools' or install Node.js/npx."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${REPO_ROOT}/frontend"
FIREBASE_CONFIG="${REPO_ROOT}/firebase.json"

if [[ ! -f "${FIREBASE_CONFIG}" ]]; then
  log_error "Firebase configuration not found at ${FIREBASE_CONFIG}."
  exit 1
fi

# 2. Parameter extraction
PROJECT_ID="${1:-${PROJECT_ID:-}}"
if [[ -z "${PROJECT_ID}" ]]; then
  if command -v gcloud >/dev/null 2>&1; then
    PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
  fi
fi

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  log_error "Google Cloud Project ID is required."
  log_error "Provide it as argument 1, set PROJECT_ID environment variable, or configure 'gcloud config set project <PROJECT_ID>'."
  echo "Usage: $0 [PROJECT_ID] [BACKEND_URL]" >&2
  exit 1
fi

BACKEND_URL="${2:-${BACKEND_URL:-}}"
if [[ -z "${BACKEND_URL}" ]]; then
  log_error "Backend API URL is required."
  log_error "Provide it as argument 2 or set BACKEND_URL environment variable (e.g. https://budget-backend-xxx.run.app)."
  echo "Usage: $0 [PROJECT_ID] [BACKEND_URL]" >&2
  exit 1
fi

log_info "Deploying frontend for project: ${PROJECT_ID}"
log_info "Backend API base URL:           ${BACKEND_URL}"

# 3. Build static Nuxt 4 application
if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  log_info "Frontend node_modules not found. Installing dependencies via 'npm install'..."
  npm --prefix "${FRONTEND_DIR}" install
fi

log_info "Compiling static SPA bundle via 'npm run generate'..."
NUXT_PUBLIC_API_BASE_URL="${BACKEND_URL}" npm --prefix "${FRONTEND_DIR}" run generate

DIST_INDEX="${FRONTEND_DIR}/.output/public/index.html"
if [[ ! -f "${DIST_INDEX}" ]]; then
  log_error "Static generation verification failed: ${DIST_INDEX} not found."
  exit 1
fi
log_info "Static bundle generated successfully at ${FRONTEND_DIR}/.output/public."

# 4. Deploy static bundle to Firebase Hosting
log_info "Deploying hosting target using ${FIREBASE_CMD[*]}..."
(
  cd "${REPO_ROOT}"
  "${FIREBASE_CMD[@]}" deploy --only hosting --project "${PROJECT_ID}"
)

HOSTING_URL="https://${PROJECT_ID}.web.app"
log_success "Frontend deployed successfully to Firebase Hosting."
echo "================================================================="
echo "Project ID:      ${PROJECT_ID}"
echo "Backend API URL: ${BACKEND_URL}"
echo "Hosting URL:     ${HOSTING_URL}"
echo "Alt Hosting URL: https://${PROJECT_ID}.firebaseapp.com"
echo "================================================================="
