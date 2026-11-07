import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Expense, BudgetConfig, ExpenseCategory } from '../types';
import { SAMPLE_EXPENSES, INITIAL_BUDGET_CONFIG } from '../data/sampleData';

interface ExpenseContextType {
  expenses: Expense[];
  budget: BudgetConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSampleDataActive: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateBudget: (newBudget: Partial<BudgetConfig>) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
  
  // Modal states
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  openAddExpenseModal: (preset?: Partial<Expense>) => void;
  presetModalData: Partial<Expense> | null;

  // Computed metrics
  currentMonthExpenses: Expense[];
  currentMonthTotal: number;
  previousMonthTotal: number;
  monthOverMonthChangePercent: number;
  budgetRemaining: number;
  budgetUtilizationPercent: number;
  budgetStatus: 'safe' | 'warning' | 'danger';
  categoryTotals: Record<ExpenseCategory, number>;
  previousCategoryTotals: Record<ExpenseCategory, number>;
  categoryChanges: Record<ExpenseCategory, { current: number; previous: number; diff: number; percentChange: number }>;
  categoryPercentages: Record<ExpenseCategory, number>;
  topCategory: ExpenseCategory | '';
  totalTrackedSpend: number;
  monthlyTrends: Array<{
    monthKey: string;
    monthLabel: string;
    total: number;
    count: number;
  }>;
}

