"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Plus, X, ChevronDown } from "lucide-react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Input";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { groupTransactionsByDate, formatDate, sumByType, thisMonthStart, thisMonthEnd } from "@/lib/utils";
import type { TransactionType, PaymentMethod } from "@/lib/types";

const TYPE_OPTIONS: { label: string; value: TransactionType | "" }[] = [
  { label: "All", value: "" },
  { label: "Expenses", value: "expense" },
  { label: "Income", value: "income" },
  { label: "Investments", value: "investment" },
];

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Cash", "Card", "NetBanking", "Wallet"];

export default function TransactionsPage() {
  const {
    transactions,
    fetchTransactions,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    isAddingOpen,
    setAddingOpen,
    editingTransaction,
    setEditingTransaction,
  } = useTransactionStore();
  const { categories, getParents } = useCategoryStore();

  const [search, setSearch] = useState(filters.search || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeType, setActiveType] = useState<TransactionType | "">(filters.type || "");

  const parentCategories = getParents();

  // Fetch on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: search || undefined });
      fetchTransactions({ ...filters, search: search || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Type filter
  const handleTypeChange = (t: TransactionType | "") => {
    setActiveType(t);
    const newFilters = { ...filters, type: t || undefined };
    setFilters(newFilters);
    fetchTransactions(newFilters);
  };

  // Group by date
  const grouped = useMemo(() => {
    return groupTransactionsByDate(transactions);
  }, [transactions]);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Summary for current view
  const income = useMemo(() => sumByType(transactions, "income"), [transactions]);
  const expense = useMemo(() => sumByType(transactions, "expense"), [transactions]);
  const investment = useMemo(() => sumByType(transactions, "investment"), [transactions]);

  const hasFilters = !!(filters.category || filters.type || filters.paymentMethod || filters.startDate || filters.endDate);

  return (
    <div style={{ background: "var(--bg)" }}>
      <Header
        title="Transactions"
        rightElement={
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setAddingOpen(true)}
          >
            Add
          </Button>
        }
      />

      {/* Search + Filter */}
      <FadeIn className="px-4 pt-3 pb-2 space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full h-10 rounded-[12px] pl-9 pr-10 text-sm outline-none border"
            style={{
              background: "var(--surface)",
              color: "var(--text-1)",
              borderColor: "var(--border)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-3)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className="h-8 px-3.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors"
              style={{
                background: activeType === opt.value ? "var(--accent)" : "var(--surface)",
                color: activeType === opt.value ? "white" : "var(--text-2)",
                border: `1px solid ${activeType === opt.value ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setFiltersOpen(true)}
            className="h-8 px-3.5 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1.5"
            style={{
              background: hasFilters ? "var(--accent-bg)" : "var(--surface)",
              color: hasFilters ? "var(--accent)" : "var(--text-2)",
              border: `1px solid ${hasFilters ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasFilters && (
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                !
              </span>
            )}
          </button>
        </div>

        {/* Summary row */}
        <div
          className="flex gap-3 p-3 rounded-[12px]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <SummaryChip label="Expense" value={expense} color="var(--expense)" />
          <div className="w-px" style={{ background: "var(--border)" }} />
          <SummaryChip label="Income" value={income} color="var(--income)" />
          <div className="w-px" style={{ background: "var(--border)" }} />
          <SummaryChip label="Invested" value={investment} color="var(--investment)" />
        </div>
      </FadeIn>

      {/* Transactions List */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : sortedDates.length === 0 ? (
          <EmptyState />
        ) : (
          <StaggerContainer>
            {sortedDates.map((date) => (
              <StaggerItem key={date}>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>
                      {formatDate(date)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span className="text-xs currency" style={{ color: "var(--text-3)" }}>
                      -{grouped[date].filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div
                    className="rounded-[16px] overflow-hidden divide-y"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {grouped[date].map((txn) => (
                      <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        onEdit={(t) => setEditingTransaction(t)}
                      />
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Filters Bottom Sheet */}
      <FiltersSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={parentCategories.map((c) => c.name)}
        currentFilters={filters}
        onApply={(f) => {
          setFilters(f);
          fetchTransactions(f);
          setFiltersOpen(false);
        }}
        onClear={() => {
          clearFilters();
          setActiveType("");
          fetchTransactions({});
          setFiltersOpen(false);
        }}
      />

      {/* Add/Edit Transaction */}
      <TransactionForm
        isOpen={isAddingOpen}
        onClose={() => { setAddingOpen(false); setEditingTransaction(null); }}
        editTransaction={editingTransaction}
      />
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-xs font-semibold currency" style={{ color }}>
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function FiltersSheet({
  isOpen,
  onClose,
  categories,
  currentFilters,
  onApply,
  onClear,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  currentFilters: any;
  onApply: (f: any) => void;
  onClear: () => void;
}) {
  const [category, setCategory] = useState(currentFilters.category || "");
  const [paymentMethod, setPaymentMethod] = useState(currentFilters.paymentMethod || "");
  const [startDate, setStartDate] = useState(currentFilters.startDate || "");
  const [endDate, setEndDate] = useState(currentFilters.endDate || "");

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter Transactions">
      <div className="p-5 space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Category</label>
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" selected={!category} onClick={() => setCategory("")} />
            {categories.map((c) => (
              <FilterChip key={c} label={c} selected={category === c} onClick={() => setCategory(c === category ? "" : c)} />
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Payment Method</label>
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" selected={!paymentMethod} onClick={() => setPaymentMethod("")} />
            {PAYMENT_METHODS.map((pm) => (
              <FilterChip key={pm} label={pm} selected={paymentMethod === pm} onClick={() => setPaymentMethod(pm === paymentMethod ? "" : pm)} />
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" fullWidth onClick={onClear}>Clear All</Button>
          <Button fullWidth onClick={() => onApply({ category: category || undefined, paymentMethod: paymentMethod || undefined, startDate: startDate || undefined, endDate: endDate || undefined })}>
            Apply
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-3 rounded-full text-xs font-medium transition-colors"
      style={{
        background: selected ? "var(--accent)" : "var(--surface-2)",
        color: selected ? "white" : "var(--text-2)",
      }}
    >
      {label}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-[14px] animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-base font-medium" style={{ color: "var(--text-2)" }}>No transactions found</p>
      <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Try adjusting your filters</p>
    </div>
  );
}
