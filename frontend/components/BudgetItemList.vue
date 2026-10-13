<script setup lang="ts">
// [spec-budget-app -> BR-001 -> UR-002 -> UR-004 -> FR-002 -> FR-005 -> FR-008 -> NFR-007] Ledger items table with edit and delete operations
import { computed } from 'vue';
import { useBudget, type BudgetItem } from '~/composables/useBudget';

const emit = defineEmits<{
  edit: [item: BudgetItem];
  delete: [id: string];
}>();

const { items, loading, setEditItem, deleteItem } = useBudget();

const sortedItems = computed<BudgetItem[]>(() => {
  return [...items.value].sort((a, b) => b.date.localeCompare(a.date));
});

const formatAmount = (item: BudgetItem): string => {
  const formatted = item.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return item.type === 'income' ? `+$${formatted}` : `-$${formatted}`;
};

const handleEdit = (item: BudgetItem): void => {
  setEditItem(item);
  emit('edit', item);
};

const handleDelete = async (item: BudgetItem): Promise<void> => {
  const confirmed = typeof window !== 'undefined'
    ? window.confirm('Are you sure you want to delete this budget item?')
    : true;

  if (confirmed) {
    const success = await deleteItem(item.id);
    if (success) {
      emit('delete', item.id);
    }
  }
};

defineExpose({
  sortedItems,
  handleEdit,
  handleDelete,
  formatAmount,
});
</script>

<template>
  <div class="list-card" aria-label="Transaction Ledger">
    <div class="list-header">
      <h2 class="list-title">Transaction Ledger</h2>
      <span class="badge-total">{{ sortedItems.length }} {{ sortedItems.length === 1 ? 'record' : 'records' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && sortedItems.length === 0" class="loading-state" data-testid="ledger-loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading transactions...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading && sortedItems.length === 0"
      class="empty-state"
      data-testid="empty-ledger"
    >
      <div class="empty-icon" aria-hidden="true">📋</div>
      <h3 class="empty-title">No transactions recorded yet</h3>
      <p class="empty-description">
        Use the form above to record your first income or expense transaction.
      </p>
    </div>

    <!-- Populated Ledger List -->
    <div v-else class="table-wrapper">
      <table class="ledger-table" data-testid="ledger-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Type</th>
            <th scope="col" class="text-right">Amount</th>
            <th scope="col" class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in sortedItems"
            :key="item.id"
            class="ledger-row"
            :data-testid="`ledger-row-${item.id}`"
          >
            <td class="col-date">{{ item.date }}</td>
            <td class="col-desc">
              <span class="desc-text">{{ item.description }}</span>
            </td>
            <td class="col-type">
              <span
                class="type-pill"
                :class="item.type === 'income' ? 'pill-income' : 'pill-expense'"
                :data-testid="`type-badge-${item.id}`"
              >
                {{ item.type === 'income' ? 'Income' : 'Expense' }}
              </span>
            </td>
            <td
              class="col-amount text-right"
              :class="item.type === 'income' ? 'text-income' : 'text-expense'"
              :data-testid="`amount-${item.id}`"
            >
              {{ formatAmount(item) }}
            </td>
            <td class="col-actions text-right">
              <div class="action-buttons">
                <button
                  type="button"
                  class="btn-action btn-edit"
                  :data-testid="`edit-button-${item.id}`"
                  aria-label="Edit transaction"
                  @click="handleEdit(item)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="btn-action btn-delete"
                  :data-testid="`delete-button-${item.id}`"
                  aria-label="Delete transaction"
                  @click="handleDelete(item)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.list-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.list-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.badge-total {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #64748b;
  gap: 0.75rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #64748b;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.9rem;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.ledger-table th {
  text-align: left;
  padding: 0.75rem 0.85rem;
  font-weight: 600;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.ledger-table td {
  padding: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.ledger-row:hover {
  background-color: #f8fafc;
}

.col-date {
  white-space: nowrap;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.col-desc {
  color: #0f172a;
  font-weight: 500;
}

.type-pill {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.pill-income {
  background: #dcfce7;
  color: #15803d;
}

.pill-expense {
  background: #fee2e2;
  color: #b91c1c;
}

.col-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.text-income {
  color: #15803d;
}

.text-expense {
  color: #b91c1c;
}

.text-right {
  text-align: right;
}

.action-buttons {
  display: inline-flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-action {
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 36px;
  min-width: 44px;
  transition: all 0.15s ease-in-out;
}

.btn-edit {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.btn-delete:hover {
  background: #fee2e2;
}
</style>
