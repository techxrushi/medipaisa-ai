import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  ScanLine,
  BotMessageSquare,
  FileSpreadsheet,
  Plus,
  Sparkles,
  RefreshCw,
  Trash2,
  Menu,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatINR } from '../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSampleDataActive,
    resetToSampleData,
    clearAllData,
    openAddExpenseModal,
    budgetRemaining,
    budgetStatus,
  } = useExpenses();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budget', label: 'Budget Planner', icon: PiggyBank },
    { id: 'analyzer', label: 'AI Bill Scanner', icon: ScanLine, highlight: true },
    { id: 'copilot', label: 'Financial Assistant', icon: BotMessageSquare, highlight: true },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner if Sample Data is Active */}
      {isSampleDataActive && (
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border-b border-teal-200/60 px-4 py-1.5 text-xs text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold">
              i
            </span>
            <span>
              <strong>Demo Mode:</strong> Displaying realistic Indian family healthcare sample data. You can add your own bills or reset anytime.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={clearAllData}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear Demo Data
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={resetToSampleData}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reload Sample
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl font-black tracking-tight">₹</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    Medi<span className="text-teal-600">Paisa</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 tracking-wider uppercase">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                  Family Healthcare Financial Intelligence
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-teal-700 bg-teal-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Scan Bill button */}
            <button
              onClick={() => setActiveTab('analyzer')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition shadow-2xs cursor-pointer"
              title="Upload prescription or hospital bill for AI OCR extraction"
            >
              <ScanLine className="w-3.5 h-3.5 text-teal-600" />
              <span>Scan Bill</span>
            </button>

            {/* + Add Expense button */}
            <button
              onClick={() => openAddExpenseModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-lg shadow-sm shadow-teal-700/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-semibold">
                    AI
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                resetToSampleData();
                setMobileMenuOpen(false);
              }}
              className="text-teal-700 font-medium hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Sample Data
            </button>
            <button
              onClick={() => {
                clearAllData();
                setMobileMenuOpen(false);
              }}
              className="text-rose-600 font-medium hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear All Data
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
