import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Sparkles,
  AlertCircle,
  PlusCircle,
  PiggyBank,
  Heart,
  CheckCircle,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Transaction, Budget, AIInsights } from "../types";
import { CATEGORY_COLORS } from "../data";

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  upcomingBills: any[];
  onAddTransactionClick: () => void;
  onPayBill: (billId: string) => void;
  aiInsights: AIInsights | null;
  loadingInsights: boolean;
  onRefreshInsights: () => void;
  onSelectTab: (tab: string) => void;
}

export default function Dashboard({
  transactions,
  budgets,
  upcomingBills,
  onAddTransactionClick,
  onPayBill,
  aiInsights,
  loadingInsights,
  onRefreshInsights,
  onSelectTab
}: DashboardProps) {
  // 1. Calculate stats dynamically
  const todayStr = new Date().toISOString().split("T")[0];

  const todaySpending = transactions
    .filter((t) => t.date === todayStr && t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // 2. Prepare chart data for Cash Flow (Historical over time)
  // Group by day for the last 30 days
  const last30Days = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last30Days.map((date) => {
    const dayInc = transactions
      .filter((t) => t.date === date && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExp = transactions
      .filter((t) => t.date === date && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const label = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    return {
      date: label,
      Income: dayInc,
      Expense: dayExp
    };
  });

  // 3. Prepare chart data for Category Distribution (Pie Chart)
  const categorySummary: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categorySummary[t.category] = (categorySummary[t.category] || 0) + t.amount;
    });

  const pieData = Object.entries(categorySummary).map(([name, value]) => ({
    name,
    value: Math.round(value)
  })).sort((a, b) => b.value - a.value);

  // Recalculate spent dynamically based on user's custom transaction list
  const activeBudgets = budgets.map((b) => {
    const currentSpent = transactions
      .filter((t) => t.type === "expense" && t.category === b.category)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...b,
      spent: currentSpent
    };
  });

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Balance Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-balance">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Net Balance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold tracking-tight ${balance >= 0 ? "text-gray-900" : "text-rose-600"}`}>
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className={`font-semibold ${balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {savingsRate >= 0 ? "+" : ""}{savingsRate.toFixed(1)}%
              </span>
              savings index
            </p>
          </div>
        </div>

        {/* Today's Spending */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-today">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Today's Spend</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              ₹{todaySpending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {todaySpending > 100 ? "⚠️ High variable day" : "✨ Smooth daily run"}
            </p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-income">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Income</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              ₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Cumulative credits</p>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-expense">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Expense</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              ₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Cumulative debits</p>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-savings">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Net Savings</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              ₹{(totalIncome - totalExpense).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              Active ledger reserves
            </p>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm transition-all hover:shadow-md flex flex-col justify-between" id="metric-health">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Health Score</span>
            <div className="p-2 bg-white/10 text-emerald-400 rounded-xl">
              <Heart size={18} fill="currentColor" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tight text-emerald-400">
                {aiInsights ? aiInsights.healthScore : "Calculating..."}
              </h3>
              <span className="text-xs text-indigo-200 font-medium">/100</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1 font-semibold flex items-center gap-1">
              ✨ {aiInsights ? aiInsights.healthScoreLabel : "Scanning context..."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Cash Flow & Breakout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Container */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Cash Flow Projection</h4>
                <p className="text-xs text-gray-400">Past 15 days transactional activity and trends</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                  <span className="text-gray-500">Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-gray-500">Expense</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions & Budgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budgets Tracker */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Budget Thresholds</h4>
                    <p className="text-xs text-gray-400">Monthly category spending status</p>
                  </div>
                  <button
                    onClick={() => onSelectTab("Transactions")}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {activeBudgets.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400">No category budgets established yet.</p>
                    </div>
                  ) : (
                    activeBudgets.map((b) => {
                      const percentage = Math.min((b.spent / b.limit) * 100, 100);
                      const isOver = b.spent > b.limit;

                      return (
                        <div key={b.category} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[b.category] || "#6b7280" }}
                              ></span>
                              {b.category}
                            </span>
                            <span>
                              ₹{Math.round(b.spent)} / <span className="text-gray-400">₹{b.limit}</span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : "bg-indigo-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Bills & Quick Actions */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Upcoming Bills</h4>
                <p className="text-xs text-gray-400 mb-4">Automated recurring reminders</p>

                <div className="space-y-3">
                  {upcomingBills.filter(b => !b.isPaid).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-2xl">
                      <CheckCircle size={24} className="text-emerald-500 mb-2" />
                      <p className="text-xs font-semibold text-gray-700">All Bills Settled!</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Nothing due for the upcoming cycles</p>
                    </div>
                  ) : (
                    upcomingBills.filter(b => !b.isPaid).slice(0, 3).map((bill) => (
                      <div key={bill.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100/60">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">{bill.title}</span>
                          <span className="text-[10px] text-gray-400 font-medium">Due: {bill.dueDate} ({bill.category})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-rose-600">₹{bill.amount.toFixed(2)}</span>
                          <button
                            onClick={() => onPayBill(bill.id)}
                            className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer"
                          >
                            Pay
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="pt-4 border-t border-gray-50 mt-4">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h5>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onAddTransactionClick}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <PlusCircle size={14} /> Add Spend
                  </button>
                  <button
                    onClick={() => onSelectTab("AI Advisor")}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Sparkles size={14} className="text-amber-400 animate-pulse" /> Ask Advisor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: AI Financial Insights Panel */}
        <div className="space-y-6">
          {/* AI Insights Panel */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/40 p-6 rounded-3xl border border-gray-100/80 shadow-sm flex flex-col justify-between h-full min-h-[500px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                  <h4 className="text-base font-extrabold text-gray-900 tracking-tight">AI Advisor Insights</h4>
                </div>
                <button
                  onClick={onRefreshInsights}
                  disabled={loadingInsights}
                  className="p-1.5 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 cursor-pointer text-gray-500 disabled:opacity-50"
                  title="Run Machine Learning Forecast"
                >
                  <Sparkles size={14} className={loadingInsights ? "animate-spin" : ""} />
                </button>
              </div>

              {loadingInsights ? (
                <div className="space-y-4 py-8 text-center">
                  <div className="relative inline-block">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles size={16} className="text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    Applying AI models...
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto italic">
                    "Scanning transaction history, detecting anomalies, forecasting upcoming liabilities..."
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Dynamic Recommendations & Warnings */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Alerts & Tips</h5>
                    {aiInsights?.insights.map((insight, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                        <AlertCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{insight}</p>
                      </div>
                    ))}
                    {(!aiInsights || aiInsights.insights.length === 0) && (
                      <p className="text-xs text-gray-400 italic">No automated warnings compiled. Add more spends to run predictions.</p>
                    )}
                  </div>

                  {/* Anomaly Detection */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anomaly Detection</h5>
                    {aiInsights?.anomalies.map((anom, idx) => (
                      <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100/80 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-800">{anom.description}</p>
                          <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500 font-semibold">
                            <span>Amount: <span className="text-rose-600 font-bold">₹{anom.amount}</span></span>
                            <span>{anom.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Forecast Panel */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                      <TrendingUp size={120} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Next Month Forecast</span>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        {aiInsights?.predictions.confidence || 75}% Conf.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] text-gray-400">Predicted Expense</span>
                        <p className="text-lg font-black text-rose-400 mt-0.5">
                          ₹{aiInsights?.predictions.nextMonthExpense || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400">Predicted Income</span>
                        <p className="text-lg font-black text-emerald-400 mt-0.5">
                          ₹{aiInsights?.predictions.nextMonthIncome || 0}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/60 pt-2 flex justify-between items-baseline">
                      <span className="text-[10px] text-gray-300">Net Estimated Savings</span>
                      <span className="text-sm font-extrabold text-white">
                        ₹{aiInsights?.predictions.predictedSavings || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Consultation Promo */}
            <div className="mt-6 p-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold">Unsure about your habits?</p>
                <p className="text-[10px] text-indigo-100">Consult your automated chatbot counselor</p>
              </div>
              <button
                onClick={() => onSelectTab("AI Advisor")}
                className="bg-white text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer"
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakout Chart & Recent List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category breakdown pie */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Expense Allocation</h4>
            <p className="text-xs text-gray-400 mb-4">Percentage allocation by category</p>

            {pieData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-gray-400">No spends to display allocation.</p>
              </div>
            ) : (
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#6366f1"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Spend</span>
                  <p className="text-base font-black text-gray-800">₹{Math.round(totalExpense)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-4 border-t border-gray-50 mt-4">
            {pieData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs font-medium text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CATEGORY_COLORS[item.name] }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-gray-800">
                  ₹{item.value} ({totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Recent Transactions</h4>
                <p className="text-xs text-gray-400">Your latest transactional flow</p>
              </div>
              <button
                onClick={() => onSelectTab("Transactions")}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                View Ledger
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-gray-400">No transaction logs logged yet.</p>
                </div>
              ) : (
                transactions.slice(-5).reverse().map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-gray-100/60">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[t.category]}12` || "#f1f5f9",
                          color: CATEGORY_COLORS[t.category] || "#6b7280"
                        }}
                      >
                        {t.category.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{t.merchant}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">
                            {t.category}
                          </span>
                          <span className="text-[10px] text-gray-400">{t.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-extrabold ${t.type === "income" ? "text-emerald-600" : "text-gray-900"}`}>
                        {t.type === "income" ? "+" : "-"}₹{t.amount.toFixed(2)}
                      </span>
                      {t.tags.length > 0 && (
                        <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                          #{t.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4 text-[11px] text-gray-400 font-medium">
            <span>Showing last 5 records</span>
            <span>Total Ledger Entries: {transactions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
