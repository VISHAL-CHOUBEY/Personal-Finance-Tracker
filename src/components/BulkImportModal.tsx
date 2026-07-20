import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Info,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, TransactionType } from "../types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../data";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newTransactions: Omit<Transaction, "id">[]) => void;
}

interface ColumnMapping {
  dateColumn: string;
  merchantColumn: string;
  amountColumn: string;
  typeColumn: string;
  categoryColumn: string;
  notesColumn: string;
  tagsColumn: string;
}

interface PreviewRow {
  id: string;
  raw: string[];
  parsed: {
    date: string;
    merchant: string;
    amount: number;
    type: TransactionType;
    category: string;
    notes: string;
    tags: string[];
  };
  errors: {
    date?: string;
    merchant?: string;
    amount?: string;
  };
  selected: boolean;
}

// Robust CSV Parser
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\r" || char === "\n") {
        row.push(cell.trim());
        cell = "";
        if (row.length > 0 && row.some(c => c !== "")) {
          result.push(row);
        }
        row = [];
        if (char === "\r" && nextChar === "\n") {
          i++; // Skip LF
        }
      } else {
        cell += char;
      }
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== "")) {
      result.push(row);
    }
  }

  return result;
}

// Intelligent Date Parser
function parseDate(dateStr: string): { isValid: boolean; formatted: string } {
  if (!dateStr) return { isValid: false, formatted: new Date().toISOString().split("T")[0] };

  const trimmed = dateStr.trim();

  // Try ISO date parsing first
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    // Check if it's a realistic year
    const year = d.getFullYear();
    if (year > 1980 && year < 2100) {
      return { isValid: true, formatted: d.toISOString().split("T")[0] };
    }
  }

  // Regex matches:
  // 1. DD-MM-YYYY or DD/MM/YYYY
  const dmYMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmYMatch) {
    const day = parseInt(dmYMatch[1], 10);
    const month = parseInt(dmYMatch[2], 10);
    const year = parseInt(dmYMatch[3], 10);
    if (month <= 12 && day <= 31) {
      const testDate = new Date(year, month - 1, day);
      if (!isNaN(testDate.getTime())) {
        return { isValid: true, formatted: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
      }
    }
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD
  const YmdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (YmdMatch) {
    const year = parseInt(YmdMatch[1], 10);
    const month = parseInt(YmdMatch[2], 10);
    const day = parseInt(YmdMatch[3], 10);
    if (month <= 12 && day <= 31) {
      return { isValid: true, formatted: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
    }
  }

  // 3. DD-MMM-YYYY (e.g., 20-Jul-2026 or 20-Jul-26)
  const monthsMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const mmmMatch = trimmed.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/);
  if (mmmMatch) {
    const day = parseInt(mmmMatch[1], 10);
    const mStr = mmmMatch[2].toLowerCase();
    let year = parseInt(mmmMatch[3], 10);
    if (year < 100) year += 2000;
    const month = monthsMap[mStr];
    if (month && day <= 31) {
      return { isValid: true, formatted: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
    }
  }

  return { isValid: false, formatted: new Date().toISOString().split("T")[0] };
}

// Intelligent Amount Parser
function parseAmount(amtStr: string): { isValid: boolean; amount: number } {
  if (!amtStr) return { isValid: false, amount: 0 };
  const cleaned = amtStr.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    return { isValid: false, amount: 0 };
  }
  return { isValid: true, amount: Math.abs(parsed) };
}

// Parse Type
function parseType(typeStr: string, amtStr?: string): TransactionType {
  if (!typeStr) {
    if (amtStr && amtStr.trim().startsWith("+")) {
      return "income";
    }
    return "expense";
  }
  const t = typeStr.toLowerCase().trim();
  if (t === "income" || t === "credit" || t === "cr" || t === "in" || t === "deposit" || t === "received" || t === "plus") {
    return "income";
  }
  return "expense";
}

// Parse Category matches
function parseCategory(catStr: string, type: TransactionType): string {
  if (!catStr) {
    return type === "income" ? "Freelance" : "Food";
  }
  const cleanCat = catStr.trim();
  const available = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  const exactMatch = available.find(c => c.toLowerCase() === cleanCat.toLowerCase());
  if (exactMatch) return exactMatch;

  const partialMatch = available.find(c => cleanCat.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(cleanCat.toLowerCase()));
  if (partialMatch) return partialMatch;

  return cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1);
}

