"use client";

import { create } from "zustand";
import type { Transaction, TransactionFilters, DashboardStats } from "@/lib/types";

interface TransactionState {
  transactions: Transaction[];
  dashboardStats: DashboardStats | null;
  filters: TransactionFilters;
  isLoading: boolean;
  isAddingOpen: boolean;
  editingTransaction: Transaction | null;

  // Actions
  setTransactions: (txns: Transaction[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  setIsLoading: (v: boolean) => void;
  setAddingOpen: (v: boolean) => void;
  setEditingTransaction: (txn: Transaction | null) => void;

  // API calls
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  addTransaction: (data: Partial<Transaction>) => Promise<Transaction | null>;
  updateTransaction: (txn: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  fetchDashboardStats: () => Promise<void>;
}

const buildQueryString = (filters: TransactionFilters): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.subcategory) params.set("subcategory", filters.subcategory);
  if (filters.type) params.set("type", filters.type);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.minAmount) params.set("minAmount", String(filters.minAmount));
  if (filters.maxAmount) params.set("maxAmount", String(filters.maxAmount));
  return params.toString();
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  dashboardStats: null,
  filters: {},
  isLoading: false,
  isAddingOpen: false,
  editingTransaction: null,

  setTransactions: (txns) => set({ transactions: txns }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  clearFilters: () => set({ filters: {} }),
  setIsLoading: (v) => set({ isLoading: v }),
  setAddingOpen: (v) => set({ isAddingOpen: v }),
  setEditingTransaction: (txn) => set({ editingTransaction: txn, isAddingOpen: !!txn }),

  fetchTransactions: async (filters) => {
    set({ isLoading: true });
    try {
      const qs = buildQueryString(filters || get().filters);
      const res = await fetch(`/api/transactions${qs ? `?${qs}` : ""}`);
      const json = await res.json();
      if (json.data) set({ transactions: json.data });
    } catch (e) {
      console.error("fetchTransactions error:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.data) {
        set((state) => ({
          transactions: [json.data, ...state.transactions],
        }));
        // Refresh stats
        get().fetchDashboardStats();
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("addTransaction error:", e);
      return null;
    }
  },

  updateTransaction: async (txn) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txn),
      });
      const json = await res.json();
      if (json.data) {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === txn.id ? json.data : t)),
        }));
        get().fetchDashboardStats();
        return true;
      }
      return false;
    } catch (e) {
      console.error("updateTransaction error:", e);
      return false;
    }
  },

  deleteTransaction: async (id) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        get().fetchDashboardStats();
        return true;
      }
      return false;
    } catch (e) {
      console.error("deleteTransaction error:", e);
      return false;
    }
  },

  fetchDashboardStats: async () => {
    try {
      const res = await fetch("/api/stats?type=dashboard");
      const json = await res.json();
      if (json.data) set({ dashboardStats: json.data });
    } catch (e) {
      console.error("fetchDashboardStats error:", e);
    }
  },
}));
