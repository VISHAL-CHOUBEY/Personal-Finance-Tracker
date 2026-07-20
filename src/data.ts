import { Transaction, Budget } from "./types";

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Interest",
  "Cashback",
  "Rental Income",
  "Others"
];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Electricity",
  "Internet",
  "Phone Recharge",
  "Medical",
  "Entertainment",
  "Education",
  "EMI",
  "Loan",
  "Insurance",
  "Fuel",
  "Subscriptions",
  "Rent",
  "Miscellaneous"
];

// Helper to get matching color code for categories
export const CATEGORY_COLORS: Record<string, string> = {
  // Income
  Salary: "#10B981", // Emerald
  Freelance: "#34D399", // Mint
  Business: "#059669", // Dark Emerald
  Investment: "#06B6D4", // Cyan
  Interest: "#3B82F6", // Blue
  Cashback: "#F59E0B", // Amber
  "Rental Income": "#8B5CF6", // Violet
  Others: "#6B7280", // Gray

  // Expenses
  Food: "#EF4444", // Red
  Travel: "#3B82F6", // Blue
  Shopping: "#EC4899", // Pink
  Electricity: "#F59E0B", // Amber
  Internet: "#06B6D4", // Cyan
  "Phone Recharge": "#14B8A6", // Teal
  Medical: "#10B981", // Emerald
  Entertainment: "#8B5CF6", // Violet
  Education: "#6366F1", // Indigo
  EMI: "#F43F5E", // Rose
  Loan: "#D97706", // Dark Amber
  Insurance: "#059669", // Dark Emerald
  Fuel: "#F97316", // Orange
  Subscriptions: "#A855F7", // Purple
  Rent: "#4B5563", // Slate Gray
  Miscellaneous: "#6B7280" // Gray
};