const STORAGE_EXPENSES_KEY = 'medipaisa_expenses_v1';
const STORAGE_BUDGET_KEY = 'medipaisa_budget_v1';

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [presetModalData, setPresetModalData] = useState<Partial<Expense> | null>(null);

  // Initialize expenses from localStorage or default to sample expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EXPENSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
    return SAMPLE_EXPENSES;
  });

  // Initialize budget
  const [budget, setBudget] = useState<BudgetConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BUDGET_KEY);
      if (stored) {
        return { ...INITIAL_BUDGET_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read budget from localStorage:', e);
    }
    return INITIAL_BUDGET_CONFIG;
  });

  // Persist expenses
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to save expenses to localStorage:', e);
    }
  }, [expenses]);

  // Persist budget
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BUDGET_KEY, JSON.stringify(budget));
    } catch (e) {
      console.error('Failed to save budget to localStorage:', e);
    }
  }, [budget]);

  // Check if sample data is currently active
  const isSampleDataActive = useMemo(() => {
    return expenses.some((e) => e.isSample);
  }, [expenses]);

  // Current year & month for scoping
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Current month expenses
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return false;
      const [y, m] = e.date.split('-').map(Number);
      return y === currentYear && m === currentMonth + 1;
    });
  }, [expenses, currentYear, currentMonth]);

  const currentMonthTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [currentMonthExpenses]);

  // Previous month expenses
  const previousMonthExpenses = useMemo(() => {
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    return expenses.filter((e) => {
      if (!e.date) return false;
      const [y, m] = e.date.split('-').map(Number);
      return y === prevYear && m === prevMonth;
    });
  }, [expenses, currentYear, currentMonth]);

  const previousMonthTotal = useMemo(() => {
    return previousMonthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [previousMonthExpenses]);

  const monthOverMonthChangePercent = useMemo(() => {
    if (previousMonthTotal === 0) return 0;
    return Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100);
  }, [currentMonthTotal, previousMonthTotal]);

  // Budget computations
  const budgetRemaining = useMemo(() => {
    return Math.max(0, budget.monthlyBudget - currentMonthTotal);
  }, [budget.monthlyBudget, currentMonthTotal]);

  const budgetUtilizationPercent = useMemo(() => {
    if (budget.monthlyBudget <= 0) return 0;
    return Math.min(200, Math.round((currentMonthTotal / budget.monthlyBudget) * 100));
  }, [budget.monthlyBudget, currentMonthTotal]);

  const budgetStatus = useMemo(() => {
    if (budgetUtilizationPercent >= 100) return 'danger';
    if (budgetUtilizationPercent >= budget.alertThresholdPercent) return 'warning';
    return 'safe';
  }, [budgetUtilizationPercent, budget.alertThresholdPercent]);

  // Category totals for current month (or all if current month is empty)
  const categoryTotals = useMemo(() => {
    const categories: ExpenseCategory[] = [
      'Medicines',
      'Doctor Consultation',
      'Laboratory Tests',
      'Hospitalization',
      'Other',
    ];
    const initial: Record<ExpenseCategory, number> = {
      Medicines: 0,
      'Doctor Consultation': 0,
      'Laboratory Tests': 0,
      Hospitalization: 0,
      Other: 0,
    };

    const targetList = currentMonthExpenses.length > 0 ? currentMonthExpenses : expenses;
    targetList.forEach((e) => {
      if (categories.includes(e.category)) {
        initial[e.category] = (initial[e.category] || 0) + (Number(e.amount) || 0);
      } else {
        initial['Other'] = (initial['Other'] || 0) + (Number(e.amount) || 0);
      }
    });

    return initial;
  }, [currentMonthExpenses, expenses]);

  const categoryPercentages = useMemo(() => {
    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const res: Record<ExpenseCategory, number> = {
      Medicines: 0,
      'Doctor Consultation': 0,
      'Laboratory Tests': 0,
      Hospitalization: 0,
      Other: 0,
    };
    if (total === 0) return res;
    (Object.keys(categoryTotals) as ExpenseCategory[]).forEach((cat) => {
      res[cat] = Math.round((categoryTotals[cat] / total) * 100);
    });
    return res;
  }, [categoryTotals]);

  // Previous month category totals
  const previousCategoryTotals = useMemo(() => {
    const categories: ExpenseCategory[] = [
      'Medicines',
      'Doctor Consultation',
      'Laboratory Tests',
      'Hospitalization',
      'Other',
    ];
    const initial: Record<ExpenseCategory, number> = {
      Medicines: 0,
      'Doctor Consultation': 0,
      'Laboratory Tests': 0,
      Hospitalization: 0,
      Other: 0,
    };

    previousMonthExpenses.forEach((e) => {
      if (categories.includes(e.category)) {
        initial[e.category] = (initial[e.category] || 0) + (Number(e.amount) || 0);
      } else {
        initial['Other'] = (initial['Other'] || 0) + (Number(e.amount) || 0);
      }
    });

    return initial;
  }, [previousMonthExpenses]);

  // Detailed category changes (Current vs Previous)
  const categoryChanges = useMemo(() => {
    const categories: ExpenseCategory[] = [
      'Medicines',
      'Doctor Consultation',
      'Laboratory Tests',
      'Hospitalization',
      'Other',
    ];
    const res: Record<ExpenseCategory, { current: number; previous: number; diff: number; percentChange: number }> = {
      Medicines: { current: 0, previous: 0, diff: 0, percentChange: 0 },
      'Doctor Consultation': { current: 0, previous: 0, diff: 0, percentChange: 0 },
      'Laboratory Tests': { current: 0, previous: 0, diff: 0, percentChange: 0 },
      Hospitalization: { current: 0, previous: 0, diff: 0, percentChange: 0 },
      Other: { current: 0, previous: 0, diff: 0, percentChange: 0 },
    };

    categories.forEach((cat) => {
      const cur = categoryTotals[cat] || 0;
      const prev = previousCategoryTotals[cat] || 0;
      const diff = cur - prev;
      const percentChange = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round((diff / prev) * 100);
      res[cat] = { current: cur, previous: prev, diff, percentChange };
    });

    return res;
  }, [categoryTotals, previousCategoryTotals]);

  // Top category
  const topCategory = useMemo<ExpenseCategory | ''>(() => {
    const sorted = (Object.keys(categoryTotals) as ExpenseCategory[]).sort(
      (a, b) => (categoryTotals[b] || 0) - (categoryTotals[a] || 0)
    );
    return categoryTotals[sorted[0]] > 0 ? sorted[0] : '';
  }, [categoryTotals]);

  // All-time spend
  const totalTrackedSpend = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);


  // 6-month historical trends
  const monthlyTrends = useMemo(() => {
    const monthsMap = new Map<string, { label: string; total: number; count: number; date: Date }>();

    // Generate last 6 months buckets
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      monthsMap.set(key, { label, total: 0, count: 0, date: d });
    }

    expenses.forEach((e) => {
      if (!e.date) return;
      const key = e.date.substring(0, 7);
      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!;
        item.total += Number(e.amount) || 0;
        item.count += 1;
      }
    });

    return Array.from(monthsMap.entries()).map(([key, val]) => ({
      monthKey: key,
      monthLabel: val.label,
      total: val.total,
      count: val.count,
    }));
  }, [expenses, currentYear, currentMonth]);

  // CRUD actions
  const addExpense = (newExpData: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...newExpData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      isSample: false, // User-created entries are never sample data
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated, isSample: false } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateBudget = (newBudget: Partial<BudgetConfig>) => {
    setBudget((prev) => ({ ...prev, ...newBudget }));
  };

  const resetToSampleData = () => {
    setExpenses(SAMPLE_EXPENSES);
    setBudget(INITIAL_BUDGET_CONFIG);
  };

  const clearAllData = () => {
    setExpenses([]);
  };

  const openAddExpenseModal = (preset?: Partial<Expense>) => {
    setEditingExpense(null);
    setPresetModalData(preset || null);
    setIsExpenseModalOpen(true);
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        budget,
        activeTab,
        setActiveTab,
        isSampleDataActive,
        addExpense,
        updateExpense,
        deleteExpense,
        updateBudget,
        resetToSampleData,
        clearAllData,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        editingExpense,
        setEditingExpense,
        openAddExpenseModal,
        presetModalData,
        currentMonthExpenses,
        currentMonthTotal,
        previousMonthTotal,
        monthOverMonthChangePercent,
        budgetRemaining,
        budgetUtilizationPercent,
        budgetStatus,
        categoryTotals,
        previousCategoryTotals,
        categoryChanges,
        categoryPercentages,
        topCategory,
        totalTrackedSpend,
        monthlyTrends,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
