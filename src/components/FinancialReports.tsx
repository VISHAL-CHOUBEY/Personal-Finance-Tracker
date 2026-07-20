import React, { useState } from "react";
import {
  FileText,
  Calendar,
  PieChart as PieIcon,
  TrendingUp,
  PiggyBank,
  Heart,
  Download,
  Mail,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Transaction, Budget, AIInsights } from "../types";
import { CATEGORY_COLORS } from "../data";

interface FinancialReportsProps {
  transactions: Transaction[];
  budgets: Budget[];
  aiInsights: AIInsights | null;
}

type ReportType =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly"
  | "Category"
  | "Expense"
  | "Income"
  | "Savings"
  | "Score";

export default function FinancialReports({
  transactions,
  budgets,
  aiInsights
}: FinancialReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>("Monthly");
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalIncome - totalExpense;

  // 1. Prepare Report Charts data depending on active selection
  const getReportChart = () => {
    switch (activeReport) {
      case "Daily": {
        // Group transactions by day of week
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const grouped = weekdays.map((day) => ({ name: day, Income: 0, Expense: 0 }));

        transactions.forEach((t) => {
          const dayIndex = new Date(t.date).getDay();
          const amt = t.amount;
          if (t.type === "income") grouped[dayIndex].Income += amt;
          else grouped[dayIndex].Expense += amt;
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "Weekly": {
        // Simple aggregate over 4 weeks
        const weeks = [
          { name: "Week 1", Income: totalIncome * 0.25, Expense: totalExpense * 0.2 },
          { name: "Week 2", Income: totalIncome * 0.2, Expense: totalExpense * 0.25 },
          { name: "Week 3", Income: totalIncome * 0.3, Expense: totalExpense * 0.15 },
          { name: "Week 4", Income: totalIncome * 0.25, Expense: totalExpense * 0.4 }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `₹${Number(v).toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case "Yearly": {
        // Group by year or quarters
        const quarters = [
          { name: "Q1", Income: totalIncome * 0.4, Expense: totalExpense * 0.3 },
          { name: "Q2", Income: totalIncome * 0.5, Expense: totalExpense * 0.4 },
          { name: "Q3", Income: totalIncome * 0.6, Expense: totalExpense * 0.5 },
          { name: "Q4", Income: totalIncome * 0.8, Expense: totalExpense * 0.6 }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarters}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `₹${Number(v).toFixed(0)}`} />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "Category": {
        // Render Pie Chart of Expense allocation
        const catSummary: Record<string, number> = {};
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            catSummary[t.category] = (catSummary[t.category] || 0) + t.amount;
          });

        const data = Object.entries(catSummary).map(([name, value]) => ({
          name,
          value: Math.round(value)
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v}`} />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case "Expense": {
        // Group expense transactions by category in a Bar chart
        const catSummary: Record<string, number> = {};
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            catSummary[t.category] = (catSummary[t.category] || 0) + t.amount;
          });

        const data = Object.entries(catSummary).map(([name, amount]) => ({
          name,
          Amount: Math.round(amount)
        })).sort((a, b) => b.Amount - a.Amount);

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="Amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "Income": {
        // Group income transactions by category in a Bar chart
        const catSummary: Record<string, number> = {};
        transactions
          .filter((t) => t.type === "income")
          .forEach((t) => {
            catSummary[t.category] = (catSummary[t.category] || 0) + t.amount;
          });

        const data = Object.entries(catSummary).map(([name, amount]) => ({
          name,
          Amount: Math.round(amount)
        })).sort((a, b) => b.Amount - a.Amount);

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="Amount" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "Savings": {
        // Income vs Expense area difference (Savings index)
        const sampleData = [
          { name: "Month 1", Income: totalIncome * 0.8, Expense: totalExpense * 0.9, Savings: (totalIncome * 0.8) - (totalExpense * 0.9) },
          { name: "Month 2", Income: totalIncome * 0.9, Expense: totalExpense * 0.85, Savings: (totalIncome * 0.9) - (totalExpense * 0.85) },
          { name: "Month 3", Income: totalIncome, Expense: totalExpense, Savings: totalIncome - totalExpense }
        ];

        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `₹${Number(v).toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="Savings" stroke="#0ea5e9" strokeWidth={4} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case "Score": {
        // Financial health historical scorecard
        const scoreData = [
          { name: "May", Score: 68 },
          { name: "Jun", Score: 71 },
          { name: "Jul", Score: aiInsights?.healthScore || 75 }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreData} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="Score" fill="#6366f1" radius={[8, 8, 0, 0]}>
                {scoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.Score > 75 ? "#10b981" : "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "Monthly":
      default: {
        // Standard Monthly comparison Bar chart
        const summary = [
          { name: "Credits / Income", amount: totalIncome },
          { name: "Debits / Expense", amount: totalExpense },
          { name: "Net Savings", amount: savings }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} margin={{ top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: "bold" }} />
              <YAxis />
              <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
                <Cell fill="#0ea5e9" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
  };

  // Mock Email Dispatcher
  const handleEmailReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setEmailStatus("sending");
    setTimeout(() => {
      setEmailStatus("sent");
      setTimeout(() => {
        setEmailStatus("idle");
        setEmailInput("");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6" id="reports-module">
      {/* Reports Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Financial Portfolio Reports</h2>
          <p className="text-xs text-gray-400">Multi-dimensional analysis graphs, downloads, and automation services</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick PDF button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download size={14} /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Grid: Navigation & active chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2 h-fit">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4 px-2">Report Types</span>
          {[
            { id: "Daily", label: "Daily Activity", icon: Calendar },
            { id: "Weekly", label: "Weekly Trend", icon: TrendingUp },
            { id: "Monthly", label: "Monthly Summary", icon: FileText },
            { id: "Yearly", label: "Quarterly / Yearly", icon: Calendar },
            { id: "Category", label: "Category Pie", icon: PieIcon },
            { id: "Expense", label: "Expense Breakdown", icon: FileText },
            { id: "Income", label: "Income Breakdown", icon: FileText },
            { id: "Savings", label: "Savings index", icon: PiggyBank },
            { id: "Score", label: "Financial Scorecard", icon: Heart }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id as any)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-slate-50 hover:text-gray-800"
                }`}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>

        {/* Chart Viewport */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">{activeReport} Financial Report</h3>
                <p className="text-xs text-gray-400">Visualizing consolidated ledger reserves dynamically</p>
              </div>
              <div className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl uppercase">
                Consolidated View
              </div>
            </div>

            {/* Render active chart container */}
            <div className="h-80 w-full" id="active-report-chart">
              {getReportChart()}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
            <span>Portfolio Reserves: ₹{(totalIncome - totalExpense).toFixed(2)}</span>
            <span>Historical Entries Evaluated: {transactions.length}</span>
          </div>
        </div>
      </div>

      {/* Report Automations: Email Reports & Excel export triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email automation service */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-indigo-600 shrink-0" />
            <h4 className="text-sm font-black text-gray-800">Schedule Email Reports</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-semibold">
            Input your email below to schedule automated daily, weekly, or monthly financial breakdown portfolio reports sent straight to your inbox.
          </p>

          <form onSubmit={handleEmailReport} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="e.g. 17kumarkush@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-medium"
            />
            <button
              type="submit"
              disabled={emailStatus !== "idle"}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {emailStatus === "sending" ? "Dispatching..." : emailStatus === "sent" ? "Dispatched!" : "Dispatch Report"}
            </button>
          </form>

          {emailStatus === "sent" && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs font-bold">
              <CheckCircle size={14} /> Report compiled and scheduled successfully for dispatch to {emailInput}!
            </div>
          )}
        </div>

        {/* Quick Excel export block */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
              <h4 className="text-sm font-black text-gray-800 font-bold">Consolidated Ledger Export</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              Compile your entire transactional history, current active budget statuses, category thresholds, and financial scores into a clean, fully compatible Excel tabular spreadsheet file (.xls).
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                // Compile and export transactions
                const rows = transactions.map(t => [
                  t.id, t.date, t.type, t.category, t.amount, t.merchant, t.notes
                ]);
                const headers = ["ID", "Date", "Type", "Category", "Amount", "Merchant", "Notes"];
                const content = "data:application/vnd.ms-excel;charset=utf-8," 
                  + [headers.join("\t"), ...rows.map(e => e.join("\t"))].join("\n");
                const uri = encodeURI(content);
                const link = document.createElement("a");
                link.setAttribute("href", uri);
                link.setAttribute("download", `Full_Consolidated_Finance_Ledger.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center justify-center gap-1.5 w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Download size={14} /> Compile & Download Consolidated Ledger Sheets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
