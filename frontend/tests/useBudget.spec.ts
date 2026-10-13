// [spec-budget-app -> BR-001 -> UR-001..UR-005 -> FR-001..FR-009]
// Unit and acceptance test suite for useBudget reactive composable state management
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useBudget,
  resetBudgetState,
  type BudgetItem,
  type BudgetItemInput,
  type BudgetSummary,
} from '~/composables/useBudget';

/**
 * Creates a mocked Response object adhering to Fetch API specifications.
 */
function createMockResponse(
  status: number,
  data: unknown,
  ok?: boolean
): Response {
  const isOk = ok !== undefined ? ok : status >= 200 && status < 300;
  return {
    ok: isOk,
    status,
    statusText: isOk ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as unknown as Response;
}

describe('useBudget Composable Acceptance Tests', () => {
  const sampleItem1: BudgetItem = {
    id: 'item-101',
    description: 'Monthly Salary',
    amount: 3500.0,
    date: '2026-10-01',
    type: 'income',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  };

  const sampleItem2: BudgetItem = {
    id: 'item-102',
    description: 'Apartment Rent',
    amount: 1200.0,
    date: '2026-10-05',
    type: 'expense',
    created_at: '2026-10-05T09:00:00Z',
    updated_at: '2026-10-05T09:00:00Z',
  };

  const sampleSummary: BudgetSummary = {
    total_income: 3500.0,
    total_expenses: 1200.0,
    net_balance: 2300.0,
    item_count: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetBudgetState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Initial State
  // =========================================================================
  describe('Initial State', () => {
    // [AC-2 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Boundary / Null: Verifies initial reactive state contract before any network interaction
    it('should initialize with empty items, zeroed summary, loading false, error null, and activeEditItem null', () => {
      const { items, summary, loading, error, activeEditItem } = useBudget();

      expect(items.value).toEqual([]);
      expect(summary.value).toEqual({
        total_income: 0,
        total_expenses: 0,
        net_balance: 0,
        item_count: 0,
      });
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(activeEditItem.value).toBeNull();
    });
  });

  // =========================================================================
  // 2. fetchItems Method
  // =========================================================================
  describe('fetchItems', () => {
    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Valid / Happy path: Successfully fetches populated item array and updates state
    it('should fetch items successfully, update items ref, and reset loading to false', async () => {
      const itemsPayload = [sampleItem1, sampleItem2];
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, itemsPayload));
      vi.stubGlobal('fetch', fetchMock);

      const { items, loading, error, fetchItems } = useBudget();

      await fetchItems();

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/items'));
      expect(items.value).toEqual(itemsPayload);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    // [AC-2 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Boundary: Empty list returned when repository has zero budget items
    it('should handle empty transaction list successfully and set items ref to empty array', async () => {
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, []));
      vi.stubGlobal('fetch', fetchMock);

      const { items, loading, error, fetchItems } = useBudget();

      await fetchItems();

      expect(items.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Valid: manageLoading=false should not overwrite existing loading state
    it('should respect manageLoading=false argument and not toggle loading ref', async () => {
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, [sampleItem1]));
      vi.stubGlobal('fetch', fetchMock);

      const { loading, fetchItems } = useBudget();
      loading.value = false;

      await fetchItems(false);

      expect(loading.value).toBe(false);
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Invalid / HTTP Error: 500 Internal Server Error sets error ref
    it('should set error ref when fetchItems receives HTTP 500 response', async () => {
      const errorPayload = { detail: 'Internal database connection failed' };
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(500, errorPayload, false));
      vi.stubGlobal('fetch', fetchMock);

      const { items, loading, error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toContain('Internal database connection failed');
      expect(items.value).toEqual([]);
      expect(loading.value).toBe(false);
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Invalid / HTTP Error: 404 response with fallback status code text
    it('should set error ref with fallback message when HTTP error has no structured message', async () => {
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(404, {}, false));
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toMatch(/Failed to fetch items \(404\)/i);
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Error / Network Failure: Rejection during network transmission sets error ref
    it('should set error ref when network request fails abruptly', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network connection refused'));
      vi.stubGlobal('fetch', fetchMock);

      const { loading, error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toBe('Network connection refused');
      expect(loading.value).toBe(false);
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Error / Non-Error thrown rejection
    it('should handle non-Error exception gracefully when network throws string', async () => {
      const fetchMock = vi.fn().mockRejectedValue('Unknown network error');
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toContain('Network error while fetching items');
    });
  });

  // =========================================================================
  // 3. fetchSummary Method
  // =========================================================================
  describe('fetchSummary', () => {
    // [AC-1 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Valid / Happy path: Retrieves computed financial summary and updates summary ref
    it('should fetch summary successfully and update summary ref', async () => {
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, sampleSummary));
      vi.stubGlobal('fetch', fetchMock);

      const { summary, error, fetchSummary } = useBudget();

      await fetchSummary();

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/summary'));
      expect(summary.value).toEqual(sampleSummary);
      expect(error.value).toBeNull();
    });

    // [AC-2 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Boundary: Zero totals on empty store
    it('should handle zero totals summary on empty store', async () => {
      const emptySummary: BudgetSummary = {
        total_income: 0.0,
        total_expenses: 0.0,
        net_balance: 0.0,
        item_count: 0,
      };
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, emptySummary));
      vi.stubGlobal('fetch', fetchMock);

      const { summary, fetchSummary } = useBudget();

      await fetchSummary();

      expect(summary.value).toEqual(emptySummary);
    });

    // [AC-3 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Boundary: Deficit net balance where expenses exceed income
    it('should update summary with negative net balance correctly', async () => {
      const deficitSummary: BudgetSummary = {
        total_income: 100.0,
        total_expenses: 350.0,
        net_balance: -250.0,
        item_count: 2,
      };
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(200, deficitSummary));
      vi.stubGlobal('fetch', fetchMock);

      const { summary, fetchSummary } = useBudget();

      await fetchSummary();

      expect(summary.value.net_balance).toBe(-250.0);
    });

    // [AC-1 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Invalid / HTTP Error: 500 response sets error ref
    it('should set error ref when fetchSummary receives HTTP 500 error', async () => {
      const errorPayload = { detail: 'Summary calculation engine failure' };
      const fetchMock = vi.fn().mockResolvedValue(createMockResponse(500, errorPayload, false));
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchSummary } = useBudget();

      await fetchSummary();

      expect(error.value).toContain('Summary calculation engine failure');
    });

    // [AC-1 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Error / Network Failure: Network failure during summary retrieval sets error ref
    it('should set error ref when fetchSummary encounters network failure', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Summary service unavailable'));
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchSummary } = useBudget();

      await fetchSummary();

      expect(error.value).toBe('Summary service unavailable');
    });

    // [AC-1 | spec-budget-app | FR-006 | UR-005 | BR-001]
    // Error / Non-Error thrown rejection
    it('should handle non-Error network failure during summary retrieval gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue('Fatal network drop');
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchSummary } = useBudget();

      await fetchSummary();

      expect(error.value).toContain('Network error while fetching summary');
    });
  });

  // =========================================================================
  // 4. fetchAll Method
  // =========================================================================
  describe('fetchAll', () => {
    // [AC-1 | spec-budget-app | FR-002 | FR-006 | UR-002 | UR-005 | BR-001]
    // Valid / Happy path: Concurrent dispatch of items and summary with loading management
    it('should concurrently fetch items and summary, updating both states and toggling loading', async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/items')) {
          return Promise.resolve(createMockResponse(200, [sampleItem1]));
        }
        if (url.includes('/api/summary')) {
          return Promise.resolve(createMockResponse(200, sampleSummary));
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { items, summary, loading, error, fetchAll } = useBudget();

      await fetchAll();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(items.value).toEqual([sampleItem1]);
      expect(summary.value).toEqual(sampleSummary);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    // [AC-1 | spec-budget-app | FR-002 | FR-006 | UR-002 | UR-005 | BR-001]
    // Error: Concurrently resets loading to false even if one of the endpoints fails
    it('should ensure loading is reset to false when an endpoint fails during fetchAll', async () => {
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/items')) {
          return Promise.resolve(createMockResponse(500, { detail: 'Server fault' }, false));
        }
        return Promise.resolve(createMockResponse(200, sampleSummary));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { loading, error, fetchAll } = useBudget();

      await fetchAll();

      expect(loading.value).toBe(false);
      expect(error.value).toBeTruthy();
    });
  });

  // =========================================================================
  // 5. createItem Method
  // =========================================================================
  describe('createItem', () => {
    const validPayload: BudgetItemInput = {
      description: 'Consulting Fee',
      amount: 1500.0,
      date: '2026-10-15',
      type: 'income',
    };

    // [AC-1 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Valid / Happy path: 201 Created POSTs payload, triggers fetchAll refresh, returns true
    it('should create an item, refresh all state, and return true upon 201 Created', async () => {
      const createdItem: BudgetItem = {
        id: 'item-created-1',
        ...validPayload,
        created_at: '2026-10-15T12:00:00Z',
        updated_at: '2026-10-15T12:00:00Z',
      };

      const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/api/items') && init?.method === 'POST') {
          return Promise.resolve(createMockResponse(201, createdItem));
        }
        if (url.includes('/api/items') && (!init?.method || init.method === 'GET')) {
          return Promise.resolve(createMockResponse(200, [createdItem]));
        }
        if (url.includes('/api/summary')) {
          return Promise.resolve(createMockResponse(200, {
            total_income: 1500.0,
            total_expenses: 0.0,
            net_balance: 1500.0,
            item_count: 1,
          }));
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { items, summary, error, createItem } = useBudget();

      const success = await createItem(validPayload);

      expect(success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/items'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(validPayload),
        })
      );
      expect(items.value).toEqual([createdItem]);
      expect(summary.value.total_income).toBe(1500.0);
      expect(error.value).toBeNull();
    });

    // [AC-1 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Boundary: Minimum allowed positive amount (0.01)
    it('should create an expense item with minimum allowed positive boundary amount', async () => {
      const boundaryPayload: BudgetItemInput = {
        description: 'Microtransaction',
        amount: 0.01,
        date: '2026-10-15',
        type: 'expense',
      };

      const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/api/items') && init?.method === 'POST') {
          return Promise.resolve(createMockResponse(201, { id: 'item-micro', ...boundaryPayload }));
        }
        return Promise.resolve(createMockResponse(200, []));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { createItem } = useBudget();
      const success = await createItem(boundaryPayload);

      expect(success).toBe(true);
    });

    // [AC-2 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Invalid: HTTP 422 Rejection on invalid transaction type
    it('should set error ref and return false when server rejects invalid transaction type with 422', async () => {
      const invalidPayload = {
        description: 'Crypto Reward',
        amount: 250.0,
        date: '2026-10-15',
        type: 'invalid-type' as 'income',
      };

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(422, { detail: 'Type must be income or expense' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(invalidPayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Type must be income or expense');
    });

    // [AC-3 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Invalid: HTTP 422 Rejection on zero or negative amount
    it('should set error ref and return false when server rejects non-positive amount with 422', async () => {
      const negativePayload: BudgetItemInput = {
        description: 'Fee Error',
        amount: -50.0,
        date: '2026-10-15',
        type: 'expense',
      };

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(422, { detail: 'Amount must be greater than zero' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(negativePayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Amount must be greater than zero');
    });

    // [AC-4 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Invalid: HTTP 422 Rejection on blank description or malformed date
    it('should set error ref and return false when server rejects blank description', async () => {
      const blankPayload: BudgetItemInput = {
        description: '   ',
        amount: 25.0,
        date: '2026-10-15',
        type: 'expense',
      };

      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(422, { detail: 'Description cannot be blank' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(blankPayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Description cannot be blank');
    });

    // [AC-1 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Error: HTTP 500 Internal server error returns false and sets error ref
    it('should set error ref and return false when server responds with HTTP 500 on createItem', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(500, { detail: 'Firestore write failed' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(validPayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Firestore write failed');
    });

    // [AC-1 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Error: Network exception during createItem returns false and populates error ref
    it('should return false and set error ref when network failure occurs during createItem', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'));
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(validPayload);

      expect(success).toBe(false);
      expect(error.value).toBe('Network offline');
    });

    // [AC-1 | spec-budget-app | FR-001 | UR-001 | BR-001]
    // Error: Non-Error exception thrown during createItem
    it('should handle non-Error rejection during createItem gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue('Fatal network drop');
      vi.stubGlobal('fetch', fetchMock);

      const { error, createItem } = useBudget();

      const success = await createItem(validPayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Network error while creating item');
    });
  });

  // =========================================================================
  // 6. updateItem Method
  // =========================================================================
  describe('updateItem', () => {
    const updatePayload: BudgetItemInput = {
      description: 'Weekly Groceries Updated',
      amount: 85.5,
      date: '2026-10-12',
      type: 'expense',
    };

    // [AC-1 | spec-budget-app | FR-004 | UR-003 | BR-001]
    // Valid / Happy path: 200 OK updates item, refreshes state, clears activeEditItem, returns true
    it('should send PUT request, refresh state, clear activeEditItem, and return true upon 200 OK', async () => {
      const updatedItem: BudgetItem = {
        id: 'item-101',
        ...updatePayload,
        created_at: '2026-10-01T08:00:00Z',
        updated_at: '2026-10-12T10:00:00Z',
      };

      const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/api/items/item-101') && init?.method === 'PUT') {
          return Promise.resolve(createMockResponse(200, updatedItem));
        }
        if (url.includes('/api/items') && (!init?.method || init.method === 'GET')) {
          return Promise.resolve(createMockResponse(200, [updatedItem]));
        }
        if (url.includes('/api/summary')) {
          return Promise.resolve(createMockResponse(200, sampleSummary));
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { activeEditItem, setEditItem, error, updateItem } = useBudget();
      setEditItem(sampleItem1);
      expect(activeEditItem.value).toEqual(sampleItem1);

      const success = await updateItem('item-101', updatePayload);

      expect(success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/item-101'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(updatePayload),
        })
      );
      expect(activeEditItem.value).toBeNull();
      expect(error.value).toBeNull();
    });

    // [AC-2 | spec-budget-app | FR-004 | UR-003 | BR-001]
    // Invalid / Error: HTTP 404 Not Found sets error ref and returns false
    it('should return false and set error ref when updating non-existent item returns 404', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(404, { detail: 'Budget item not found' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, updateItem } = useBudget();

      const success = await updateItem('item-non-existent', updatePayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Budget item not found');
    });

    // [AC-3 | spec-budget-app | FR-004 | UR-003 | BR-001]
    // Invalid / Error: HTTP 422 Unprocessable Entity sets error ref and returns false
    it('should return false and set error ref when update payload is rejected with 422', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(422, { detail: 'Amount must be greater than zero' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, updateItem } = useBudget();

      const success = await updateItem('item-101', {
        ...updatePayload,
        amount: -20.0,
      });

      expect(success).toBe(false);
      expect(error.value).toContain('Amount must be greater than zero');
    });

    // [AC-1 | spec-budget-app | FR-004 | UR-003 | BR-001]
    // Error: Network exception during updateItem returns false and sets error ref
    it('should return false and set error ref when network failure occurs during updateItem', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Connection timed out'));
      vi.stubGlobal('fetch', fetchMock);

      const { error, updateItem } = useBudget();

      const success = await updateItem('item-101', updatePayload);

      expect(success).toBe(false);
      expect(error.value).toBe('Connection timed out');
    });

    // [AC-1 | spec-budget-app | FR-004 | UR-003 | BR-001]
    // Error: Non-Error exception thrown during updateItem
    it('should handle non-Error rejection during updateItem gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue('Fatal network drop');
      vi.stubGlobal('fetch', fetchMock);

      const { error, updateItem } = useBudget();

      const success = await updateItem('item-101', updatePayload);

      expect(success).toBe(false);
      expect(error.value).toContain('Network error while updating item');
    });
  });

  // =========================================================================
  // 7. deleteItem Method
  // =========================================================================
  describe('deleteItem', () => {
    // [AC-1 | spec-budget-app | FR-005 | UR-004 | BR-001]
    // Valid / Happy path: 204 No Content deletes item, refreshes state, returns true
    it('should send DELETE request, refresh all state, and return true upon 204 No Content', async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/api/items/item-102') && init?.method === 'DELETE') {
          return Promise.resolve(createMockResponse(204, null));
        }
        if (url.includes('/api/items') && (!init?.method || init.method === 'GET')) {
          return Promise.resolve(createMockResponse(200, [sampleItem1]));
        }
        if (url.includes('/api/summary')) {
          return Promise.resolve(createMockResponse(200, {
            total_income: 3500.0,
            total_expenses: 0.0,
            net_balance: 3500.0,
            item_count: 1,
          }));
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
      vi.stubGlobal('fetch', fetchMock);

      const { items, error, deleteItem } = useBudget();
      items.value = [sampleItem1, sampleItem2];

      const success = await deleteItem('item-102');

      expect(success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/item-102'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(items.value).toEqual([sampleItem1]);
      expect(error.value).toBeNull();
    });

    // [AC-2 | spec-budget-app | FR-005 | UR-004 | BR-001]
    // Invalid / Error: HTTP 404 Not Found sets error ref and returns false
    it('should return false and set error ref when deleting non-existent item returns 404', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(404, { detail: 'Item item-999 not found' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, deleteItem } = useBudget();

      const success = await deleteItem('item-999');

      expect(success).toBe(false);
      expect(error.value).toContain('Item item-999 not found');
    });

    // [AC-1 | spec-budget-app | FR-005 | UR-004 | BR-001]
    // Error: HTTP 500 server error sets error ref and returns false
    it('should return false and set error ref when delete returns HTTP 500', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(500, { detail: 'Database deletion fault' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, deleteItem } = useBudget();

      const success = await deleteItem('item-102');

      expect(success).toBe(false);
      expect(error.value).toContain('Database deletion fault');
    });

    // [AC-1 | spec-budget-app | FR-005 | UR-004 | BR-001]
    // Error: Network exception during deleteItem sets error ref and returns false
    it('should return false and set error ref when network failure occurs during deleteItem', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network lost'));
      vi.stubGlobal('fetch', fetchMock);

      const { error, deleteItem } = useBudget();

      const success = await deleteItem('item-102');

      expect(success).toBe(false);
      expect(error.value).toBe('Network lost');
    });

    // [AC-1 | spec-budget-app | FR-005 | UR-004 | BR-001]
    // Error: Non-Error exception thrown during deleteItem
    it('should handle non-Error rejection during deleteItem gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue('Fatal network drop');
      vi.stubGlobal('fetch', fetchMock);

      const { error, deleteItem } = useBudget();

      const success = await deleteItem('item-102');

      expect(success).toBe(false);
      expect(error.value).toContain('Network error while deleting item');
    });
  });

  // =========================================================================
  // 8. setEditItem and clearEditItem Methods
  // =========================================================================
  describe('setEditItem and clearEditItem', () => {
    // [AC-1 | spec-budget-app | FR-007 | FR-008 | UR-003 | BR-001]
    // Valid: Sets activeEditItem to selected item
    it('should set activeEditItem to the specified budget item', () => {
      const { activeEditItem, setEditItem } = useBudget();

      setEditItem(sampleItem1);

      expect(activeEditItem.value).toEqual(sampleItem1);
    });

    // [AC-1 | spec-budget-app | FR-007 | FR-008 | UR-003 | BR-001]
    // Boundary / Null: setEditItem(null) clears activeEditItem
    it('should allow setting activeEditItem to null', () => {
      const { activeEditItem, setEditItem } = useBudget();
      setEditItem(sampleItem1);
      expect(activeEditItem.value).not.toBeNull();

      setEditItem(null);

      expect(activeEditItem.value).toBeNull();
    });

    // [AC-1 | spec-budget-app | FR-007 | FR-008 | UR-003 | BR-001]
    // Valid: clearEditItem resets activeEditItem to null
    it('should reset activeEditItem to null when clearEditItem is called', () => {
      const { activeEditItem, setEditItem, clearEditItem } = useBudget();
      setEditItem(sampleItem2);
      expect(activeEditItem.value).toEqual(sampleItem2);

      clearEditItem();

      expect(activeEditItem.value).toBeNull();
    });
  });

  // =========================================================================
  // 9. clearError Method
  // =========================================================================
  describe('clearError', () => {
    // [AC-1 | spec-budget-app | FR-007 | UR-001 | BR-001]
    // Valid: Resets error ref from an existing error message to null
    it('should reset error to null when an error message is currently present', () => {
      const { error, clearError } = useBudget();
      error.value = 'Validation failed on input form';

      clearError();

      expect(error.value).toBeNull();
    });

    // [AC-1 | spec-budget-app | FR-007 | UR-001 | BR-001]
    // Boundary / Null: Calling clearError when error is already null leaves it null
    it('should keep error as null when clearError is called with no existing error', () => {
      const { error, clearError } = useBudget();
      error.value = null;

      clearError();

      expect(error.value).toBeNull();
    });
  });

  // =========================================================================
  // 10. parseErrorMessage fallback branches
  // =========================================================================
  describe('Error Message Parsing Branches', () => {
    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Valid: Parses { message: 'string' } formatted server errors
    it('should parse message field from error response if detail is absent', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(400, { message: 'Bad syntax in request' }, false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toBe('Bad syntax in request');
    });

    // [AC-1 | spec-budget-app | FR-002 | UR-002 | BR-001]
    // Valid: Parses raw string error response body
    it('should handle raw string error body', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        createMockResponse(502, 'Bad Gateway upstream error', false)
      );
      vi.stubGlobal('fetch', fetchMock);

      const { error, fetchItems } = useBudget();

      await fetchItems();

      expect(error.value).toBe('Bad Gateway upstream error');
    });
  });
});
