import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Pill,
  Stethoscope,
  FlaskConical,
  Building2,
  HelpCircle,
  Edit2,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Download,
  Receipt,
  ScanLine,
  X,
  ArrowUpDown,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR, formatDate, downloadExpensesCSV } from '../utils/formatters';
import { ExpenseCategory, Expense } from '../types';

const CATEGORIES: ExpenseCategory[] = [
  'Medicines',
  'Doctor Consultation',
  'Laboratory Tests',
  'Hospitalization',
  'Other',
];

export const ExpenseManager: React.FC = () => {
  const {
    expenses,
    openAddExpenseModal,
    setEditingExpense,
    setIsExpenseModalOpen,
    deleteExpense,
    setActiveTab,
  } = useExpenses();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'sample'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Source filter
      if (sourceFilter === 'user' && exp.isSample) return false;
      if (sourceFilter === 'sample' && !exp.isSample) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = exp.name.toLowerCase().includes(q);
        const matchesVendor = (exp.vendor || '').toLowerCase().includes(q);
        const matchesNotes = (exp.notes || '').toLowerCase().includes(q);
        const matchesCategory = exp.category.toLowerCase().includes(q);
        if (!matchesName && !matchesVendor && !matchesNotes && !matchesCategory) {
          return false;
        }
      }

      // Time filter
      if (timeFilter === 'this_month') {
        if (!exp.date) return false;
        const [y, m] = exp.date.split('-').map(Number);
        if (y !== currentYear || m !== currentMonth + 1) return false;
      } else if (timeFilter === 'last_month') {
        if (!exp.date) return false;
        const prevDate = new Date(currentYear, currentMonth - 1, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const [y, m] = exp.date.split('-').map(Number);
        if (y !== prevYear || m !== prevMonth) return false;
      } else if (timeFilter === 'custom') {
        if (startDate && exp.date < startDate) return false;
        if (endDate && exp.date > endDate) return false;
      }

      return true;
    });
  }, [expenses, selectedCategory, sourceFilter, searchQuery, timeFilter, startDate, endDate, currentYear, currentMonth]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

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

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Healthcare Expense Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain itemized doctor bills, prescription pharmacy receipts, diagnostics and hospitalization records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadExpensesCSV(filteredExpenses)}
            disabled={filteredExpenses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
            title="Export filtered records to Excel/CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 hover:bg-teal-100 transition cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-teal-600" />
            <span>Scan Bill</span>
          </button>
          <button
            onClick={() => openAddExpenseModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, medicine name, pharmacy, hospital..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Dates</option>
            </select>
          </div>

          {/* Source Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white cursor-pointer"
            >
              <option value="all">All Records</option>
              <option value="user">User Entries Only</option>
              <option value="sample">Sample Demo Data</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Row if selected */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Date Range:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-800"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Filter Stats Badge Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong>{filteredExpenses.length}</strong> of {expenses.length} healthcare expenses
          </span>
          <span className="text-slate-800 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
            Filtered Total: <span className="text-teal-700">{formatINR(filteredTotal)}</span>
          </span>
        </div>
      </div>

      {/* Expenses Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No medical expenses found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your search query, clearing filters, or adding a new healthcare expense entry.
            </p>
            <button
              onClick={() => openAddExpenseModal()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
            >
              + Record Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Expense & Provider</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    {/* Name & Vendor */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900">{exp.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {exp.vendor && <span>{exp.vendor}</span>}
                        {exp.notes && (
                          <>
                            {exp.vendor && <span>•</span>}
                            <span className="truncate max-w-xs text-slate-400 italic">
                              "{exp.notes}"
                            </span>
                          </>
                        )}
                      </div>
                      {exp.billData?.invoiceNumber && (
                        <div className="text-[10px] text-teal-700 font-mono mt-0.5">
                          Inv: {exp.billData.invoiceNumber}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                          exp.category
                        )}`}
                      >
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      {formatDate(exp.date)}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {exp.isSample ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Sample
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          User Entry
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-slate-900">
                      {formatINR(exp.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setIsExpenseModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Healthcare Expense?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              This action will remove this expense record and automatically recalculate your monthly healthcare totals and budget utilization.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteExpense(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
