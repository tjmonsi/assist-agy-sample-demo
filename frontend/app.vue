<script setup lang="ts">
// [spec-budget-app -> BR-001 -> UR-001 -> UR-005 -> FR-007 -> FR-008 -> FR-009 -> NFR-008] Root application shell
import { useBudget } from '~/composables/useBudget';

const { error, clearError } = useBudget();
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <span class="brand-icon" aria-hidden="true">💳</span>
          <h1 class="brand-title">Budget Tracker</h1>
        </div>
        <nav class="header-nav">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            class="repo-link"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>

    <div
      v-if="error"
      class="global-error-container"
      role="alert"
      data-testid="global-error-banner"
    >
      <div class="global-error-banner">
        <div class="banner-message">
          <span class="banner-icon" aria-hidden="true">⚠️</span>
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          class="btn-banner-dismiss"
          data-testid="global-dismiss-error"
          @click="clearError"
        >
          Dismiss
        </button>
      </div>
    </div>

    <div class="main-container">
      <NuxtPage />
    </div>

    <footer class="app-footer">
      <div class="footer-container">
        <p>Budget Tracker: Serverless Full-Stack Financial Ledger</p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global Application Reset and Base Theme Styles */
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text-main: #0f172a;
  --color-text-muted: #64748b;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-income: #15803d;
  --color-income-bg: #dcfce7;
  --color-expense: #b91c1c;
  --color-expense-bg: #fee2e2;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--color-bg);
  color: var(--color-text-main);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin: 0;
  letter-spacing: -0.02em;
}

.header-nav {
  display: flex;
  align-items: center;
}

.repo-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: color 0.15s, background-color 0.15s;
}

.repo-link:hover {
  color: var(--color-text-main);
  background-color: #f1f5f9;
}

.global-error-container {
  max-width: 1200px;
  margin: 1rem auto 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

.global-error-banner {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.banner-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-banner-dismiss {
  background: transparent;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.3rem 0.65rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-banner-dismiss:hover {
  background-color: #fee2e2;
}

.main-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  flex: 1;
}

.app-footer {
  background-color: #ffffff;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>
