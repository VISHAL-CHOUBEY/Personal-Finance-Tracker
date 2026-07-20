import React, { useState, useRef } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Tag,
  Upload,
  X,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Paperclip,
  Check,
  ChevronDown,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction } from "../types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_COLORS, exportToCSV, exportToExcel, exportToPDF } from "../data";
import BulkImportModal from "./BulkImportModal";

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onEditTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (id: string) => void;
}

export default function TransactionList({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction
}: TransactionListProps) {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // Modal control
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Add/Edit Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formCategory, setFormCategory] = useState("Food");
  const [formAmount, setFormAmount] = useState("");
  const [formMerchant, setFormMerchant] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringInterval, setFormRecurringInterval] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [formIsUpcomingBill, setFormIsUpcomingBill] = useState(false);

  // Receipt Scanner state
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Reset form helper
  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormType("expense");
    setFormCategory("Food");
    setFormAmount("");
    setFormMerchant("");
    setFormNotes("");
    setFormTags("");
    setFormIsRecurring(false);
    setFormRecurringInterval("monthly");
    setFormIsUpcomingBill(false);
    setReceiptImageName(null);
    setOcrSuccess(false);
  };

  const handleOpenAddModal = () => {
    setEditingTx(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormDate(tx.date);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormAmount(tx.amount.toString());
    setFormMerchant(tx.merchant);
    setFormNotes(tx.notes);
    setFormTags(tx.tags.join(", "));
    setFormIsRecurring(tx.isRecurring);
    setFormRecurringInterval(tx.recurringInterval === "none" ? "monthly" : (tx.recurringInterval as any));
    setFormIsUpcomingBill(tx.isUpcomingBill);
    setReceiptImageName(tx.receiptFileName || null);
    setOcrSuccess(false);
    setShowAddModal(true);
  };

  // Automated category prediction using Express API
  const handleMerchantBlur = async () => {
    if (!formMerchant || formMerchant.trim().length < 2) return;
    try {
      const res = await fetch("/api/ai/predict-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant: formMerchant })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) {
          setFormCategory(data.category);
          setFormType(data.type);
        }
      }
    } catch (e) {
      console.error("Failed to fetch predicted category:", e);
    }
  };

  // Receipt File Upload & OCR
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptImageName(file.name);
    setUploadingReceipt(true);
    setOcrSuccess(false);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        try {
          const response = await fetch("/api/ai/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Str, mimeType: file.type })
          });
          if (response.ok) {
            const data = await response.json();
            // Pre-populate Form with OCR Data
            if (data.merchant) setFormMerchant(data.merchant);
            if (data.amount) setFormAmount(data.amount.toString());
            if (data.date) setFormDate(data.date);
            if (data.category) {
              setFormCategory(data.category);
              setFormType("expense"); // receipts are usually expenses
            }
            if (data.notes) setFormNotes(data.notes);
            if (data.tags && Array.isArray(data.tags)) setFormTags(data.tags.join(", "));
            setOcrSuccess(true);
          }
        } catch (err) {
          console.error("Receipt OCR API error:", err);
        } finally {
          setUploadingReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("FileReader conversion error:", err);
      setUploadingReceipt(false);
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMerchant || !formAmount) return;

    const parsedTags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const payload = {
      date: formDate,
      type: formType,
      category: formCategory,
      amount: parseFloat(formAmount) || 0,
      merchant: formMerchant,
      notes: formNotes,
      tags: parsedTags,
      isRecurring: formIsRecurring,
      recurringInterval: formIsRecurring ? formRecurringInterval : ("none" as any),
      isUpcomingBill: formIsUpcomingBill,
      receiptFileName: receiptImageName || undefined
    };

    if (editingTx) {
      onEditTransaction(editingTx.id, payload);
    } else {
      onAddTransaction(payload);
    }
    setShowAddModal(false);
    resetForm();
  };

  // 1. Filter Transactions
  const filteredTransactions = transactions
    .filter((tx) => {
      // Search matches note, tag, category, or merchant
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        tx.merchant.toLowerCase().includes(s) ||
        tx.notes.toLowerCase().includes(s) ||
        tx.category.toLowerCase().includes(s) ||
        tx.tags.some((tag) => tag.toLowerCase().includes(s));

      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    })
    // 2. Sort Transactions
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

  return (
    <div className="space-y-6" id="ledger-module">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Financial Ledger</h2>
          <p className="text-xs text-gray-400">Add, duplicate, filter, and audit your personal transactions</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Export Transactions"
            >
              <Download size={14} /> Export Options <ChevronDown size={12} className={`transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showExportDropdown && (
                <>
                  {/* Invisible backdrop to dismiss dropdown */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-50"
                  >
                    {/* Filtered List Section */}
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                        Filtered List ({filteredTransactions.length})
                      </p>
                      <button
                        onClick={() => {
                          exportToCSV(filteredTransactions);
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={13} className="text-indigo-600" /> Export CSV
                      </button>
                      <button
                        onClick={() => {
                          exportToExcel(filteredTransactions);
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileCode size={13} className="text-teal-600" /> Export Excel
                      </button>
                      <button
                        onClick={() => {
                          exportToPDF(filteredTransactions, "Filtered Transactions");
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileText size={13} className="text-rose-600" /> Export PDF Report
                      </button>
                    </div>

                    {/* Full Ledger Section */}
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                        Full Ledger ({transactions.length})
                      </p>
                      <button
                        onClick={() => {
                          exportToCSV(transactions);
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={13} className="text-indigo-600 opacity-70" /> Export CSV (All)
                      </button>
                      <button
                        onClick={() => {
                          exportToExcel(transactions);
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileCode size={13} className="text-teal-600 opacity-70" /> Export Excel (All)
                      </button>
                      <button
                        onClick={() => {
                          exportToPDF(transactions, "Full Transaction Ledger");
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 p-1.5 px-2 hover:bg-slate-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                      >
                        <FileText size={13} className="text-rose-600 opacity-70" /> Export PDF Report (All)
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Import multiple transactions from a CSV file"
          >
            <Upload size={14} /> Bulk Import CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus size={14} /> Add transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold text-gray-600"
          >
            <option value="all">All Types</option>
            <option value="income">Credits / Income Only</option>
            <option value="expense">Debits / Expenses Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-gray-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold text-gray-600"
          >
            <option value="all">All Categories</option>
            <optgroup label="Income Categories">
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Expense Categories">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold text-gray-600"
          >
            <option value="date-desc">Date (Latest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="ledger-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Merchant & Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Tags / Notes</th>
                <th className="p-4">Recurrence</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60 text-xs text-gray-600 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Search size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-500 text-sm">No ledger entries matched your parameters</p>
                    <p className="text-xs text-gray-400 mt-1">Try resetting the searches or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                          {tx.merchant}
                          {tx.receiptFileName && (
                            <span className="text-indigo-600" title={`Scanned: ${tx.receiptFileName}`}>
                              <Paperclip size={11} />
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">{tx.date}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[tx.category] || "#94a3b8" }}
                        ></span>
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <div className="flex flex-col gap-1">
                        {tx.notes && <p className="text-gray-500 italic max-w-xs truncate">{tx.notes}</p>}
                        <div className="flex flex-wrap gap-1">
                          {tx.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-extrabold bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded-md uppercase"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {tx.isRecurring ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full inline-block uppercase">
                          🔁 {tx.recurringInterval}
                        </span>
                      ) : (
                        <span className="text-gray-400">One-off</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black text-xs ${tx.type === "income" ? "text-emerald-600" : "text-gray-900"}`}>
                        {tx.type === "income" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-all cursor-pointer"
                          title="Edit Transaction"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDuplicateTransaction(tx.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-all cursor-pointer"
                          title="Duplicate Transaction"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 pl-6 bg-slate-50/50 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          <span>Active view matches: {filteredTransactions.length} items</span>
          <span>Ledger Reserve Value: ₹{transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="text-base font-extrabold text-gray-900">
                  {editingTx ? "Modify Transaction Details" : "Log New Financial Record"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* OCR Receipt Upload Panel */}
              {!editingTx && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-indigo-900">
                      <Sparkles size={16} className="animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider">AI Receipt OCR Scan</span>
                    </div>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                      Gemini OCR
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
                    Upload your shopping or restaurant receipt. Gemini will scan and automatically populate the fields!
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingReceipt}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Upload size={14} /> {uploadingReceipt ? "Reading invoice..." : "Select Invoice"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {receiptImageName && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 max-w-xs truncate">
                        <Paperclip size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{receiptImageName}</span>
                        {ocrSuccess && <Check size={14} className="text-emerald-500 shrink-0" />}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flow Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("expense");
                        setFormCategory("Food");
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        formType === "expense"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Debit / Spend
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("income");
                        setFormCategory("Salary");
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        formType === "income"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Credit / Income
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-bold"
                  />
                </div>

                {/* Merchant */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Merchant / Payer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walmart, Client INC"
                    required
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    onBlur={handleMerchantBlur}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-bold"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-bold text-gray-700"
                  >
                    {formType === "income"
                      ? INCOME_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      : EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. food, weekend, office"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transaction Notes</label>
                <textarea
                  placeholder="Summarize item breakdown or details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-medium"
                ></textarea>
              </div>

              {/* Recurring Switch */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800">Recurring Transaction Commitment</span>
                    <span className="text-[10px] text-gray-400 font-medium">Re-charge this ledger dynamically</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>

                {formIsRecurring && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/50">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Frequency</label>
                      <select
                        value={formRecurringInterval}
                        onChange={(e: any) => setFormRecurringInterval(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold text-gray-700"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2 self-end pb-1.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-700">Flag as Bill Reminder</span>
                        <span className="text-[9px] text-gray-400">Post to upcoming schedules</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formIsUpcomingBill}
                        onChange={(e) => setFormIsUpcomingBill(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-slate-50 text-gray-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {editingTx ? "Save Changes" : "Log Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onImport={(newTxs) => {
            newTxs.forEach((tx) => onAddTransaction(tx));
          }}
        />
      )}
    </div>
  );
}
