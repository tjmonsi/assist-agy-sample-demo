// [spec-budget-app -> BR-001 -> FR-001 -> FR-009] Reactive budget state management and API client
import { ref, type Ref } from 'vue';

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface BudgetItemInput {
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

export interface BudgetSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  item_count: number;
}

export interface UseBudgetReturn {
  items: Ref<BudgetItem[]>;
  summary: Ref<BudgetSummary>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  activeEditItem: Ref<BudgetItem | null>;
  fetchItems: (manageLoading?: boolean) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAll: () => Promise<void>;
  createItem: (data: BudgetItemInput) => Promise<boolean>;
  updateItem: (id: string, data: BudgetItemInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  setEditItem: (item: BudgetItem | null) => void;
  clearEditItem: () => void;
  clearError: () => void;
}

// Module-level shared state across components
const items = ref<BudgetItem[]>([]);
const summary = ref<BudgetSummary>({
  total_income: 0,
  total_expenses: 0,
  net_balance: 0,
  item_count: 0,
});
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const activeEditItem = ref<BudgetItem | null>(null);

const resolveApiBaseUrl = (): string => {
  try {
    const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null;
    const url = config?.public?.apiBaseUrl;
    if (typeof url === 'string' && url.length > 0) {
      return url.replace(/\/$/, '');
    }
  } catch {
    // Outside active Nuxt application context
  }

  if (typeof process !== 'undefined' && process.env?.NUXT_PUBLIC_API_BASE_URL) {
    return process.env.NUXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }

  return 'http://localhost:8080';
};

const parseErrorMessage = (errData: unknown, fallback: string): string => {
  if (typeof errData === 'string' && errData.trim().length > 0) {
    return errData;
  }
  if (errData && typeof errData === 'object') {
    if ('detail' in errData) {
      const detail = (errData as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail
          .map((entry: unknown) => {
            if (entry && typeof entry === 'object' && 'msg' in entry) {
              return String((entry as { msg: unknown }).msg);
            }
            return 'Validation error';
          })
          .join(', ');
      }
    }
    if ('message' in errData) {
      const message = (errData as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
  }
  return fallback;
};

// [spec-budget-app -> FR-002 -> UR-002] Retrieve transaction ledger
const fetchItems = async (manageLoading: boolean = true): Promise<void> => {
  if (manageLoading) {
    loading.value = true;
  }
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/items`);
    if (!response.ok) {
      const errBody = await response.text().then(t => { try { return JSON.parse(t); } catch { return t; } }).catch(() => null);
      throw new Error(parseErrorMessage(errBody, `Failed to fetch items (${response.status})`));
    }
    const data: BudgetItem[] = await response.json();
    items.value = data;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Network error while fetching items';
  } finally {
    if (manageLoading) {
      loading.value = false;
    }
  }
};

// [spec-budget-app -> FR-006 -> UR-005] Compute aggregate financial totals
const fetchSummary = async (): Promise<void> => {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/summary`);
    if (!response.ok) {
      const errBody = await response.text().then(t => { try { return JSON.parse(t); } catch { return t; } }).catch(() => null);
      throw new Error(parseErrorMessage(errBody, `Failed to fetch summary (${response.status})`));
    }
    const data: BudgetSummary = await response.json();
    summary.value = data;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Network error while fetching summary';
  }
};

// [spec-budget-app -> FR-007 -> UR-001] Fetch all items and summary concurrently
const fetchAll = async (): Promise<void> => {
  loading.value = true;
  try {
    await Promise.all([fetchItems(false), fetchSummary()]);
  } finally {
    loading.value = false;
  }
};

// [spec-budget-app -> FR-001 -> UR-001] Create a new budget transaction
const createItem = async (data: BudgetItemInput): Promise<boolean> => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errBody = await response.text().then(t => { try { return JSON.parse(t); } catch { return t; } }).catch(() => null);
      throw new Error(parseErrorMessage(errBody, `Failed to create item (${response.status})`));
    }
    await fetchAll();
    return true;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Network error while creating item';
    return false;
  } finally {
    loading.value = false;
  }
};

// [spec-budget-app -> FR-004 -> UR-003] Update an existing budget transaction
const updateItem = async (id: string, data: BudgetItemInput): Promise<boolean> => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errBody = await response.text().then(t => { try { return JSON.parse(t); } catch { return t; } }).catch(() => null);
      throw new Error(parseErrorMessage(errBody, `Failed to update item (${response.status})`));
    }
    activeEditItem.value = null;
    await fetchAll();
    return true;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Network error while updating item';
    return false;
  } finally {
    loading.value = false;
  }
};

// [spec-budget-app -> FR-005 -> UR-004] Remove a budget transaction permanently
const deleteItem = async (id: string): Promise<boolean> => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/api/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errBody = await response.text().then(t => { try { return JSON.parse(t); } catch { return t; } }).catch(() => null);
      throw new Error(parseErrorMessage(errBody, `Failed to delete item (${response.status})`));
    }
    if (activeEditItem.value?.id === id) {
      activeEditItem.value = null;
    }
    await fetchAll();
    return true;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Network error while deleting item';
    return false;
  } finally {
    loading.value = false;
  }
};

// [spec-budget-app -> UR-003] Stage an item for editing in form
const setEditItem = (item: BudgetItem | null): void => {
  activeEditItem.value = item;
};

// [spec-budget-app -> UR-003] Clear active item being edited
const clearEditItem = (): void => {
  activeEditItem.value = null;
};

// Clear active error banner message
const clearError = (): void => {
  error.value = null;
};

// Reset state helper for testing isolation
export const resetBudgetState = (): void => {
  items.value = [];
  summary.value = {
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    item_count: 0,
  };
  loading.value = false;
  error.value = null;
  activeEditItem.value = null;
};

export const useBudget = (): UseBudgetReturn => {
  return {
    items,
    summary,
    loading,
    error,
    activeEditItem,
    fetchItems,
    fetchSummary,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
    setEditItem,
    clearEditItem,
    clearError,
  };
};
