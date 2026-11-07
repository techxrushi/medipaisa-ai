import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ScanLine,
  PiggyBank,
  BotMessageSquare,
  Pill,
  Stethoscope,
  FlaskConical,
  Building2,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
  Info,
  Calendar,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR, formatDate } from '../utils/formatters';
import { ExpenseCategory } from '../types';

export const Dashboard: React.FC = () => {
  const {
    expenses,
    budget,
    currentMonthExpenses,
    currentMonthTotal,
    previousMonthTotal,
    monthOverMonthChangePercent,
    budgetRemaining,
    budgetUtilizationPercent,
    budgetStatus,
    categoryTotals,
    categoryPercentages,
    monthlyTrends,
    setActiveTab,
    openAddExpenseModal,
    setEditingExpense,
    deleteExpense,
    isSampleDataActive,
  } = useExpenses();

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'Medicines':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'Doctor Consultation':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'Laboratory Tests':
        return <FlaskConical className="w-4 h-4 text-cyan-600" />;
      case 'Hospitalization':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  const getCategoryBadgeClass = (category: ExpenseCategory) => {
    switch (category) {
      case 'Medicines':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Doctor Consultation':
        return 'bg-teal-50 text-teal-700 border-teal-200/60';
      case 'Laboratory Tests':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
      case 'Hospitalization':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
    }
  };

  const maxMonthTotal = Math.max(1, ...monthlyTrends.map((m) => m.total));

  // Current month name
  const currentMonthName = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Healthcare Expense Dashboard
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              {currentMonthName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track family medical spend, optimize chronic medicine bills, and plan your healthcare safety net.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('analyzer')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-emerald-600" />
            <span>AI Bill OCR</span>
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition cursor-pointer"
          >
            <BotMessageSquare className="w-4 h-4" />
            <span>Financial Assistant</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Healthcare Spend This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month's Spend</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(currentMonthTotal)}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            {monthOverMonthChangePercent > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3" /> +{monthOverMonthChangePercent}%
              </span>
            ) : monthOverMonthChangePercent < 0 ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingDown className="w-3 h-3" /> {monthOverMonthChangePercent}%
              </span>
            ) : (
              <span className="text-slate-400">Same as last month</span>
            )}
            <span className="text-slate-500">vs last month ({formatINR(previousMonthTotal)})</span>
          </div>
        </div>

        {/* Card 2: Monthly Healthcare Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Budget</span>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
            >
              Adjust
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(budget.monthlyBudget)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Remaining Budget:</span>
            <span
              className={`font-bold ${
                budgetStatus === 'danger'
                  ? 'text-rose-600'
                  : budgetStatus === 'warning'
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {budgetRemaining > 0 ? formatINR(budgetRemaining) : '₹0 (Budget Exceeded)'}
            </span>
          </div>
        </div>

        {/* Card 3: Budget Utilization Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Budget Utilization</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                budgetStatus === 'danger'
                  ? 'bg-rose-100 text-rose-700'
                  : budgetStatus === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {budgetStatus === 'danger'
                ? 'Exceeded'
                : budgetStatus === 'warning'
                ? 'Alert (>80%)'
                : 'On Track'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {budgetUtilizationPercent}%
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                budgetStatus === 'danger'
                  ? 'bg-rose-500'
                  : budgetStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, budgetUtilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Top Expense Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Medical Cost</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          {(() => {
            const sortedCats = (Object.keys(categoryTotals) as ExpenseCategory[]).sort(
              (a, b) => categoryTotals[b] - categoryTotals[a]
            );
            const topCat = sortedCats[0] || 'Medicines';
            const topAmount = categoryTotals[topCat] || 0;
            const topPercent = categoryPercentages[topCat] || 0;
            return (
              <>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                  {topAmount > 0 ? topCat : 'No expenses yet'}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatINR(topAmount)}</span>
                  {topAmount > 0 && (
                    <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {topPercent}% of monthly spend
                    </span>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Warning Alert Banner when approaching or exceeding budget */}
      {budgetStatus !== 'safe' && (
        <div
          className={`p-4 rounded-2xl border flex items-start sm:items-center justify-between gap-3 ${
            budgetStatus === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                budgetStatus === 'danger' ? 'bg-rose-200/60 text-rose-700' : 'bg-amber-200/60 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {budgetStatus === 'danger'
                  ? 'Healthcare Budget Exceeded'
                  : 'Budget Alert: Reached 80% Threshold'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {budgetStatus === 'danger'
                  ? `Your family has spent ${formatINR(currentMonthTotal)}, which exceeds the monthly allocation of ${formatINR(budget.monthlyBudget)}.`
                  : `Your current healthcare spend is ${formatINR(currentMonthTotal)} (${budgetUtilizationPercent}% of ${formatINR(budget.monthlyBudget)}). Only ${formatINR(budgetRemaining)} remaining.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('budget')}
            className="text-xs font-semibold underline shrink-0 cursor-pointer"
          >
            Review Budget
          </button>
        </div>
      )}

      {/* Main Grid: Category Breakdown + 6-Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Expense Breakdown</h3>
                <p className="text-xs text-slate-500">Distribution across healthcare domains</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {currentMonthExpenses.length} records
              </span>
            </div>

            {/* Visual stacked bar */}
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 mb-5">
              {(Object.keys(categoryPercentages) as ExpenseCategory[]).map((cat) => {
                const pct = categoryPercentages[cat];
                if (pct <= 0) return null;
                let bg = 'bg-teal-500';
                if (cat === 'Medicines') bg = 'bg-emerald-500';
                if (cat === 'Laboratory Tests') bg = 'bg-cyan-500';
                if (cat === 'Hospitalization') bg = 'bg-indigo-500';
                if (cat === 'Other') bg = 'bg-amber-400';
                return (
                  <div
                    key={cat}
                    title={`${cat}: ${pct}%`}
                    style={{ width: `${pct}%` }}
                    className={`${bg} h-full transition-all`}
                  />
                );
              })}
            </div>

            {/* Category list items */}
            <div className="space-y-3">
              {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                const amount = categoryTotals[cat];
                const pct = categoryPercentages[cat];
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        {getCategoryIcon(cat)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{cat}</div>
                        <div className="text-[11px] text-slate-400">{pct}% of total spend</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{formatINR(amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tip inside category card */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> PMBJP Jan Aushadhi generic alternatives
            </span>
            <button
              onClick={() => setActiveTab('copilot')}
              className="text-teal-600 hover:underline font-semibold cursor-pointer"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* 6-Month Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Healthcare Spending Trend</h3>
                <p className="text-xs text-slate-500">Monthly totals and spending trajectory</p>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                Full Report <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Responsive SVG / Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200 pb-2">
                {monthlyTrends.map((trend) => {
                  const heightPercent =
                    maxMonthTotal > 0 ? Math.max(10, Math.round((trend.total / maxMonthTotal) * 100)) : 10;
                  const isCurrent = trend.monthKey.endsWith(
                    String(new Date().getMonth() + 1).padStart(2, '0')
                  );
                  return (
                    <div
                      key={trend.monthKey}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                        {trend.monthLabel}: {formatINR(trend.total)} ({trend.count} bills)
                      </div>

                      {/* Bar Value Indicator */}
                      <span className="text-[10px] font-bold text-slate-600 hidden sm:block">
                        {formatINR(trend.total)}
                      </span>

                      {/* Bar Fill */}
                      <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-36">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-sm'
                              : 'bg-gradient-to-t from-slate-400 to-slate-300 group-hover:from-teal-500 group-hover:to-teal-300'
                          }`}
                        />
                      </div>

                      {/* Month Label */}
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent ? 'text-teal-700 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {trend.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Budget baseline indicator */}
          <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Current Month
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 ml-2" /> Previous Months
            </span>
            <span>Target Monthly Cap: <strong>{formatINR(budget.monthlyBudget)}</strong></span>
          </div>
        </div>
      </div>

      {/* Helpful Financial Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Jan Aushadhi & Generic Medicine */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4.5 rounded-2xl border border-emerald-200/80">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1.5">
            <Pill className="w-4 h-4 text-emerald-600" />
            <span>Generic Medicine Potential</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your family spent <strong>{formatINR(categoryTotals.Medicines)}</strong> on medicines. Switching chronic maintenance drugs (like Metformin or Telmisartan) to PMBJP Jan Aushadhi can save up to <strong>50%–70%</strong> monthly.
          </p>
        </div>

        {/* Insight 2: Section 80D Tax Exemption */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50/40 p-4.5 rounded-2xl border border-teal-200/80">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Section 80D Tax Benefit</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your preventive tests (<strong>{formatINR(categoryTotals['Laboratory Tests'])}</strong>) qualify for Indian Income Tax Section 80D (up to ₹5,000 for family checkups). Remember to archive digital bills.
          </p>
        </div>

        {/* Insight 3: Emergency Health Reserve */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-4.5 rounded-2xl border border-indigo-200/80">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1.5">
            <PiggyBank className="w-4 h-4 text-indigo-600" />
            <span>Healthcare Emergency Buffer</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Target emergency corpus is <strong>{formatINR(budget.emergencyCorpusTarget)}</strong>. Maintaining a liquid medical reserve safeguards against unforeseen hospitalizations and sudden OPD diagnostics.
          </p>
        </div>
      </div>

      {/* Recent Transactions List with Sample Data Badges */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Medical Transactions</h3>
            <p className="text-xs text-slate-500">
              Showing recent healthcare expenses. User entries and sample records are explicitly flagged.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('expenses')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            View All ({expenses.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No expenses recorded yet</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Add your first healthcare bill or upload a prescription to get started.
            </p>
            <button
              onClick={() => openAddExpenseModal()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.slice(0, 6).map((exp) => (
              <div
                key={exp.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                    {getCategoryIcon(exp.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 truncate">{exp.name}</span>
                      {exp.isSample ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Sample
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          User Entry
                        </span>
                      )}
                      {exp.billData && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          AI Scanned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span>{exp.vendor || exp.category}</span>
                      <span>•</span>
                      <span>{formatDate(exp.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formatINR(exp.amount)}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        exp.category
                      )}`}
                    >
                      {exp.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingExpense(exp);
                        useExpenses().setIsExpenseModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                      title="Edit expense"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
