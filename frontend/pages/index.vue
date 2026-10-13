<script setup lang="ts">
// [spec-budget-app -> BR-001 -> UR-001 -> UR-002 -> UR-003 -> UR-004 -> UR-005 -> FR-007 -> FR-008 -> FR-009] Main dashboard page layout
import { onMounted } from 'vue';
import { useBudget } from '~/composables/useBudget';
import BudgetSummary from '~/components/BudgetSummary.vue';
import BudgetItemForm from '~/components/BudgetItemForm.vue';
import BudgetItemList from '~/components/BudgetItemList.vue';

const { fetchAll } = useBudget();

onMounted(async () => {
  await fetchAll();
});
</script>

<template>
  <main class="dashboard-page" aria-label="Budget Tracker Dashboard">
    <!-- Summary Metrics Section -->
    <section class="section-summary">
      <BudgetSummary />
    </section>

    <!-- Interactive Ledger and Form Grid -->
    <section class="dashboard-grid">
      <div class="grid-form">
        <BudgetItemForm />
      </div>
      <div class="grid-list">
        <BudgetItemList />
      </div>
    </section>
  </main>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.section-summary {
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 380px 1fr;
  }
}
</style>
