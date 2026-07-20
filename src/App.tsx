import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BarChart3,
  TrendingUp,
  Settings,
  Bell,
  Wallet,
  PiggyBank,
  CheckCircle,
  X,
  Plus
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import AICounselor from "./components/AICounselor";
import FinancialReports from "./components/FinancialReports";
import { Transaction, Budget, AIInsights, ChatMessage } from "./types";
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_UPCOMING_BILLS,
  EXPENSE_CATEGORIES
} from "./data";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");

  // Core Persisted Ledger State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);

  // Settings & Budget Edit State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempBudgets, setTempBudgets] = useState<Budget[]>([]);

  // 1. Initial State Hydration & Storage Binding
  useEffect(() => {
    // Sync Transactions
    const storedTx = localStorage.getItem("fin_transactions");
    if (storedTx) {
      try {
        setTransactions(JSON.parse(storedTx));
      } catch (e) {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem("fin_transactions", JSON.stringify(INITIAL_TRANSACTIONS));
    }

    // Sync Budgets
    const storedBudgets = localStorage.getItem("fin_budgets");
    if (storedBudgets) {
      try {
        setBudgets(JSON.parse(storedBudgets));
      } catch (e) {
        setBudgets(INITIAL_BUDGETS);
      }
    } else {
      setBudgets(INITIAL_BUDGETS);
      localStorage.setItem("fin_budgets", JSON.stringify(INITIAL_BUDGETS));
    }

    // Sync Upcoming Bills
    const storedBills = localStorage.getItem("fin_bills");
    if (storedBills) {
      try {
        setUpcomingBills(JSON.parse(storedBills));
      } catch (e) {
        setUpcomingBills(INITIAL_UPCOMING_BILLS);
      }
    } else {
      setUpcomingBills(INITIAL_UPCOMING_BILLS);
      localStorage.setItem("fin_bills", JSON.stringify(INITIAL_UPCOMING_BILLS));
    }

    // Sync Chat History
    const storedChat = localStorage.getItem("fin_chat");
    if (storedChat) {
      try {
        setChatHistory(JSON.parse(storedChat));
      } catch (e) {
        setChatHistory([]);
      }
    }
  }, []);

  // 2. Refresh Insights dynamically from our Express Backend
  const refreshInsights = async (txList: Transaction[], budgetList: Budget[]) => {
    setLoadingInsights(true);
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txList, budgets: budgetList })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data);
      } else {
        throw new Error("Insights response failed");
      }
    } catch (e) {
      console.error("Failed to fetch fresh AI insights, compiling fallbacks:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Trigger analysis when transactions list loads or length changes
  useEffect(() => {
    if (transactions.length > 0) {
      refreshInsights(transactions, budgets);
    }
  }, [transactions.length]);

  // Save changes helper
  const saveTransactions = (newList: Transaction[]) => {
    setTransactions(newList);
    localStorage.setItem("fin_transactions", JSON.stringify(newList));
  };

  // 3. Core Transactions API Callbacks
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const freshTx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    const updated = [...transactions, freshTx];
    saveTransactions(updated);
  };

  const handleEditTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, ...updatedFields } : t));
    saveTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    saveTransactions(updated);
  };

  const handleDuplicateTransaction = (id: string) => {
    const match = transactions.find((t) => t.id === id);
    if (!match) return;

    const duplicate: Transaction = {
      ...match,
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split("T")[0] // set duplicated date to today
    };
    const updated = [...transactions, duplicate];
    saveTransactions(updated);
  };

  // 4. Pay Bill Shortcut (Creates automatic expense entry)
  const handlePayBill = (billId: string) => {
    const billMatch = upcomingBills.find((b) => b.id === billId);
    if (!billMatch) return;

    // Mark bill as paid locally
    const updatedBills = upcomingBills.map((b) => (b.id === billId ? { ...b, isPaid: true } : b));
    setUpcomingBills(updatedBills);
    localStorage.setItem("fin_bills", JSON.stringify(updatedBills));

    // Register a matching expense transaction to deduct balance
    const autoExpense: Transaction = {
      id: `tx-bill-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      category: billMatch.category,
      amount: billMatch.amount,
      merchant: `Paid: ${billMatch.title}`,
      notes: "Auto-logged from upcoming recurring bill ledger reminder",
      tags: ["bill", "recurring", "auto-paid"],
      isRecurring: billMatch.recurringInterval !== "once",
      recurringInterval: billMatch.recurringInterval === "once" ? "none" : (billMatch.recurringInterval as any),
      isUpcomingBill: false
    };

    const updatedTx = [...transactions, autoExpense];
    saveTransactions(updatedTx);
  };

  // 5. Chat History updates
  const handleAddChatMessage = (newMsg: ChatMessage) => {
    const updated = [...chatHistory, newMsg];
    setChatHistory(updated);
    localStorage.setItem("fin_chat", JSON.stringify(updated));
  };

  // 6. Manage budgets settings
  const handleOpenSettings = () => {
    setTempBudgets([...budgets]);
    setShowSettingsModal(true);
  };

  const handleSaveBudgetsSetting = () => {
    setBudgets(tempBudgets);
    localStorage.setItem("fin_budgets", JSON.stringify(tempBudgets));
    setShowSettingsModal(false);
    refreshInsights(transactions, tempBudgets);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-800" id="main-root">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-slate-800" id="sidebar-panel">
        <div className="p-6 space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles size={18} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase">FinAI Advisor</h1>
              <span className="text-[10px] text-indigo-300 font-extrabold tracking-widest uppercase">Portfolio Manager</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "Transactions", label: "Ledger Book", icon: FileText },
              { id: "AI Advisor", label: "FinAI Assistant", icon: Sparkles },
              { id: "Reports", label: "Portfolio Reports", icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Settings Shortcuts */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 border border-indigo-500/25">
              KK
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block text-white truncate">Kush Kumar</span>
              <span className="text-[10px] text-gray-500 block truncate font-medium">17kumarkush@gmail.com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={handleOpenSettings}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold border border-slate-800 transition-all cursor-pointer"
            >
              <Settings size={12} /> Budgets
            </button>
            <button
              onClick={() => {
                if (confirm("Reset local storage transactions ledger back to demonstration data?")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center justify-center gap-1.5 p-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-300 rounded-xl text-[10px] font-bold border border-rose-900/30 transition-all cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-area">
        {/* Top Header navbar */}
        <header className="bg-white border-b border-gray-100 p-4 px-6 md:px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Brand */}
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex md:hidden items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{activeTab} Workspace</h3>
              <p className="text-[10px] text-gray-400 font-semibold">{new Date().toDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile tab switches */}
            <div className="flex md:hidden border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {[
                { id: "Dashboard", icon: LayoutDashboard },
                { id: "Transactions", icon: FileText },
                { id: "AI Advisor", icon: Sparkles },
                { id: "Reports", icon: BarChart3 }
              ].map((mTab) => {
                const Icon = mTab.icon;
                const isAct = activeTab === mTab.id;
                return (
                  <button
                    key={mTab.id}
                    onClick={() => setActiveTab(mTab.id)}
                    className={`p-2 px-3 transition-all cursor-pointer ${
                      isAct ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>

            {/* Notification Indicator badge */}
            <div className="relative p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-gray-500">
              <Bell size={15} />
              {upcomingBills.filter((b) => !b.isPaid).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </div>

            {/* Account Quick Status */}
            <div className="hidden md:flex items-center gap-2 text-xs font-bold bg-slate-50 border border-gray-100/60 p-1.5 px-3 rounded-2xl text-gray-600">
              <Wallet size={12} className="text-indigo-600" />
              <span>Balance: <span className="text-gray-900 font-black">₹{transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></span>
            </div>
          </div>
        </header>

        {/* Content Container (Slight padding for beautiful layouts) */}
        <section className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeTab === "Dashboard" && (
            <Dashboard
              transactions={transactions}
              budgets={budgets}
              upcomingBills={upcomingBills}
              onAddTransactionClick={() => setActiveTab("Transactions")}
              onPayBill={handlePayBill}
              aiInsights={aiInsights}
              loadingInsights={loadingInsights}
              onRefreshInsights={() => refreshInsights(transactions, budgets)}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === "Transactions" && (
            <TransactionList
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
            />
          )}

          {activeTab === "AI Advisor" && (
            <AICounselor
              transactions={transactions}
              budgets={budgets}
              chatHistory={chatHistory}
              onAddChatMessage={handleAddChatMessage}
            />
          )}

          {activeTab === "Reports" && (
            <FinancialReports
              transactions={transactions}
              budgets={budgets}
              aiInsights={aiInsights}
            />
          )}
        </section>
      </main>

      {/* Global Settings & Budget Configuration Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-gray-900">Manage Budget Thresholds</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-400 leading-relaxed font-semibold mb-2">
                Establish monthly spending thresholds per categories. When variable outlays exceed 85% of limit, alerts are broadcasted.
              </p>

              {tempBudgets.map((tb, index) => (
                <div key={tb.category} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-gray-800">{tb.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      value={tb.limit}
                      onChange={(e) => {
                        const updated = tempBudgets.map((item, idx) =>
                          idx === index ? { ...item, limit: Number(e.target.value) || 0 } : item
                        );
                        setTempBudgets(updated);
                      }}
                      className="w-24 px-3 py-1.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
                    />
                  </div>
                </div>
              ))}

              {/* Add unbudgeted expense categories */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const existingCats = tempBudgets.map((b) => b.category);
                    const unbudgeted = EXPENSE_CATEGORIES.find((cat) => !existingCats.includes(cat));
                    if (unbudgeted) {
                      setTempBudgets([...tempBudgets, { category: unbudgeted, limit: 100, spent: 0 }]);
                    } else {
                      alert("All categories are currently budgeted!");
                    }
                  }}
                  className="flex items-center justify-center gap-1 w-full py-2 border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-gray-500 hover:text-indigo-600 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Add Category Budget limit
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudgetsSetting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
