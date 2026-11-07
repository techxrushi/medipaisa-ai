/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ExpenseManager } from './components/ExpenseManager';
import { BudgetPlanner } from './components/BudgetPlanner';
import { BillAnalyzer } from './components/BillAnalyzer';
import { AICopilot } from './components/AICopilot';
import { Reports } from './components/Reports';
import { ExpenseModal } from './components/ExpenseModal';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useExpenses();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Global Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'expenses' && <ExpenseManager />}
        {activeTab === 'budget' && <BudgetPlanner />}
        {activeTab === 'analyzer' && <BillAnalyzer />}
        {activeTab === 'copilot' && <AICopilot />}
        {activeTab === 'reports' && <Reports />}
      </main>

      {/* Global Expense Add / Edit Modal */}
      <ExpenseModal />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              ₹
            </div>
            <span className="font-bold text-slate-800">MediPaisa AI</span>
            <span>• Healthcare Financial Intelligence for Indian Families</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Bill Scanner
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Budget Planner
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Financial Assistant
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              CSV Export
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center md:text-right">
            <span>Built for AI-Finance Healthcare Planning • All amounts in Indian Rupees (₹)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}
