<script setup lang="ts">
// [spec-budget-app -> BR-001 -> UR-005 -> FR-006 -> FR-009] Financial summary cards and balance indicator
import { useBudget } from '~/composables/useBudget';

const { summary, loading } = useBudget();

const formatCurrency = (val: number): string => {
  const isNegative = val < 0;
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
};

defineExpose({ formatCurrency });
</script>

<template>
  <section class="summary-section" aria-label="Financial Summary">
    <div class="summary-header">
      <h2 class="summary-heading">Summary Overview</h2>
      <div class="count-badge" data-testid="item-count">
        {{ summary.item_count }} {{ summary.item_count === 1 ? 'transaction' : 'transactions' }}
      </div>
    </div>

    <div v-if="loading" class="summary-grid" data-testid="summary-loading">
      <div class="metric-card skeleton-card">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
      </div>
      <div class="metric-card skeleton-card">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
      </div>
      <div class="metric-card skeleton-card">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
      </div>
    </div>

    <div v-else class="summary-grid">
      <div class="metric-card income-card" data-testid="summary-income">
        <div class="metric-label">
          <span class="indicator income-indicator" aria-hidden="true"></span>
          Total Income
        </div>
        <div class="metric-value income-value">
          {{ formatCurrency(summary.total_income) }}
        </div>
      </div>

      <div class="metric-card expense-card" data-testid="summary-expenses">
        <div class="metric-label">
          <span class="indicator expense-indicator" aria-hidden="true"></span>
          Total Expenses
        </div>
        <div class="metric-value expense-value">
          {{ formatCurrency(summary.total_expenses) }}
        </div>
      </div>

      <div
        class="metric-card balance-card"
        :class="summary.net_balance >= 0 ? 'positive balance-positive' : 'negative balance-negative'"
        data-testid="summary-balance"
      >
        <div class="metric-label">
          <span
            class="indicator"
            :class="summary.net_balance >= 0 ? 'income-indicator' : 'expense-indicator'"
            aria-hidden="true"
          ></span>
          Net Balance
        </div>
        <div
          class="metric-value balance-value"
          :class="summary.net_balance >= 0 ? 'text-positive' : 'text-negative'"
        >
          {{ formatCurrency(summary.net_balance) }}
        </div>
        <div class="balance-tag" :class="summary.net_balance >= 0 ? 'tag-positive' : 'tag-negative'">
          {{ summary.net_balance >= 0 ? 'Surplus' : 'Deficit' }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.summary-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.summary-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.count-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.metric-card {
  padding: 1.25rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.income-card {
  border-left: 4px solid #16a34a;
}

.expense-card {
  border-left: 4px solid #dc2626;
}

.balance-card.positive {
  border-left: 4px solid #16a34a;
  background: #f0fdf4;
}

.balance-card.negative {
  border-left: 4px solid #dc2626;
  background: #fef2f2;
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.income-indicator {
  background-color: #16a34a;
}

.expense-indicator {
  background-color: #dc2626;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.income-value {
  color: #15803d;
}

.expense-value {
  color: #b91c1c;
}

.balance-value.text-positive {
  color: #15803d;
}

.balance-value.text-negative {
  color: #b91c1c;
}

.balance-tag {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.tag-positive {
  background: #dcfce7;
  color: #166534;
}

.tag-negative {
  background: #fee2e2;
  color: #991b1b;
}

.skeleton-card {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-label {
  height: 1rem;
  width: 50%;
  background: #e2e8f0;
  border-radius: 4px;
}

.skeleton-value {
  height: 2rem;
  width: 75%;
  background: #e2e8f0;
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
