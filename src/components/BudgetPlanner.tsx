import React, { useState } from 'react';
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Percent,
  Sliders,
  Sparkles,
  HeartPulse,
  Info,
  Calendar,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR } from '../utils/formatters';

export const BudgetPlanner: React.FC = () => {
  const {
    budget,
    updateBudget,
    currentMonthTotal,
    budgetRemaining,
    budgetUtilizationPercent,
    budgetStatus,
    categoryTotals,
    setActiveTab,
  } = useExpenses();

  const [inputMonthlyBudget, setInputMonthlyBudget] = useState(String(budget.monthlyBudget));
  const [inputEmergencyTarget, setInputEmergencyTarget] = useState(String(budget.emergencyCorpusTarget));
  const [inputThreshold, setInputThreshold] = useState(String(budget.alertThresholdPercent));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Indian family recommended allocations benchmark
  const monthlyNum = Number(inputMonthlyBudget) || budget.monthlyBudget;
  const recommendedAllocations = [
    {
      category: 'Medicines & Maintenance Rx',
      percent: 40,
      targetAmount: Math.round(monthlyNum * 0.4),
      actualAmount: categoryTotals.Medicines,
      description: 'Monthly diabetes, hypertension, vitamins, inhalers and acute medications',
    },
    {
      category: 'Doctor & Specialist OPD',
      percent: 25,
      targetAmount: Math.round(monthlyNum * 0.25),
      actualAmount: categoryTotals['Doctor Consultation'],
      description: 'General physician, pediatric, orthopedic or specialist OPD visits',
    },
    {
      category: 'Diagnostics & Lab Tests',
      percent: 20,
      targetAmount: Math.round(monthlyNum * 0.2),
      actualAmount: categoryTotals['Laboratory Tests'],
      description: 'Routine blood profiles, HbA1c, thyroid panels, scans and X-rays',
    },
    {
      category: 'Emergency Healthcare Buffer',
      percent: 15,
      targetAmount: Math.round(monthlyNum * 0.15),
      actualAmount: categoryTotals.Hospitalization + categoryTotals.Other,
      description: 'Dental, physiotherapy, day-care procedures and contingency medical fund',
    },
  ];

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newMonthly = Math.max(1000, parseFloat(inputMonthlyBudget) || 15000);
    const newEmergency = Math.max(5000, parseFloat(inputEmergencyTarget) || 150000);
    const newThreshold = Math.min(95, Math.max(50, parseInt(inputThreshold) || 80));

    updateBudget({
      monthlyBudget: newMonthly,
      emergencyCorpusTarget: newEmergency,
      alertThresholdPercent: newThreshold,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Healthcare Budget Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Establish monthly caps, track real-time utilization, and structure a resilient family medical emergency fund.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              budgetStatus === 'danger'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : budgetStatus === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {budgetStatus === 'danger'
              ? 'Status: Over Budget'
              : budgetStatus === 'warning'
              ? 'Status: Warning Threshold'
              : 'Status: Healthy Budget'}
          </span>
        </div>
      </div>

      {/* Utilization & Metric Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Allocated Monthly Cap
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatINR(budget.monthlyBudget)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target cap for all outpatient, inpatient and pharmacy expenditures.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Utilized Month-to-Date
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700">
            {formatINR(currentMonthTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Utilization: <strong>{budgetUtilizationPercent}%</strong></span>
            <span>Threshold: {budget.alertThresholdPercent}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Available Remaining Cushion
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold ${
              budgetRemaining > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatINR(budgetRemaining)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {budgetRemaining > 0
              ? 'Available for upcoming refills or consultations this month.'
              : 'Exceeded target cap. Discretionary medical spend should be deferred.'}
          </p>
        </div>
      </div>

      {/* Budget Progress Meter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Budget Gauge</h3>
            <p className="text-xs text-slate-500">Visual progress against your monthly threshold</p>
          </div>
          <span className="text-sm font-extrabold text-slate-900">
            {formatINR(currentMonthTotal)} / {formatINR(budget.monthlyBudget)}
          </span>
        </div>

        {/* Multi-tier progress bar */}
        <div className="relative w-full bg-slate-100 h-4 rounded-full overflow-hidden mt-4">
          <div
            style={{ width: `${Math.min(100, budgetUtilizationPercent)}%` }}
            className={`h-full transition-all duration-500 rounded-full ${
              budgetStatus === 'danger'
                ? 'bg-rose-500'
                : budgetStatus === 'warning'
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
          />
        </div>

        {/* Scale labels */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mt-2">
          <span>0%</span>
          <span className="flex items-center gap-1 text-amber-600">
            <span>Alert Threshold ({budget.alertThresholdPercent}%)</span>
          </span>
          <span>100% ({formatINR(budget.monthlyBudget)})</span>
        </div>
      </div>

      {/* Adjust Budget Form & Indian Tax 80D Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Adjust Budget Settings (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Budget Settings</h3>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Healthcare Cap (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  value={inputMonthlyBudget}
                  onChange={(e) => setInputMonthlyBudget(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recommended for family of 4: ₹12,000 - ₹20,000/mo</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alert Trigger Threshold ({inputThreshold}%)
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={inputThreshold}
                onChange={(e) => setInputThreshold(e.target.value)}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                <span>50%</span>
                <span>Current: <strong>{inputThreshold}%</strong></span>
                <span>95%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Emergency Medical Corpus (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="5000"
                  min="10000"
                  value={inputEmergencyTarget}
                  onChange={(e) => setInputEmergencyTarget(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Liquid fund reserve benchmark in India: ₹1.5L to ₹3.0L</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <span>Update Budget & Limits</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recommended Allocations & Tax 80D Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Allocation Breakdown Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Indian Healthcare 40/25/20/15 Rule
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Balanced spending guidelines tailored for Indian metropolitan & tier-2 household medical profiles.
            </p>

            <div className="space-y-3.5">
              {recommendedAllocations.map((alloc) => {
                const diff = alloc.actualAmount - alloc.targetAmount;
                const isOver = diff > 0;
                return (
                  <div
                    key={alloc.category}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {alloc.category} ({alloc.percent}%)
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-slate-900">
                          {formatINR(alloc.actualAmount)}
                        </span>
                        <span className="text-xs text-slate-400"> / {formatINR(alloc.targetAmount)} target</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">{alloc.description}</p>
                    {isOver && (
                      <div className="text-[10px] text-amber-700 font-semibold mt-1">
                        Exceeding allocation target by {formatINR(diff)} this month
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 80D Guide Card */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 rounded-2xl border border-teal-200/80">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm mb-2">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              <span>Section 80D Income Tax Planning Tip</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              Did you know? Under Indian tax laws, preventive health checkups for self, spouse, children, or parents can be claimed for deductions up to <strong>₹5,000</strong> annually within the overall 80D ceiling (up to ₹25,000 for families and ₹50,000 for senior citizen parents).
            </p>
            <button
              onClick={() => setActiveTab('copilot')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
            >
              Ask AI Copilot how to claim your receipts <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
