# Architecture Decisions

## 2026-10-13: Budget Tracking Full-Stack Architecture

Decision: Build the application with a FastAPI backend deployed to Google Cloud Run and a Nuxt 4/Vue 3 frontend deployed to Firebase Hosting, backed by Firestore Native.
Plan: .agent/main-plan/plan-budget-app-20261013-155200.md

## 2026-10-13: Budget Item Data Model and Summary Calculation

Decision: Budget items will store an explicit type field (`income` | `expense`) alongside description, numeric amount, and date to facilitate straightforward summary computation and clear user interaction.
Plan: .agent/main-plan/plan-budget-app-20261013-155200.md

## 2026-10-13: Local Test Isolation without Cloud Dependencies

Decision: Backend and frontend local tests will run offline without requiring active Google Cloud credentials by utilizing mock/in-memory Firestore interfaces and standard unit/component test runners.
Plan: .agent/main-plan/plan-budget-app-20261013-155200.md
