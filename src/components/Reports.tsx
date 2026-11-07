import React, { useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Pill,
  Stethoscope,
  FlaskConical,
  Building2,
  HelpCircle,
  TrendingUp,
  Receipt,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR, formatDate, downloadExpensesCSV } from '../utils/formatters';
import { ExpenseCategory } from '../types';

export const Reports: React.FC = () => {
  const {
    expenses,
    budget,
    currentMonthTotal,
    previousMonthTotal,
    categoryTotals,
    categoryPercentages,
    monthlyTrends,
  } = useExpenses();

  const totalAllTime = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Vendor distribution
  const vendorBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    expenses.forEach((e) => {
      const v = e.vendor?.trim() || 'General / Unspecified';
      const existing = map.get(v) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(e.amount) || 0;
      map.set(v, existing);
    });
    return Array.from(map.entries())
      .map(([vendor, stats]) => ({ vendor, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [expenses]);

  // Weekly breakdown for current month (Weeks 1 to 4/5)
  const weeklyBreakdown = useMemo(() => {
    const weeks = [
      { label: 'Week 1 (Days 1–7)', total: 0, count: 0 },
      { label: 'Week 2 (Days 8–14)', total: 0, count: 0 },
      { label: 'Week 3 (Days 15–21)', total: 0, count: 0 },
      { label: 'Week 4 (Days 22–End)', total: 0, count: 0 },
    ];

    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;

    expenses.forEach((e) => {
      if (!e.date) return;
      const [y, m, d] = e.date.split('-').map(Number);
      if (y === currYear && m === currMonth) {
        if (d <= 7) {
          weeks[0].total += e.amount;
          weeks[0].count += 1;
        } else if (d <= 14) {
          weeks[1].total += e.amount;
          weeks[1].count += 1;
        } else if (d <= 21) {
          weeks[2].total += e.amount;
          weeks[2].count += 1;
        } else {
          weeks[3].total += e.amount;
          weeks[3].count += 1;
        }
      }
    });

    return weeks;
  }, [expenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Healthcare Financial Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Weekly and monthly audit reports, category distribution, provider breakdowns and CSV export for tax filing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={() => downloadExpensesCSV(expenses)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download CSV Report</span>
          </button>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Current Month Spend
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(currentMonthTotal)}</div>
          <div className="text-xs text-slate-500 mt-2">Cap: {formatINR(budget.monthlyBudget)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Previous Month Spend
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(previousMonthTotal)}</div>
          <div className="text-xs text-slate-500 mt-2">Past cycle baseline</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            All-Time Tracked Spend
          </div>
          <div className="text-2xl font-extrabold text-teal-700">{formatINR(totalAllTime)}</div>
          <div className="text-xs text-slate-500 mt-2">{expenses.length} total entries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tax 80D Eligible (Tests)
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {formatINR(categoryTotals['Laboratory Tests'])}
          </div>
          <div className="text-xs text-slate-500 mt-2">Preventive health limit: ₹5,000</div>
        </div>
      </div>

      {/* Weekly Breakdown Table & Monthly Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Analysis (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Current Month Weekly Velocity</h3>
          <p className="text-xs text-slate-500 mb-4">
            Spend pacing across each week of the current month.
          </p>

          <div className="space-y-3">
            {weeklyBreakdown.map((w, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800">{w.label}</div>
                  <div className="text-[11px] text-slate-400">{w.count} transactions recorded</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm sm:text-base text-slate-900">
                    {formatINR(w.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Healthcare Vendors (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Top Healthcare Providers & Labs</h3>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated expenditure by pharmacy chain, hospital, or diagnostic lab.
          </p>

          <div className="space-y-3">
            {vendorBreakdown.map((v, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800">{v.vendor}</div>
                    <div className="text-[11px] text-slate-400">{v.count} bills audited</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-slate-900">{formatINR(v.total)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Wise Detailed Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Category-Wise Spending Analysis</h3>
        <p className="text-xs text-slate-500 mb-5">
          Detailed metrics across each medical category with share of family healthcare budget.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Monthly Total</th>
                <th className="py-3 px-4">Share of Spend</th>
                <th className="py-3 px-4">Practical Optimization Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                const total = categoryTotals[cat];
                const pct = categoryPercentages[cat];

                let tip = '';
                if (cat === 'Medicines') {
                  tip = 'Compare branded Rx against Jan Aushadhi generic equivalents to reduce costs up to 70%.';
                } else if (cat === 'Doctor Consultation') {
                  tip = 'Utilize complimentary 7-day OPD follow-up windows and telemedicine apps.';
                } else if (cat === 'Laboratory Tests') {
                  tip = 'Book comprehensive preventative packages instead of standalone single tests for 80D tax claims.';
                } else if (cat === 'Hospitalization') {
                  tip = 'Ensure cashless TPA pre-authorization and cross-check hospital pharmacy room-rent caps.';
                } else {
                  tip = 'Review dental, physiotherapy or allied health recurring bills.';
                }

                return (
                  <tr key={cat} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{cat}</td>
                    <td className="py-3.5 px-4 font-extrabold text-teal-700">{formatINR(total)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 leading-relaxed">{tip}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