// Generates 15 realistic historical transactions for demonstration
const today = new Date();
const formatDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(today.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    date: formatDate(0),
    type: "expense",
    category: "Food",
    amount: 320,
    merchant: "Starbucks Coffee",
    notes: "Morning cappuccino and croissant with colleague",
    tags: ["coffee", "social"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-2",
    date: formatDate(1),
    type: "expense",
    category: "Shopping",
    amount: 4500,
    merchant: "D-Mart Supermarket",
    notes: "Groceries, laundry detergent, and toiletries",
    tags: ["household", "shopping"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-3",
    date: formatDate(2),
    type: "expense",
    category: "Food",
    amount: 2800,
    merchant: "Reliance Fresh",
    notes: "Weekly grocery run - vegetables, fruits, chicken, milk",
    tags: ["groceries", "healthy"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-4",
    date: formatDate(3),
    type: "income",
    category: "Freelance",
    amount: 55000,
    merchant: "Acme Web Design",
    notes: "Milestone payment for portfolio website landing page",
    tags: ["invoice", "web-dev"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-5",
    date: formatDate(5),
    type: "expense",
    category: "Fuel",
    amount: 3200,
    merchant: "IndianOil Petrol Pump",
    notes: "Filled up sedan fuel tank",
    tags: ["commute", "gas"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-6",
    date: formatDate(7),
    type: "expense",
    category: "Subscriptions",
    amount: 649,
    merchant: "Netflix India",
    notes: "Monthly premium streaming subscription",
    tags: ["entertainment", "streaming"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  },
  {
    id: "tx-7",
    date: formatDate(10),
    type: "income",
    category: "Salary",
    amount: 95000,
    merchant: "Globex Corporation",
    notes: "Bi-weekly paycheck deposit direct transfer",
    tags: ["salary", "globex"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  },
  {
    id: "tx-8",
    date: formatDate(12),
    type: "expense",
    category: "Rent",
    amount: 22000,
    merchant: "Oakridge Apartments",
    notes: "Monthly rent payment for 2BHK flat",
    tags: ["rent", "home"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  },
  {
    id: "tx-9",
    date: formatDate(14),
    type: "expense",
    category: "Electricity",
    amount: 4500,
    merchant: "State Electricity Board",
    notes: "Power utility bill for summer period",
    tags: ["bills", "utility"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-10",
    date: formatDate(18),
    type: "expense",
    category: "Medical",
    amount: 850,
    merchant: "Apollo Pharmacy",
    notes: "Prescribed headache pills and vitamins",
    tags: ["health", "meds"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-11",
    date: formatDate(20),
    type: "income",
    category: "Investment",
    amount: 6500,
    merchant: "Zerodha Mutual Funds",
    notes: "Quarterly dividend payout",
    tags: ["dividends", "investing"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-12",
    date: formatDate(25),
    type: "expense",
    category: "Entertainment",
    amount: 1200,
    merchant: "PVR Cinemas",
    notes: "Concert film tickets and popcorn combo",
    tags: ["weekend", "movies"],
    isRecurring: false,
    recurringInterval: "none",
    isUpcomingBill: false
  },
  {
    id: "tx-13",
    date: formatDate(28),
    type: "expense",
    category: "Internet",
    amount: 999,
    merchant: "Airtel Xstream Fiber",
    notes: "High speed fiber internet line subscription",
    tags: ["bills", "work-from-home"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  },
  {
    id: "tx-14",
    date: formatDate(35),
    type: "income",
    category: "Salary",
    amount: 95000,
    merchant: "Globex Corporation",
    notes: "Previous bi-weekly salary deposit",
    tags: ["salary"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  },
  {
    id: "tx-15",
    date: formatDate(40),
    type: "expense",
    category: "Rent",
    amount: 22000,
    merchant: "Oakridge Apartments",
    notes: "Previous rent payment",
    tags: ["rent"],
    isRecurring: true,
    recurringInterval: "monthly",
    isUpcomingBill: false
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: "Food", limit: 12000, spent: 3120 },
  { category: "Travel", limit: 8000, spent: 0 },
  { category: "Shopping", limit: 15000, spent: 4500 },
  { category: "Rent", limit: 22000, spent: 22000 },
  { category: "Entertainment", limit: 6000, spent: 1200 },
  { category: "Fuel", limit: 10000, spent: 3200 },
  { category: "Subscriptions", limit: 4000, spent: 649 }
];

export const INITIAL_UPCOMING_BILLS = [
  {
    id: "bill-1",
    title: "Airtel Xstream Fiber",
    dueDate: formatDate(-5), // Due in 5 days
    amount: 999,
    category: "Internet",
    isPaid: false,
    recurringInterval: "monthly"
  },
  {
    id: "bill-2",
    title: "Car Insurance Renewal",
    dueDate: formatDate(-12), // Due in 12 days
    amount: 8500,
    category: "Insurance",
    isPaid: false,
    recurringInterval: "monthly"
  },
  {
    id: "bill-3",
    title: "Gold's Gym Premium",
    dueDate: formatDate(-22), // Due in 22 days
    amount: 1500,
    category: "Subscriptions",
    isPaid: false,
    recurringInterval: "monthly"
  }
];

// CSV Export Utility
export function exportToCSV(transactions: Transaction[]) {
  const headers = ["ID", "Date", "Type", "Category", "Amount", "Merchant", "Notes", "Tags", "Recurring", "Upcoming Bill"];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type,
    t.category,
    t.amount,
    `"${t.merchant.replace(/"/g, '""')}"`,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
    `"${(t.tags || []).join(", ")}"`,
    t.isRecurring ? t.recurringInterval : "No",
    t.isUpcomingBill ? "Yes" : "No"
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Personal_Finance_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Simple text-based Excel download helper (tab separated file works natively in Excel)
export function exportToExcel(transactions: Transaction[]) {
  const headers = ["ID", "Date", "Type", "Category", "Amount", "Merchant", "Notes", "Tags", "Recurring", "Upcoming Bill"];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type,
    t.category,
    t.amount,
    t.merchant,
    t.notes || "",
    (t.tags || []).join(", "),
    t.isRecurring ? t.recurringInterval : "No",
    t.isUpcomingBill ? "Yes" : "No"
  ]);

  const tsvContent = "data:application/vnd.ms-excel;charset=utf-8," 
    + [headers.join("\t"), ...rows.map(e => e.join("\t"))].join("\n");

  const encodedUri = encodeURI(tsvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Personal_Finance_Ledger_${new Date().toISOString().split("T")[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Beautiful export to PDF via clean window print layout
export function exportToPDF(transactions: Transaction[], reportType: string) {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked! Please allow popups to export the PDF report.");
    return;
  }

  const todayStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const rowsHtml = transactions.map(t => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-size: 11px;">${t.date}</td>
      <td style="padding: 10px; font-size: 11px; font-weight: bold; color: ${t.type === 'income' ? '#059669' : '#e11d48'};">
        ${t.type.toUpperCase()}
      </td>
      <td style="padding: 10px; font-size: 11px; font-weight: 600; color: #1e293b;">${escapeHtml(t.merchant)}</td>
      <td style="padding: 10px; font-size: 11px; color: #475569;">${t.category}</td>
      <td style="padding: 10px; font-size: 11px; color: #64748b; font-style: italic;">
        ${escapeHtml(t.notes || "-")}
        ${t.tags && t.tags.length > 0 ? `<br/><span style="font-size: 9px; font-weight: bold; color: #6366f1;">${t.tags.map(tag => `#${tag}`).join(' ')}</span>` : ''}
      </td>
      <td style="padding: 10px; font-size: 11px; text-align: right; font-weight: bold; color: ${t.type === 'income' ? '#059669' : '#0f172a'};">
        ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Personal Finance Ledger - ${reportType}</title>
      <style>
        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          margin: 40px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .meta {
          font-size: 11px;
          color: #64748b;
          text-align: right;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
          background: #f8fafc;
        }
        .card-label {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .card-value {
          font-size: 18px;
          font-weight: 800;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          text-align: left;
          padding: 10px;
          border-bottom: 2px solid #cbd5e1;
          letter-spacing: 0.05em;
        }
        @media print {
          body { margin: 20px; }
          button { display: none; }
          @page { size: auto; margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Personal Finance Ledger</div>
          <div style="font-size: 12px; color: #475569; font-weight: 500; margin-top: 2px;">Report: ${reportType}</div>
        </div>
        <div class="meta">
          <div>Generated on: ${todayStr}</div>
          <div>Total Transactions: ${transactions.length}</div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="card" style="border-left: 4px solid #10b981;">
          <div class="card-label">Total Cash Inflow</div>
          <div class="card-value" style="color: #059669;">₹${totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card" style="border-left: 4px solid #f43f5e;">
          <div class="card-label">Total Cash Outflow</div>
          <div class="card-value" style="color: #e11d48;">₹${totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card" style="border-left: 4px solid #3b82f6;">
          <div class="card-label">Net reserves</div>
          <div class="card-value" style="color: ${netBalance >= 0 ? '#1d4ed8' : '#b91c1c'};">
            ₹${netBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 12%;">Date</th>
            <th style="width: 10%;">Type</th>
            <th style="width: 25%;">Merchant</th>
            <th style="width: 15%;">Category</th>
            <th style="width: 26%;">Notes / Tags</th>
            <th style="width: 12%; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; font-weight: 500;">
        End of Report — Personal Finance Tracker Ledger
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
