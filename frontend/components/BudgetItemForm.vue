<script setup lang="ts">
// [spec-budget-app -> BR-001 -> UR-001 -> UR-003 -> FR-001 -> FR-004 -> FR-007 -> NFR-003] Budget item creation and editing form
import { reactive, ref, computed, watch } from 'vue';
import { useBudget, type BudgetItemInput } from '~/composables/useBudget';

const emit = defineEmits<{
  saved: [item: BudgetItemInput];
  cancelled: [];
}>();

const { activeEditItem, createItem, updateItem, setEditItem } = useBudget();

const getTodayDate = (): string => new Date().toISOString().split('T')[0]!;

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

interface FormState {
  description: string;
  amount: string | number;
  date: string;
  type: 'income' | 'expense';
}

const form = reactive<FormState>({
  description: '',
  amount: '',
  date: getTodayDate(),
  type: 'expense',
});

const errors = reactive({
  description: '',
  amount: '',
  date: '',
});

const isSubmitting = ref(false);

const isEditMode = computed(() => activeEditItem.value !== null);

const resetForm = (): void => {
  form.description = '';
  form.amount = '';
  form.date = getTodayDate();
  form.type = 'expense';
  errors.description = '';
  errors.amount = '';
  errors.date = '';
};

watch(
  activeEditItem,
  (item) => {
    if (item) {
      form.description = item.description;
      form.amount = item.amount;
      form.date = item.date;
      form.type = item.type;
      errors.description = '';
      errors.amount = '';
      errors.date = '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const validate = (): boolean => {
  let isValid = true;

  const trimmedDesc = form.description.trim();
  if (trimmedDesc.length === 0) {
    errors.description = 'Description is required';
    isValid = false;
  } else if (trimmedDesc.length > 255) {
    errors.description = 'Description must not exceed 255 characters';
    isValid = false;
  } else {
    errors.description = '';
  }

  const numericAmount = Number(form.amount);
  if (form.amount === '' || isNaN(numericAmount) || numericAmount <= 0) {
    errors.amount = 'Amount must be greater than zero';
    isValid = false;
  } else {
    errors.amount = '';
  }

  if (!form.date || !isValidDateString(form.date)) {
    errors.date = 'Valid date in YYYY-MM-DD format is required';
    isValid = false;
  } else {
    errors.date = '';
  }

  return isValid;
};

const handleSubmit = async (): Promise<void> => {
  if (!validate()) {
    return;
  }

  isSubmitting.value = true;
  const payload: BudgetItemInput = {
    description: form.description.trim(),
    amount: Math.round(Number(form.amount) * 100) / 100,
    date: form.date,
    type: form.type,
  };

  try {
    let success = false;
    if (isEditMode.value && activeEditItem.value) {
      success = await updateItem(activeEditItem.value.id, payload);
    } else {
      success = await createItem(payload);
    }

    if (success) {
      emit('saved', payload);
      resetForm();
    }
  } finally {
    isSubmitting.value = false;
  }
};

const cancelEdit = (): void => {
  setEditItem(null);
  resetForm();
  emit('cancelled');
};

defineExpose({
  form,
  errors,
  isEditMode,
  validate,
  handleSubmit,
  cancelEdit,
  resetForm,
});
</script>

<template>
  <div class="form-card" aria-label="Transaction Entry Form">
    <div class="form-header">
      <h2 class="form-title">
        {{ isEditMode ? 'Edit Transaction' : 'Add New Transaction' }}
      </h2>
      <span v-if="isEditMode" class="badge-editing">Editing Mode</span>
    </div>

    <form @submit.prevent="handleSubmit" novalidate class="budget-form">
      <!-- Transaction Type -->
      <div class="form-group">
        <span id="transaction-type-label" class="form-label">Transaction Type</span>
        <div class="type-toggle" role="radiogroup" aria-labelledby="transaction-type-label">
          <button
            type="button"
            role="radio"
            :aria-checked="form.type === 'expense'"
            class="type-btn"
            :class="{ active: form.type === 'expense', 'expense-active': form.type === 'expense' }"
            data-testid="type-expense"
            @click="form.type = 'expense'"
          >
            Expense
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="form.type === 'income'"
            class="type-btn"
            :class="{ active: form.type === 'income', 'income-active': form.type === 'income' }"
            data-testid="type-income"
            @click="form.type = 'income'"
          >
            Income
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="form-label" for="description">
          Description <span class="required">*</span>
        </label>
        <input
          id="description"
          v-model="form.description"
          type="text"
          name="description"
          maxlength="255"
          placeholder="e.g., Grocery Shopping, Monthly Salary"
          class="form-input"
          :class="{ 'input-error': errors.description }"
          data-testid="input-description"
        />
        <p
          v-if="errors.description"
          class="error-message"
          data-testid="error-description"
        >
          {{ errors.description }}
        </p>
      </div>

      <!-- Amount -->
      <div class="form-group">
        <label class="form-label" for="amount">
          Amount ($) <span class="required">*</span>
        </label>
        <input
          id="amount"
          v-model="form.amount"
          type="number"
          name="amount"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          class="form-input"
          :class="{ 'input-error': errors.amount }"
          data-testid="input-amount"
        />
        <p
          v-if="errors.amount"
          class="error-message"
          data-testid="error-amount"
        >
          {{ errors.amount }}
        </p>
      </div>

      <!-- Date -->
      <div class="form-group">
        <label class="form-label" for="date">
          Date <span class="required">*</span>
        </label>
        <input
          id="date"
          v-model="form.date"
          type="date"
          name="date"
          class="form-input"
          :class="{ 'input-error': errors.date }"
          data-testid="input-date"
        />
        <p
          v-if="errors.date"
          class="error-message"
          data-testid="error-date"
        >
          {{ errors.date }}
        </p>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting"
          data-testid="submit-button"
        >
          {{ isSubmitting ? 'Saving...' : isEditMode ? 'Update Transaction' : 'Add Transaction' }}
        </button>
        <button
          v-if="isEditMode"
          type="button"
          class="btn btn-secondary"
          data-testid="cancel-button"
          @click="cancelEdit"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.badge-editing {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.required {
  color: #dc2626;
}

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.type-btn {
  padding: 0.6rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s ease-in-out;
}

.type-btn.active.expense-active {
  background: #fee2e2;
  color: #b91c1c;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.type-btn.active.income-active {
  background: #dcfce7;
  color: #15803d;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #ffffff;
  min-height: 44px;
  box-sizing: border-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-input.input-error {
  border-color: #dc2626;
  background-color: #fff5f5;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}

.error-message {
  margin: 0;
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}
</style>
