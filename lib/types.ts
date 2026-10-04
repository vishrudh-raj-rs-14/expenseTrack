// ─── Core Types ──────────────────────────────────────────────

export type TransactionType = "expense" | "income" | "investment";
export type PaymentMethod = "UPI" | "Cash" | "Card" | "NetBanking" | "Wallet";
export type LendType = "lent" | "borrowed";
export type LendStatus = "pending" | "partially_settled" | "settled";

export interface Transaction {
  id: string;
  date: string; // ISO date: YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string;
  subcategory: string;
  description: string;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO timestamp
}

export interface Lend {
  id: string;
  date: string;
  person: string;
  amount: number;
  type: LendType;
  reason: string;
  status: LendStatus;
  settledAmount: number;
  settledDate: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parent: string; // empty string if top-level
  icon: string; // lucide icon name
  color: string; // hex color
  type: TransactionType;
  isActive: boolean;
}

export interface Config {
  key: string;
  value: string;
}

// ─── Stats Types ─────────────────────────────────────────────

export interface DashboardStats {
  todaySpend: number;
  monthSpend: number;
  monthIncome: number;
  monthInvestment: number;
  monthBudget: number;
  recentTransactions: Transaction[];
  topCategories: { category: string; amount: number; color: string }[];
}

export interface MonthlyTrend {
  month: string; // "Jan", "Feb" etc.
  year: number;
  expense: number;
  income: number;
  investment: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  subcategory?: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  children?: CategoryBreakdown[];
}

export interface DailySpend {
  date: string;
  amount: number;
  count: number;
}

export interface AnalyticsData {
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  dailySpend: DailySpend[];
  topSubcategories: CategoryBreakdown[];
  incomeVsExpense: {
    income: number;
    expense: number;
    investment: number;
    savings: number;
  };
}

export interface PeriodReport {
  period: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  netSavings: number;
  categoryBreakdown: CategoryBreakdown[];
  previousPeriod?: {
    totalIncome: number;
    totalExpense: number;
    totalInvestment: number;
    netSavings: number;
  };
}

// ─── Filter Types ─────────────────────────────────────────────

export interface TransactionFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  type?: TransactionType | "";
  paymentMethod?: PaymentMethod | "";
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ─── API Response Types ───────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Form Types ───────────────────────────────────────────────

export interface TransactionFormData {
  amount: string;
  type: TransactionType;
  category: string;
  subcategory: string;
  description: string;
  paymentMethod: PaymentMethod;
  date: string;
}

export interface LendFormData {
  person: string;
  amount: string;
  type: LendType;
  reason: string;
  date: string;
}

export interface SettleFormData {
  settleAmount: string;
  settleDate: string;
}
