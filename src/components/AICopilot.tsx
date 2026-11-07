import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  PiggyBank,
  Pill,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  KeyRound,
  TrendingUp,
  FileText,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { ChatMessage } from '../types';
import { formatINR } from '../utils/formatters';

// 4 Specific Required Quick Question Buttons
const QUICK_QUESTIONS = [
  {
    label: 'Analyze My Expenses',
    prompt: 'Please analyze my healthcare expenses for this month in detail. What are my highest spending areas and how do they compare with last month?',
    icon: Receipt,
  },
  {
    label: 'Check My Budget',
    prompt: 'Please check my healthcare budget utilization. How much remains, am I at risk of exceeding my cap, and how should I pace my daily spending?',
    icon: PiggyBank,
  },
  {
    label: 'Find Saving Opportunities',
    prompt: 'What practical opportunities can help our family save on medical costs (such as PMBJP Jan Aushadhi generic medicines, Section 80D tax deductions, and diagnostic package savings)?',
    icon: Pill,
  },
  {
    label: 'Monthly Spending Summary',
    prompt: 'Give me a comprehensive spending summary of my recorded healthcare expenses this month, including totals, categories, and key trends.',
    icon: FileText,
  },
];

export const AICopilot: React.FC = () => {
  const {
    expenses,
    budget,
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
    isSampleDataActive,
    setActiveTab,
  } = useExpenses();

  // Initial welcome message grounded in current numbers
  const initialWelcome = useMemo(() => {
    if (expenses.length === 0) {
      return `Namaste! I am your **MediPaisa Financial Assistant**.

You currently have **no expenses recorded** in your ledger. 

To help you analyze your healthcare spending, evaluate your budget, and find savings opportunities:
• Use the **AI Bill Scanner** to upload a pharmacy or hospital receipt, or
• Click **+ Add Expense** to record your first medical bill.

Once you have recorded your expenses, I can calculate your spending velocity, compare categories, and estimate your monthly healthcare budget!`;
    }

    return `Namaste! I am your **MediPaisa Financial Assistant**, specialized in Indian family healthcare finance.

I have synchronized with your actual records:
• This Month's Healthcare Spend: **${formatINR(currentMonthTotal)}**
• Monthly Budget Cap: **${formatINR(budget.monthlyBudget)}** (${budgetUtilizationPercent}% utilized • **${formatINR(budgetRemaining)}** remaining)
• Top Expense Category: **${topCategory || 'Medicines'} (${formatINR(topCategory ? categoryTotals[topCategory] : 0)})**
• Total Records Audited: **${expenses.length} bills** (${isSampleDataActive ? 'Sample Data Mode' : 'Personal Records'})

How can I help you plan your healthcare finances today? Click one of the quick questions below or ask any question!`;
  }, [
    expenses.length,
    currentMonthTotal,
    budget.monthlyBudget,
    budgetUtilizationPercent,
    budgetRemaining,
    topCategory,
    categoryTotals,
    isSampleDataActive,
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: initialWelcome,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      source: 'initial_sync',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check server health and API key availability
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHasApiKey(Boolean(data.hasApiKey));
        }
      } catch (e) {
        console.warn('Health check failed:', e);
      }
    };
    checkApiKey();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: initialWelcome,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        source: 'initial_sync',
      },
    ]);
    setLastFailedPrompt(null);
  };

  const handleSend = async (userPrompt?: string) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastFailedPrompt(null);

    try {
      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            expenses,
            monthlyBudget: budget.monthlyBudget,
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
            totalRecordCount: expenses.length,
            isSampleData: isSampleDataActive,
            monthlyTrends,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'MISSING_API_KEY') {
          setHasApiKey(false);
          throw new Error(
            'Gemini API key is not configured. Please add GEMINI_API_KEY in the AI Studio Settings > Secrets panel.'
          );
        }
        throw new Error(data.message || data.error || 'Failed to receive response from Gemini AI.');
      }

      setHasApiKey(true);
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'live_gemini',
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('MediPaisa Financial Assistant error:', err);
      setLastFailedPrompt(textToSend);

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to complete response**

${err.message || 'An unexpected connection or API error occurred.'}

