export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investment'
  | 'Interest'
  | 'Cashback'
  | 'Rental Income'
  | 'Others';

export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Electricity'
  | 'Internet'
  | 'Phone Recharge'
  | 'Medical'
  | 'Entertainment'
  | 'Education'
  | 'EMI'
  | 'Loan'
  | 'Insurance'
  | 'Fuel'
  | 'Subscriptions'
  | 'Rent'
  | 'Miscellaneous';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory | string;
  amount: number;
  merchant: string;
  notes: string;
  tags: string[];
  isRecurring: boolean;
  recurringInterval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
  receiptData?: string; // base64 string
  receiptFileName?: string;
  isUpcomingBill: boolean;
  isUpcomingBillPaid?: boolean;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface Bill {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  category: string;
  isPaid: boolean;
  recurringInterval: 'monthly' | 'yearly' | 'once';
}

export interface AIInsights {
  healthScore: number; // 0 - 100
  healthScoreLabel: string; // e.g. "Excellent", "Needs Improvement"
  insights: string[];
  anomalies: {
    id?: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }[];
  spendingBehavior: string[];
  predictions: {
    nextMonthExpense: number;
    nextMonthIncome: number;
    predictedSavings: number;
    confidence: number; // 0 - 100
    recommendations: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
