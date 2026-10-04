import { format, formatDistanceToNow, parseISO, startOfDay, startOfWeek, startOfMonth, endOfMonth, endOfWeek, isToday, isThisWeek, isThisMonth, subMonths } from "date-fns";
import type { Transaction, TransactionType } from "./types";

// ─── Currency Formatting ──────────────────────────────────────

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

// ─── Date Formatting ──────────────────────────────────────────

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    return format(date, "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

export function formatDateFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMMM yyyy");
  } catch {
    return dateStr;
  }
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function thisMonthStart(): string {
  return format(startOfMonth(new Date()), "yyyy-MM-dd");
}

export function thisMonthEnd(): string {
  return format(endOfMonth(new Date()), "yyyy-MM-dd");
}

export function lastNMonths(n: number): { start: string; end: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      start: format(startOfMonth(date), "yyyy-MM-dd"),
      end: format(endOfMonth(date), "yyyy-MM-dd"),
      label: format(date, "MMM yy"),
    };
  }).reverse();
}

export function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};
  for (const txn of transactions) {
    if (!groups[txn.date]) groups[txn.date] = [];
    groups[txn.date].push(txn);
  }
  return groups;
}

// ─── Type Helpers ─────────────────────────────────────────────

export function getTypeColor(type: TransactionType): string {
  return type === "income"
    ? "var(--income)"
    : type === "investment"
    ? "var(--investment)"
    : "var(--expense)";
}

export function getTypeBg(type: TransactionType): string {
  return type === "income"
    ? "var(--income-bg)"
    : type === "investment"
    ? "var(--investment-bg)"
    : "var(--expense-bg)";
}

export function getTypeSign(type: TransactionType): string {
  return type === "income" ? "+" : "-";
}

export function getTypeLabel(type: TransactionType): string {
  return type === "income" ? "Income" : type === "investment" ? "Investment" : "Expense";
}

// ─── Stats Helpers ────────────────────────────────────────────

export function sumByType(transactions: Transaction[], type: TransactionType): number {
  return transactions.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);
}

export function filterByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
}

// ─── Percentage ───────────────────────────────────────────────

export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── String Helpers ───────────────────────────────────────────

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Validation ───────────────────────────────────────────────

export function isValidAmount(str: string): boolean {
  const num = parseFloat(str);
  return !isNaN(num) && num > 0;
}

export function parseAmount(str: string): number {
  return parseFloat(str.replace(/,/g, "")) || 0;
}