export default function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mapping configuration
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateColumn: "",
    merchantColumn: "",
    amountColumn: "",
    typeColumn: "",
    categoryColumn: "",
    notesColumn: "",
    tagsColumn: "",
  });

  // Default values for unmapped/optional columns
  const [defaultType, setDefaultType] = useState<TransactionType>("expense");
  const [defaultCategory, setDefaultCategory] = useState<string>("Food");

  // Final preview rows
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  
  // Pagination for Preview Step
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle CSV file content loading
  const handleFileContent = (text: string, name: string) => {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      alert("The selected CSV file must contain a header row and at least one transaction row.");
      return;
    }

    const detectedHeaders = rows[0];
    const dataRows = rows.slice(1);

    setFileName(name);
    setHeaders(detectedHeaders);
    setRawData(dataRows);

    // Dynamic smart matching guesser
    const initialMapping: ColumnMapping = {
      dateColumn: "",
      merchantColumn: "",
      amountColumn: "",
      typeColumn: "",
      categoryColumn: "",
      notesColumn: "",
      tagsColumn: "",
    };

    detectedHeaders.forEach(h => {
      const clean = h.toLowerCase().trim();
      
      // Date Mapping
      if (!initialMapping.dateColumn && (clean.includes("date") || clean.includes("time") || clean === "day" || clean === "when")) {
        initialMapping.dateColumn = h;
      }
      // Amount Mapping
      if (!initialMapping.amountColumn && (clean.includes("amount") || clean.includes("val") || clean.includes("price") || clean.includes("sum") || clean.includes("cost") || clean.includes("total") || clean.includes("rupee") || clean.includes("money") || clean === "amt" || clean === "value")) {
        initialMapping.amountColumn = h;
      }
      // Merchant Mapping
      if (!initialMapping.merchantColumn && (clean.includes("merchant") || clean.includes("payee") || clean.includes("receiver") || clean.includes("shop") || clean.includes("vendor") || clean.includes("description") || clean.includes("desc") || clean.includes("title") || clean.includes("name") || clean.includes("particulars") || clean.includes("trans") || clean === "to" || clean === "from")) {
        initialMapping.merchantColumn = h;
      }
      // Type Mapping
      if (!initialMapping.typeColumn && (clean.includes("type") || clean.includes("credit") || clean.includes("debit") || clean.includes("dr_cr") || clean === "dr" || clean === "cr")) {
        initialMapping.typeColumn = h;
      }
      // Category Mapping
      if (!initialMapping.categoryColumn && (clean.includes("category") || clean.includes("cat") || clean.includes("group") || clean.includes("class"))) {
        initialMapping.categoryColumn = h;
      }
      // Notes Mapping
      if (!initialMapping.notesColumn && (clean.includes("note") || clean.includes("memo") || clean.includes("comment") || clean.includes("remark") || clean.includes("message"))) {
        initialMapping.notesColumn = h;
      }
      // Tags Mapping
      if (!initialMapping.tagsColumn && (clean.includes("tag") || clean.includes("tags") || clean.includes("label") || clean.includes("labels"))) {
        initialMapping.tagsColumn = h;
      }
    });

    setMapping(initialMapping);
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleFileContent(text, file.name);
    };
    reader.readAsText(file);
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleFileContent(text, file.name);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid CSV (.csv) file.");
    }
  };

  // Generate mapping preview rows
  const generatePreview = () => {
    if (!mapping.dateColumn || !mapping.merchantColumn || !mapping.amountColumn) {
      alert("Please map the required columns: Date, Merchant, and Amount.");
      return;
    }

    const dateIdx = headers.indexOf(mapping.dateColumn);
    const merchantIdx = headers.indexOf(mapping.merchantColumn);
    const amountIdx = headers.indexOf(mapping.amountColumn);
    const typeIdx = mapping.typeColumn ? headers.indexOf(mapping.typeColumn) : -1;
    const categoryIdx = mapping.categoryColumn ? headers.indexOf(mapping.categoryColumn) : -1;
    const notesIdx = mapping.notesColumn ? headers.indexOf(mapping.notesColumn) : -1;
    const tagsIdx = mapping.tagsColumn ? headers.indexOf(mapping.tagsColumn) : -1;

    const previews: PreviewRow[] = rawData.map((row, index) => {
      const dateVal = dateIdx !== -1 ? row[dateIdx] : "";
      const merchantVal = merchantIdx !== -1 ? row[merchantIdx] : "";
      const amountVal = amountIdx !== -1 ? row[amountIdx] : "";
      const typeVal = typeIdx !== -1 ? row[typeIdx] : "";
      const categoryVal = categoryIdx !== -1 ? row[categoryIdx] : "";
      const notesVal = notesIdx !== -1 ? row[notesIdx] : "";
      const tagsVal = tagsIdx !== -1 ? row[tagsIdx] : "";

      const parsedDate = parseDate(dateVal);
      const parsedAmount = parseAmount(amountVal);
      const parsedType = typeIdx !== -1 ? parseType(typeVal, amountVal) : defaultType;
      const parsedCategory = categoryIdx !== -1 ? parseCategory(categoryVal, parsedType) : defaultCategory;

      const errors: PreviewRow["errors"] = {};
      if (!parsedDate.isValid) {
        errors.date = `Invalid Date: "${dateVal || "Empty"}"`;
      }
      if (!merchantVal || merchantVal.trim() === "") {
        errors.merchant = "Merchant cannot be empty";
      }
      if (!parsedAmount.isValid) {
        errors.amount = `Invalid Amount: "${amountVal || "Empty"}"`;
      }

      // Tags splitter by semicolon, comma or bar
      let parsedTags: string[] = [];
      if (tagsVal) {
        parsedTags = tagsVal
          .split(/[;,|]+/)
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0);
      }

      return {
        id: `import-row-${index}`,
        raw: row,
        parsed: {
          date: parsedDate.formatted,
          merchant: merchantVal || "Unknown Merchant",
          amount: parsedAmount.amount,
          type: parsedType,
          category: parsedCategory,
          notes: notesVal || "",
          tags: parsedTags,
        },
        errors,
        selected: Object.keys(errors).length === 0, // auto select if no errors
      };
    });

    setPreviewRows(previews);
    setCurrentPage(1);
    setStep(3);
  };

  // Perform bulk import execution
  const handleConfirmImport = () => {
    const toImport = previewRows.filter(r => r.selected);
    if (toImport.length === 0) {
      alert("No rows selected for import.");
      return;
    }

    const payload: Omit<Transaction, "id">[] = toImport.map(row => ({
      date: row.parsed.date,
      type: row.parsed.type,
      category: row.parsed.category,
      amount: row.parsed.amount,
      merchant: row.parsed.merchant,
      notes: row.parsed.notes,
      tags: row.parsed.tags,
      isRecurring: false,
      recurringInterval: "none",
      isUpcomingBill: false
    }));

    onImport(payload);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRawData([]);
    setMapping({
      dateColumn: "",
      merchantColumn: "",
      amountColumn: "",
      typeColumn: "",
      categoryColumn: "",
      notesColumn: "",
      tagsColumn: "",
    });
    setDefaultType("expense");
    setDefaultCategory("Food");
    setPreviewRows([]);
  };

  // Sample CSV trigger download
  const handleDownloadSample = () => {
    const csvContent = "Date,Merchant,Amount,Type,Category,Notes,Tags\n" +
      "2026-07-15,Starbucks Coffee,320.00,expense,Food,Morning cappuccino with partner,coffee;beverage\n" +
      "2026-07-18,Globex Corporation,95000.00,income,Salary,Regular direct deposit pay,salary;bonus\n" +
      "2026-07-19,PVR Cinemas,1200.00,expense,Entertainment,Concert movie tickets,movies;weekend\n" +
      "2026-07-20,Reliance Fresh,2800.00,expense,Food,Weekly vegetables and groceries,groceries;home";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "finance_ledger_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle selection
  const toggleRowSelected = (id: string) => {
    setPreviewRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = () => {
    const hasUnselected = previewRows.some(r => !r.selected && Object.keys(r.errors).length === 0);
    setPreviewRows(prev => prev.map(r => {
      // Don't auto-select rows with blocking errors
      if (Object.keys(r.errors).length > 0) return r;
      return { ...r, selected: hasUnselected };
    }));
  };

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = previewRows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(previewRows.length / itemsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileSpreadsheet size={18} />
              </span>
              <h2 className="text-base font-bold text-gray-900">Bulk Import Ledger Entries</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">Upload a CSV file and map column headers to quickly populate transactions.</p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="p-1.5 hover:bg-slate-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
          {[
            { num: 1, label: "Upload CSV" },
            { num: 2, label: "Map Columns" },
            { num: 3, label: "Preview & Import" }
          ].map((s) => (
            <div key={s.num} className="flex-1 flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  step === s.num
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                    : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${step === s.num ? "text-indigo-600" : "text-slate-400"}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className="flex-1 h-0.5 bg-slate-100 mx-2 hidden sm:block"></div>}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50/40"
                        : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv"
                      className="hidden"
                    />
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
                      <Upload size={28} />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Drag and drop your CSV ledger file here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse local files (max 2MB, CSV format)</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3">
                    <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">Supported Formats & Auto-detection</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        We automatically scan your CSV headers to detect columns. Don&apos;t worry if your headers are named differently (e.g., &quot;Txn Date&quot;, &quot;Cost&quot;, or &quot;Payee&quot;) — you can custom map them in the next step.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side Sample Download and Template Guide */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-800/80 shadow-md flex flex-col justify-between h-full">
                    <div>
                      <span className="text-[9px] font-extrabold tracking-widest bg-white/10 text-white uppercase px-2 py-0.5 rounded-full inline-block">
                        Quick Start Template
                      </span>
                      <h3 className="text-sm font-black mt-3 leading-tight">Need a formatted starter CSV?</h3>
                      <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                        Download our pre-styled template containing perfect dummy transaction headers (Merchant, Date, Amount, Categories) to structure your data hassle-free.
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadSample}
                      className="mt-6 flex items-center justify-center gap-2 w-full p-3 bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Download size={14} /> Download Sample CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 px-4 bg-indigo-50 border border-indigo-100/60 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-900">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold">Successfully loaded &quot;{fileName}&quot; ({rawData.length} rows detected)</span>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wider"
                >
                  Change File
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Map CSV Headers to Ledger Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required Columns */}
                  <div className="space-y-4 border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <h4 className="text-xs font-bold text-gray-800">Required Identifiers</h4>
                    </div>

                    {/* Date Mapping */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                        <span>Transaction Date</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <select
                        value={mapping.dateColumn}
                        onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold text-gray-700"
                      >
                        <option value="">-- Select Date Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Merchant Mapping */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                        <span>Merchant / Payee</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <select
                        value={mapping.merchantColumn}
                        onChange={(e) => setMapping({ ...mapping, merchantColumn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold text-gray-700"
                      >
                        <option value="">-- Select Merchant Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Mapping */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                        <span>Amount (₹)</span>
                        <span className="text-rose-500 font-black">*</span>
                      </label>
                      <select
                        value={mapping.amountColumn}
                        onChange={(e) => setMapping({ ...mapping, amountColumn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold text-gray-700"
                      >
                        <option value="">-- Select Amount Column --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Metadata Columns */}
                  <div className="space-y-4 border border-slate-100 bg-white rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <h4 className="text-xs font-bold text-gray-800">Optional Attributes</h4>
                    </div>

                    {/* Type Column */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type Column</label>
                        <select
                          value={mapping.typeColumn}
                          onChange={(e) => setMapping({ ...mapping, typeColumn: e.target.value })}
                          className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-[11px] bg-white font-semibold text-gray-600"
                        >
                          <option value="">Fallback Default</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {!mapping.typeColumn && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fallback Type</label>
                          <select
                            value={defaultType}
                            onChange={(e: any) => setDefaultType(e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-[11px] bg-white font-bold text-gray-700"
                          >
                            <option value="expense">Expense (Debit)</option>
                            <option value="income">Income (Credit)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Category Column */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Column</label>
                        <select
                          value={mapping.categoryColumn}
                          onChange={(e) => setMapping({ ...mapping, categoryColumn: e.target.value })}
                          className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-[11px] bg-white font-semibold text-gray-600"
                        >
                          <option value="">Fallback Default</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {!mapping.categoryColumn && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fallback Category</label>
                          <select
                            value={defaultCategory}
                            onChange={(e) => setDefaultCategory(e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-[11px] bg-white font-bold text-gray-700"
                          >
                            {defaultType === "income" ? (
                              INCOME_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))
                            ) : (
                              EXPENSE_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))
                            )}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Notes Column */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notes Column</label>
                      <select
                        value={mapping.notesColumn}
                        onChange={(e) => setMapping({ ...mapping, notesColumn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-600"
                      >
                        <option value="">-- Skip / No Notes --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tags Column */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tags Column</label>
                      <select
                        value={mapping.tagsColumn}
                        onChange={(e) => setMapping({ ...mapping, tagsColumn: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-semibold text-gray-600"
                      >
                        <option value="">-- Skip / No Tags --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & IMPORT */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Warnings and summary counters */}
              <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="flex gap-4 items-center">
                  <div className="text-center bg-white border border-slate-100/80 p-2.5 px-4 rounded-2xl min-w-[100px]">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mapped Total</span>
                    <p className="text-base font-black text-slate-800">{previewRows.length}</p>
                  </div>
                  <div className="text-center bg-emerald-50 border border-emerald-100/60 p-2.5 px-4 rounded-2xl min-w-[100px]">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Ready / Valid</span>
                    <p className="text-base font-black text-emerald-700">
                      {previewRows.filter(r => Object.keys(r.errors).length === 0).length}
                    </p>
                  </div>
                  <div className="text-center bg-amber-50 border border-amber-100/60 p-2.5 px-4 rounded-2xl min-w-[100px]">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Has Errors</span>
                    <p className="text-base font-black text-amber-700">
                      {previewRows.filter(r => Object.keys(r.errors).length > 0).length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="p-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Select / Deselect Valid Rows
                  </button>
                </div>
              </div>

              {/* Warnings Banner if any row has errors */}
              {previewRows.some(r => Object.keys(r.errors).length > 0) && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-rose-800">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Unmappable cells detected</p>
                    <p className="text-[10px] text-rose-600 mt-0.5 leading-normal">
                      Some rows contain invalid date formats or amounts that aren&apos;t numeric values. We have deselected them automatically to safeguard your portfolio reserves.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="p-3 pl-4 w-12 text-center">Import</th>
                        <th className="p-3">Merchant</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 max-w-xs">Notes / Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] text-gray-600 font-medium">
                      {currentItems.map((row) => {
                        const hasErrors = Object.keys(row.errors).length > 0;
                        return (
                          <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${hasErrors ? "bg-rose-50/20" : ""}`}>
                            <td className="p-3 pl-4 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                disabled={hasErrors}
                                onChange={() => toggleRowSelected(row.id)}
                                className={`w-3.5 h-3.5 rounded border-gray-300 focus:ring-indigo-600/20 ${
                                  hasErrors ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                }`}
                              />
                            </td>
                            <td className="p-3 font-bold text-gray-900">
                              {row.parsed.merchant}
                              {row.errors.merchant && (
                                <p className="text-[9px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle size={8} /> {row.errors.merchant}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              {row.parsed.date}
                              {row.errors.date && (
                                <p className="text-[9px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle size={8} /> {row.errors.date}
                                </p>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                row.parsed.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                              }`}>
                                {row.parsed.type}
                              </span>
                            </td>
                            <td className="p-3">{row.parsed.category}</td>
                            <td className="p-3 text-right font-black text-gray-800">
                              <span className={row.parsed.type === "income" ? "text-emerald-600" : "text-gray-900"}>
                                {row.parsed.type === "income" ? "+" : "-"}₹{row.parsed.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              {row.errors.amount && (
                                <p className="text-[9px] text-rose-500 font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                                  <AlertTriangle size={8} /> {row.errors.amount}
                                </p>
                              )}
                            </td>
                            <td className="p-3 max-w-xs truncate">
                              <div className="space-y-0.5">
                                {row.parsed.notes && <p className="text-gray-400 italic truncate">{row.parsed.notes}</p>}
                                {row.parsed.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {row.parsed.tags.map(tag => (
                                      <span key={tag} className="text-[8px] font-bold bg-indigo-50 text-indigo-600 rounded px-1">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, previewRows.length)} of {previewRows.length} entries</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            {step === 2 && (
              <p className="text-[10px] font-semibold text-gray-400 leading-none">
                * required mappings must be filled to generate preview
              </p>
            )}
            {step === 3 && (
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Checked & ready for ledger integration
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step === 3 ? 2 : 1)}
                className="flex items-center gap-1.5 p-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            {step === 1 && (
              <button
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="p-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step === 2 && (
              <button
                onClick={generatePreview}
                disabled={!mapping.dateColumn || !mapping.merchantColumn || !mapping.amountColumn}
                className="flex items-center gap-1.5 p-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Generate Preview <ArrowRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleConfirmImport}
                disabled={previewRows.filter(r => r.selected).length === 0}
                className="flex items-center gap-1.5 p-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                Confirm & Import {previewRows.filter(r => r.selected).length} Rows
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
