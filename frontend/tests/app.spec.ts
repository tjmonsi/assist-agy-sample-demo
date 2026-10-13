// [spec-budget-app -> BR-001 -> UR-001..UR-005 -> FR-007..FR-009 -> NFR-010]
// Black-box component acceptance tests for Budget Tracking Application frontend
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import BudgetSummary from '~/components/BudgetSummary.vue';
import BudgetItemForm from '~/components/BudgetItemForm.vue';
import BudgetItemList from '~/components/BudgetItemList.vue';
import type {
  BudgetItem,
  BudgetSummary as BudgetSummaryType,
  BudgetItemInput,
} from '~/composables/useBudget';

// Shared mock state simulating useBudget composable contracts
const mockItems = ref<BudgetItem[]>([]);
const mockSummary = ref<BudgetSummaryType>({
  total_income: 0,
  total_expenses: 0,
  net_balance: 0,
  item_count: 0,
});
const mockLoading = ref<boolean>(false);
const mockError = ref<string | null>(null);
const mockActiveEditItem = ref<BudgetItem | null>(null);

const mockCreateItem = vi.fn().mockResolvedValue(true);
const mockUpdateItem = vi.fn().mockResolvedValue(true);
const mockDeleteItem = vi.fn().mockResolvedValue(true);
const mockSetEditItem = vi.fn();
const mockClearEditItem = vi.fn();
const mockClearError = vi.fn();
const mockFetchItems = vi.fn().mockResolvedValue(undefined);
const mockFetchSummary = vi.fn().mockResolvedValue(undefined);
const mockFetchAll = vi.fn().mockResolvedValue(undefined);

vi.mock('~/composables/useBudget', () => ({
  useBudget: () => ({
    items: mockItems,
    summary: mockSummary,
    loading: mockLoading,
    error: mockError,
    activeEditItem: mockActiveEditItem,
    createItem: mockCreateItem,
    updateItem: mockUpdateItem,
    deleteItem: mockDeleteItem,
    setEditItem: mockSetEditItem,
    clearEditItem: mockClearEditItem,
    clearError: mockClearError,
    fetchItems: mockFetchItems,
    fetchSummary: mockFetchSummary,
    fetchAll: mockFetchAll,
  }),
}));