You can click **"Retry Last Question"** below to try again.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to calculate daily run rate estimate
  const currentDay = Math.max(1, new Date().getDate());
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyRunRate = Math.round(currentMonthTotal / currentDay);
  const projectedMonthTotal = dailyRunRate * daysInMonth;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              MediPaisa Financial Assistant
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Grounded in Real Records</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalized healthcare financial planning, monthly budget diagnostics, generic medicine savings (PMBJP), and Section 80D tax deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Clear conversation history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Missing API Key Guidance Banner (if detected) */}
      {hasApiKey === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-amber-900 flex-1">
            <h3 className="font-bold text-sm">Gemini API Key Required</h3>
            <p className="leading-relaxed">
              To enable live conversational responses, please ensure your Google Gemini API key is configured in the <strong>Settings &gt; Secrets</strong> panel in the AI Studio sidebar with the key name <code>GEMINI_API_KEY</code>.
            </p>
            <p className="text-[11px] text-amber-800 font-medium pt-1">
              • AI Studio automatically injects this secret into your server environment without exposing it to the browser.
            </p>
          </div>
        </div>
      )}

      {/* Real-Time Financial Snapshot Card */}
      <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-teal-50/70 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Current Real-Time Ledger Summary</span>
          </div>
          <button
            onClick={() => setActiveTab('expenses')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 underline cursor-pointer"
          >
            View All {expenses.length} Bills
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
            <span className="text-slate-500 block mb-0.5">This Month's Spend</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatINR(currentMonthTotal)}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
            <span className="text-slate-500 block mb-0.5">Remaining Cushion</span>
            <span
              className={`text-base sm:text-lg font-extrabold ${
                budgetRemaining > 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatINR(budgetRemaining)}
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
            <span className="text-slate-500 block mb-0.5">Budget Utilized</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {budgetUtilizationPercent}%
            </span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
            <span className="text-slate-500 block mb-0.5">Run-Rate Estimate*</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {currentMonthTotal > 0 ? formatINR(projectedMonthTotal) : '₹0'}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-2.5 italic">
          * Run-rate estimate is a mathematical projection based on ₹{dailyRunRate}/day across {daysInMonth} days, not a guaranteed financial outcome.
        </p>
      </div>

      {/* Main Chat Interface Window */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[540px]">
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = msg.id.startsWith('err-');

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-teal-600 text-white'
                      : isError
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-gradient-to-tr from-teal-700 to-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : isError ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <BotMessageSquare className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-xs'
                      : isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1.5">{msg.content}</div>

                  {/* Bubble Footer: Timestamp & Actions */}
                  <div
                    className={`text-[10px] mt-2 flex items-center justify-between gap-2 pt-1 border-t ${
                      isUser
                        ? 'text-teal-200 border-teal-500/40'
                        : isError
                        ? 'text-rose-500 border-rose-200/60'
                        : 'text-slate-400 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{msg.timestamp}</span>
                      {!isUser && !isError && msg.source === 'live_gemini' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-100/90 px-1.5 py-0.5 rounded text-[9px]">
                          <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                          <span>Gemini Live AI</span>
                        </span>
                      )}
                      {!isUser && !isError && msg.source === 'rule_engine' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-200/90 px-1.5 py-0.5 rounded text-[9px]">
                          <span>Ledger Calculation</span>
                        </span>
                      )}
                      {!isUser && !isError && msg.source === 'initial_sync' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded text-[9px]">
                          <span>Ledger Synced</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className={`hover:opacity-100 transition flex items-center gap-1 cursor-pointer ${
                          isUser ? 'text-teal-100 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white flex items-center justify-center shrink-0">
                <BotMessageSquare className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 rounded-tl-xs text-xs text-slate-700 flex items-center gap-2.5 shadow-2xs">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                <span>MediPaisa Financial Assistant is reviewing your actual expenses & calculating answers...</span>
              </div>
            </div>
          )}

          {/* Retry Option Banner if last prompt failed */}
          {lastFailedPrompt && !isLoading && (
            <div className="flex items-center justify-center p-2">
              <button
                onClick={() => handleSend(lastFailedPrompt)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Last Question ("{lastFailedPrompt.slice(0, 30)}...")</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Buttons Area (Directly above input) */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Quick Questions:
          </span>
          {QUICK_QUESTIONS.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.label}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(q.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-teal-600" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Input Box & Send Button */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask: 'What is my total spending this month?' or 'Which expenses increased?'..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-teal-600/30 transition cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Financial & Medical Safety Disclaimer */}
          <div className="mt-2 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span>
              <strong>Financial Safety:</strong> MediPaisa Financial Assistant offers expense budgeting & savings calculations. It never provides medical diagnoses, will never request OTPs/PINs, and cannot access bank accounts.
            </span>
            <span className="shrink-0 text-slate-500 font-medium">Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
};
