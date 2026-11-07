import React, { useState, useEffect } from 'react';
import { X, Check, IndianRupee, Calendar, Tag, Building2, FileText, AlertCircle } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { ExpenseCategory, Expense } from '../types';
import { getTodayDateString } from '../utils/formatters';

const CATEGORIES: ExpenseCategory[] = [
  'Medicines',
  'Doctor Consultation',
  'Laboratory Tests',
  'Hospitalization',
  'Other',
];

export const ExpenseModal: React.FC = () => {
  const {
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    editingExpense,
    setEditingExpense,
    presetModalData,
    addExpense,
    updateExpense,
  } = useExpenses();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Medicines');
  const [date, setDate] = useState(getTodayDateString());
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setDate(editingExpense.date || getTodayDateString());
      setVendor(editingExpense.vendor || '');
      setNotes(editingExpense.notes || '');
      setErrors({});
    } else if (presetModalData) {
      setName(presetModalData.name || '');
      setAmount(presetModalData.amount ? String(presetModalData.amount) : '');
      setCategory(presetModalData.category || 'Medicines');
      setDate(presetModalData.date || getTodayDateString());
      setVendor(presetModalData.vendor || '');
      setNotes(presetModalData.notes || '');
      setErrors({});
    } else {
      // Clean slate
      setName('');
      setAmount('');
      setCategory('Medicines');
      setDate(getTodayDateString());
      setVendor('');
      setNotes('');
      setErrors({});
    }
  }, [editingExpense, presetModalData, isExpenseModalOpen]);

  if (!isExpenseModalOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Please provide an expense description or item name.';
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than ₹0.';
    }
    if (!date) {
      newErrors.date = 'Please select a date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        name: name.trim(),
        amount: parsedAmount,
        category,
        date,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addExpense({
        name: name.trim(),
        amount: parsedAmount,
        category,
        date,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        billData: presetModalData?.billData,
      });
    }

    closeModal();
  };

  const closeModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50/50 border-b border-teal-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              ₹
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingExpense ? 'Edit Healthcare Expense' : 'Record New Expense'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingExpense
                  ? 'Update expense details and category'
                  : 'Add doctor fees, prescription drugs, diagnostics or hospital bills'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apollo Diabetes Medicines Refill, Dr. Rao Consultation"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (INR ₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2450"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition ${
                    errors.amount
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 transition ${
                    errors.date
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.date}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Healthcare Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition border cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vendor / Pharmacy / Hospital */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Healthcare Provider / Pharmacy / Lab (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Apollo Pharmacy, Dr. Lal PathLabs, Max Hospital"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes or Prescription Details (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Metformin 30 days pack, 10% coupon used, for Mother"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{editingExpense ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