describe('BudgetSummary Component Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading.value = false;
    mockError.value = null;
    mockSummary.value = {
      total_income: 0,
      total_expenses: 0,
      net_balance: 0,
      item_count: 0,
    };
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // Valid / Happy path: Renders Total Income, Total Expenses, and Net Balance formatted as currency
  it('should render Total Income, Total Expenses, and Net Balance formatted as currency', () => {
    mockSummary.value = {
      total_income: 3500.0,
      total_expenses: 1420.5,
      net_balance: 2079.5,
      item_count: 8,
    };

    const wrapper = mount(BudgetSummary);
    const text = wrapper.text();

    expect(text).toContain('$3,500.00');
    expect(text).toContain('$1,420.50');
    expect(text).toContain('$2,079.50');
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // Boundary: Zero ledger values display formatted $0.00 currency amounts
  it('should render zero currency amounts when summary totals are zero', () => {
    mockSummary.value = {
      total_income: 0.0,
      total_expenses: 0.0,
      net_balance: 0.0,
      item_count: 0,
    };

    const wrapper = mount(BudgetSummary);
    const text = wrapper.text();

    expect(text).toContain('$0.00');
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // State: Renders positive balance styling when net_balance >= 0
  it('should render positive balance styling when net_balance is greater than or equal to zero', () => {
    mockSummary.value = {
      total_income: 2000.0,
      total_expenses: 500.0,
      net_balance: 1500.0,
      item_count: 4,
    };

    const wrapper = mount(BudgetSummary);
    const html = wrapper.html();

    const hasPositiveIndicator = /text-(green|emerald)|bg-(green|emerald)|border-(green|emerald)|positive/i.test(html);
    expect(hasPositiveIndicator).toBe(true);
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // Boundary / State: Renders deficit balance styling and negative sign when net_balance < 0
  it('should render deficit styling and formatted negative currency when net_balance is negative', () => {
    mockSummary.value = {
      total_income: 100.0,
      total_expenses: 350.0,
      net_balance: -250.0,
      item_count: 3,
    };

    const wrapper = mount(BudgetSummary);
    const text = wrapper.text();
    const html = wrapper.html();

    expect(text).toContain('-$250.00');
    const hasDeficitIndicator = /text-(red|rose)|bg-(red|rose)|border-(red|rose)|deficit|negative/i.test(html);
    expect(hasDeficitIndicator).toBe(true);
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // Valid: Renders transaction count badge reflecting item_count
  it('should render transaction count badge reflecting total items in summary', () => {
    mockSummary.value = {
      total_income: 1500.0,
      total_expenses: 300.0,
      net_balance: 1200.0,
      item_count: 12,
    };

    const wrapper = mount(BudgetSummary);
    const badge = wrapper.find('[data-testid="item-count"], .count-badge');
    if (badge.exists()) {
      expect(badge.text()).toContain('12');
    } else {
      expect(wrapper.text()).toContain('12');
    }
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // State: Renders loading skeletons when loading is true
  it('should render loading skeleton placeholders when loading is true', () => {
    mockLoading.value = true;

    const wrapper = mount(BudgetSummary);
    const html = wrapper.html();

    const hasSkeleton =
      wrapper.findAll('.skeleton, .animate-pulse, [data-testid*="skeleton"], [aria-busy="true"]').length > 0 ||
      /animate-pulse|skeleton|loading/i.test(html);
    expect(hasSkeleton).toBe(true);
  });

  // [AC-7 | spec-budget-app | FR-009 | UR-005 | BR-001]
  // State: Hides loading skeletons when loading is false
  it('should not render skeleton placeholders when loading is false', () => {
    mockLoading.value = false;

    const wrapper = mount(BudgetSummary);
    const skeletons = wrapper.findAll('.skeleton, [data-testid*="skeleton"]');
    expect(skeletons.length).toBe(0);
  });
});

describe('BudgetItemForm Component Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveEditItem.value = null;
    mockLoading.value = false;
    mockError.value = null;
  });

  const getDescInput = (wrapper: ReturnType<typeof mount>) =>
    wrapper.find<HTMLInputElement>('input[name="description"], input#description, input[type="text"]');

  const getAmountInput = (wrapper: ReturnType<typeof mount>) =>
    wrapper.find<HTMLInputElement>('input[name="amount"], input#amount, input[type="number"]');

  const getDateInput = (wrapper: ReturnType<typeof mount>) =>
    wrapper.find<HTMLInputElement>('input[name="date"], input#date, input[type="date"]');

  const getTypeSelect = (wrapper: ReturnType<typeof mount>) =>
    wrapper.find<HTMLSelectElement>('select[name="type"], select#type, select');

  const getTypeRadioButtons = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('button[role="radio"]');

  const getTypeButton = (wrapper: ReturnType<typeof mount>, typeValue: 'income' | 'expense') => {
    const radioButtons = getTypeRadioButtons(wrapper);
    const matched = radioButtons.find((btn) => {
      const text = btn.text().toLowerCase();
      const val = (btn.attributes('value') || btn.attributes('data-value') || '').toLowerCase();
      const ariaLabel = (btn.attributes('aria-label') || '').toLowerCase();
      return text.includes(typeValue) || val === typeValue || ariaLabel.includes(typeValue);
    });
    if (matched) return matched;

    return wrapper.findAll('button').find((btn) => {
      const text = btn.text().toLowerCase();
      return text.includes(typeValue);
    });
  };

  const setType = async (wrapper: ReturnType<typeof mount>, typeValue: 'income' | 'expense') => {
    const typeBtn = getTypeButton(wrapper, typeValue);
    if (typeBtn && typeBtn.exists()) {
      await typeBtn.trigger('click');
      await wrapper.vm.$nextTick();
      return;
    }

    const radio = wrapper.find<HTMLInputElement>(`input[type="radio"][value="${typeValue}"]`);
    if (radio.exists()) {
      await radio.setChecked();
      await wrapper.vm.$nextTick();
      return;
    }

    const select = getTypeSelect(wrapper);
    if (select.exists()) {
      await select.setValue(typeValue);
      await wrapper.vm.$nextTick();
      return;
    }
  };

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Valid: Renders form inputs for description, amount, date, and type
  it('should render form inputs for description, amount, date, and type', () => {
    const wrapper = mount(BudgetItemForm);

    expect(getDescInput(wrapper).exists()).toBe(true);
    expect(getAmountInput(wrapper).exists()).toBe(true);
    expect(getDateInput(wrapper).exists()).toBe(true);
    const hasTypeSelector =
      getTypeRadioButtons(wrapper).length > 0 ||
      getTypeSelect(wrapper).exists() ||
      wrapper.findAll('input[type="radio"]').length > 0;
    expect(hasTypeSelector).toBe(true);
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Accessibility: Renders accessible radiogroup buttons with role="radio" and toggles aria-checked when clicked
  it('should render accessible type selector buttons and toggle aria-checked when clicked', async () => {
    const wrapper = mount(BudgetItemForm);

    const radioButtons = getTypeRadioButtons(wrapper);
    expect(radioButtons.length).toBeGreaterThanOrEqual(2);

    const incomeBtn = getTypeButton(wrapper, 'income');
    const expenseBtn = getTypeButton(wrapper, 'expense');

    expect(incomeBtn?.exists()).toBe(true);
    expect(expenseBtn?.exists()).toBe(true);

    if (incomeBtn && expenseBtn) {
      await expenseBtn.trigger('click');
      await wrapper.vm.$nextTick();
      expect(expenseBtn.attributes('aria-checked')).toBe('true');
      expect(incomeBtn.attributes('aria-checked')).toBe('false');

      await incomeBtn.trigger('click');
      await wrapper.vm.$nextTick();
      expect(incomeBtn.attributes('aria-checked')).toBe('true');
      expect(expenseBtn.attributes('aria-checked')).toBe('false');
    }
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Valid / Happy path: Submitting valid income transaction emits @saved event with form payload
  it('should emit @saved event with payload on valid income form submission', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('Monthly Salary');
    await getAmountInput(wrapper).setValue(3500.0);
    await getDateInput(wrapper).setValue('2026-10-01');
    await setType(wrapper, 'income');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    const savedEvents = wrapper.emitted('saved');
    expect(savedEvents).toBeTruthy();
    expect(savedEvents![0][0]).toMatchObject({
      description: 'Monthly Salary',
      amount: 3500.0,
      date: '2026-10-01',
      type: 'income',
    });
    expect(mockCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Monthly Salary',
        amount: 3500.0,
        date: '2026-10-01',
        type: 'income',
      })
    );
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Valid / Happy path: Submitting valid expense transaction emits @saved event with form payload
  it('should emit @saved event with payload on valid expense form submission', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('Grocery Shopping');
    await getAmountInput(wrapper).setValue(84.5);
    await getDateInput(wrapper).setValue('2026-10-12');
    await setType(wrapper, 'expense');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    const savedEvents = wrapper.emitted('saved');
    expect(savedEvents).toBeTruthy();
    expect(savedEvents![0][0]).toMatchObject({
      description: 'Grocery Shopping',
      amount: 84.5,
      date: '2026-10-12',
      type: 'expense',
    });
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Invalid / Client-side validation: Empty description prevents submit and displays error message
  it('should prevent submission and display inline error message when description is empty', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('');
    await getAmountInput(wrapper).setValue(50.0);
    await getDateInput(wrapper).setValue('2026-10-13');
    await setType(wrapper, 'expense');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(mockCreateItem).not.toHaveBeenCalled();

    const text = wrapper.text().toLowerCase();
    expect(text.includes('description') || text.includes('required')).toBe(true);
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Boundary / Client-side validation: Whitespace-only description prevents submit
  it('should prevent submission when description contains only whitespace characters', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('    ');
    await getAmountInput(wrapper).setValue(25.0);
    await getDateInput(wrapper).setValue('2026-10-13');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Boundary / Client-side validation: Amount equal to zero prevents submit and shows inline error
  it('should prevent submission and display inline error when amount is zero', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('Coffee');
    await getAmountInput(wrapper).setValue(0);
    await getDateInput(wrapper).setValue('2026-10-13');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(mockCreateItem).not.toHaveBeenCalled();

    const text = wrapper.text().toLowerCase();
    expect(text.includes('amount') || text.includes('greater') || text.includes('0')).toBe(true);
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Invalid / Client-side validation: Negative amount prevents submit and shows inline error
  it('should prevent submission and display inline error when amount is negative', async () => {
    const wrapper = mount(BudgetItemForm);

    await getDescInput(wrapper).setValue('Snack');
    await getAmountInput(wrapper).setValue(-10.5);
    await getDateInput(wrapper).setValue('2026-10-13');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('saved')).toBeUndefined();
    expect(mockCreateItem).not.toHaveBeenCalled();

    const text = wrapper.text().toLowerCase();
    expect(text.includes('amount') || text.includes('greater') || text.includes('positive') || text.includes('0')).toBe(true);
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Security / Injection: Script metacharacters handled without script execution
  it('should handle script injection strings in description without raising unhandled exceptions', async () => {
    const wrapper = mount(BudgetItemForm);

    const xssPayload = '<script>alert("xss")</script>';
    await getDescInput(wrapper).setValue(xssPayload);
    await getAmountInput(wrapper).setValue(15.0);
    await getDateInput(wrapper).setValue('2026-10-13');
    await setType(wrapper, 'expense');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    const savedEvents = wrapper.emitted('saved');
    expect(savedEvents).toBeTruthy();
    expect(savedEvents![0][0]).toMatchObject({
      description: xssPayload,
      amount: 15.0,
      type: 'expense',
    });
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // State: Edit mode populates form inputs with activeEditItem values and displays edit heading/button
  it('should populate inputs and display edit heading or button in edit mode', async () => {
    mockActiveEditItem.value = {
      id: 'item-edit-1',
      description: 'Internet Fiber',
      amount: 65.0,
      date: '2026-10-05',
      type: 'expense',
      created_at: '2026-10-05T08:00:00Z',
      updated_at: '2026-10-05T08:00:00Z',
    };

    const wrapper = mount(BudgetItemForm);
    await wrapper.vm.$nextTick();

    expect(getDescInput(wrapper).element.value).toBe('Internet Fiber');
    expect(Number(getAmountInput(wrapper).element.value)).toBe(65.0);
    expect(getDateInput(wrapper).element.value).toBe('2026-10-05');

    const expenseBtn = getTypeButton(wrapper, 'expense');
    if (expenseBtn && expenseBtn.attributes('aria-checked') !== undefined) {
      expect(expenseBtn.attributes('aria-checked')).toBe('true');
    }

    const formText = wrapper.text();
    expect(/edit|update/i.test(formText)).toBe(true);
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Valid: Submitting in edit mode calls updateItem and emits @saved
  it('should call updateItem and emit @saved on valid edit mode submission', async () => {
    mockActiveEditItem.value = {
      id: 'item-edit-1',
      description: 'Internet Fiber',
      amount: 65.0,
      date: '2026-10-05',
      type: 'expense',
      created_at: '2026-10-05T08:00:00Z',
      updated_at: '2026-10-05T08:00:00Z',
    };

    const wrapper = mount(BudgetItemForm);
    await wrapper.vm.$nextTick();

    await getAmountInput(wrapper).setValue(75.0);
    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    const savedEvents = wrapper.emitted('saved');
    expect(savedEvents).toBeTruthy();
    expect(mockUpdateItem).toHaveBeenCalledWith(
      'item-edit-1',
      expect.objectContaining({
        description: 'Internet Fiber',
        amount: 75.0,
        type: 'expense',
      })
    );
  });

  // [AC-8 | spec-budget-app | FR-007 | UR-001 | BR-001]
  // Action: Cancel button emits @cancelled event
  it('should emit @cancelled event when cancel button is clicked', async () => {
    mockActiveEditItem.value = {
      id: 'item-edit-2',
      description: 'Subscription',
      amount: 15.0,
      date: '2026-10-02',
      type: 'expense',
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
    };

    const wrapper = mount(BudgetItemForm);
    await wrapper.vm.$nextTick();

    const cancelBtn = wrapper
      .findAll('button')
      .find(btn => btn.attributes('role') !== 'radio' && (/cancel/i.test(btn.text()) || /cancel/i.test(btn.attributes('aria-label') || '')));
    expect(cancelBtn).toBeDefined();

    await cancelBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('cancelled')).toBeTruthy();
  });
});

describe('BudgetItemList Component Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems.value = [];
    mockLoading.value = false;
    mockError.value = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Valid / Happy path: Renders transaction table with formatted date, description, and currency amount
  it('should render transaction rows with formatted date, description, and currency amount', () => {
    mockItems.value = [
      {
        id: 'item-1',
        description: 'Client Retainer',
        amount: 2500.0,
        date: '2026-10-13',
        type: 'income',
        created_at: '2026-10-13T10:00:00Z',
        updated_at: '2026-10-13T10:00:00Z',
      },
      {
        id: 'item-2',
        description: 'Office Supplies',
        amount: 45.99,
        date: '2026-10-12',
        type: 'expense',
        created_at: '2026-10-12T11:00:00Z',
        updated_at: '2026-10-12T11:00:00Z',
      },
    ];

    const wrapper = mount(BudgetItemList);
    const text = wrapper.text();

    expect(text).toContain('Client Retainer');
    expect(text).toContain('$2,500.00');
    expect(text).toContain('2026-10-13');

    expect(text).toContain('Office Supplies');
    expect(text).toContain('$45.99');
    expect(text).toContain('2026-10-12');
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Valid: Displays type badges differentiating income and expense
  it('should display distinct type indicators for income and expense transactions', () => {
    mockItems.value = [
      {
        id: 'item-1',
        description: 'Salary Deposit',
        amount: 3000.0,
        date: '2026-10-01',
        type: 'income',
        created_at: '2026-10-01T09:00:00Z',
        updated_at: '2026-10-01T09:00:00Z',
      },
      {
        id: 'item-2',
        description: 'Groceries',
        amount: 120.0,
        date: '2026-10-02',
        type: 'expense',
        created_at: '2026-10-02T15:00:00Z',
        updated_at: '2026-10-02T15:00:00Z',
      },
    ];

    const wrapper = mount(BudgetItemList);
    const text = wrapper.text().toLowerCase();
    const html = wrapper.html();

    expect(text.includes('income')).toBe(true);
    expect(text.includes('expense')).toBe(true);
    expect(/income|green|emerald/i.test(html)).toBe(true);
    expect(/expense|red|rose/i.test(html)).toBe(true);
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Valid: Renders transactions in descending chronological date order
  it('should render budget items ordered by date descending', () => {
    mockItems.value = [
      {
        id: 'item-old',
        description: 'Old Transaction',
        amount: 10.0,
        date: '2026-10-01',
        type: 'expense',
        created_at: '2026-10-01T08:00:00Z',
        updated_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'item-new',
        description: 'New Transaction',
        amount: 20.0,
        date: '2026-10-15',
        type: 'income',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        id: 'item-mid',
        description: 'Mid Transaction',
        amount: 15.0,
        date: '2026-10-08',
        type: 'expense',
        created_at: '2026-10-08T08:00:00Z',
        updated_at: '2026-10-08T08:00:00Z',
      },
    ];

    const wrapper = mount(BudgetItemList);
    const text = wrapper.text();

    const posNew = text.indexOf('New Transaction');
    const posMid = text.indexOf('Mid Transaction');
    const posOld = text.indexOf('Old Transaction');

    expect(posNew).toBeLessThan(posMid);
    expect(posMid).toBeLessThan(posOld);
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Action: Edit button invokes edit action / emit
  it('should invoke edit action or emit @edit when edit button is clicked', async () => {
    const targetItem: BudgetItem = {
      id: 'item-edit-target',
      description: 'Gym Subscription',
      amount: 50.0,
      date: '2026-10-10',
      type: 'expense',
      created_at: '2026-10-10T12:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
    };
    mockItems.value = [targetItem];

    const wrapper = mount(BudgetItemList);
    const editBtn = wrapper.findAll('button').find(b =>
      /edit/i.test(b.text()) ||
      /edit/i.test(b.attributes('aria-label') || '') ||
      b.classes().some(c => /edit/i.test(c))
    );
    expect(editBtn).toBeDefined();

    await editBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const editEmitted = wrapper.emitted('edit');
    const wasEmitted = Boolean(editEmitted && editEmitted.length > 0);
    const wasMockCalled = mockSetEditItem.mock.calls.length > 0;

    expect(wasEmitted || wasMockCalled).toBe(true);
    if (wasEmitted) {
      expect(editEmitted![0][0]).toMatchObject({ id: 'item-edit-target' });
    }
    if (wasMockCalled) {
      expect(mockSetEditItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-edit-target' }));
    }
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Action: Delete button invokes delete action / emit when user confirms dialog
  it('should invoke delete action or emit @delete when delete is confirmed', async () => {
    const targetItem: BudgetItem = {
      id: 'item-del-1',
      description: 'Coffee Run',
      amount: 4.5,
      date: '2026-10-11',
      type: 'expense',
      created_at: '2026-10-11T09:00:00Z',
      updated_at: '2026-10-11T09:00:00Z',
    };
    mockItems.value = [targetItem];

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const wrapper = mount(BudgetItemList);
    const deleteBtn = wrapper.findAll('button').find(b =>
      /delete/i.test(b.text()) ||
      /delete/i.test(b.attributes('aria-label') || '') ||
      b.classes().some(c => /delete/i.test(c))
    );
    expect(deleteBtn).toBeDefined();

    await deleteBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(confirmSpy).toHaveBeenCalled();

    const deleteEmitted = wrapper.emitted('delete');
    const wasEmitted = Boolean(deleteEmitted && deleteEmitted.length > 0);
    const wasMockCalled = mockDeleteItem.mock.calls.length > 0;

    expect(wasEmitted || wasMockCalled).toBe(true);
    if (wasEmitted) {
      expect(deleteEmitted![0][0]).toBe('item-del-1');
    }
    if (wasMockCalled) {
      expect(mockDeleteItem).toHaveBeenCalledWith('item-del-1');
    }
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Action: Delete button aborts action when user cancels confirmation dialog
  it('should not emit @delete or call deleteItem when confirmation is cancelled', async () => {
    const targetItem: BudgetItem = {
      id: 'item-del-safe',
      description: 'Important Payment',
      amount: 500.0,
      date: '2026-10-11',
      type: 'expense',
      created_at: '2026-10-11T09:00:00Z',
      updated_at: '2026-10-11T09:00:00Z',
    };
    mockItems.value = [targetItem];

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const wrapper = mount(BudgetItemList);
    const deleteBtn = wrapper.findAll('button').find(b =>
      /delete/i.test(b.text()) ||
      /delete/i.test(b.attributes('aria-label') || '') ||
      b.classes().some(c => /delete/i.test(c))
    );
    expect(deleteBtn).toBeDefined();

    await deleteBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(confirmSpy).toHaveBeenCalled();
    expect(wrapper.emitted('delete')).toBeUndefined();
    expect(mockDeleteItem).not.toHaveBeenCalled();
  });

  // [AC-9 | spec-budget-app | FR-008 | UR-002 | BR-001]
  // Boundary / State: Displays empty state banner when items list is empty and not loading
  it('should display empty state banner when items list is empty and loading is false', () => {
    mockItems.value = [];
    mockLoading.value = false;

    const wrapper = mount(BudgetItemList);
    const text = wrapper.text().toLowerCase();

    const hasEmptyStateMessage = /no\s+(budget\s+)?items|no\s+transactions|empty|get\s+started/i.test(text);
    expect(hasEmptyStateMessage).toBe(true);
  });
});
