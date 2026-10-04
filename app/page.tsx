"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Settings, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { CountUp } from "@/components/ui/AnimatedNumber";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/layout/PageTransition";
import { formatCurrency, formatDate, thisMonthStart, thisMonthEnd, todayISO } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const {
    dashboardStats,
    fetchDashboardStats,
    isAddingOpen,
    setAddingOpen,
    editingTransaction,
    setEditingTransaction,
  } = useTransactionStore();
  const { getParents } = useCategoryStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const stats = dashboardStats;
  const monthBudget = stats?.monthBudget || 0;
  const monthSpend = stats?.monthSpend || 0;
  const budgetPct = monthBudget > 0 ? Math.min((monthSpend / monthBudget) * 100, 100) : 0;
  const topExpenseCategories = getParents("expense").slice(0, 6);

  const currentMonth = format(new Date(), "MMMM yyyy");
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <FadeIn className="px-5 pt-6 pb-3 flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {format(new Date(), "EEEE, d MMM")}
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: "var(--text-1)" }}>
            Hey, {firstName} 👋
          </h1>
        </div>
        <Link href="/settings">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
          >
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                {firstName[0]}
              </span>
            )}
          </motion.div>
        </Link>
      </FadeIn>

      <div className="px-4 pb-6 space-y-4">
        {/* Today's Spend Card */}
        <FadeIn delay={0.05}>
          <div
            className="rounded-[20px] p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
            }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
              style={{ background: "white" }}
            />
            <div
              className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10"
              style={{ background: "white" }}
            />

            <p className="text-sm font-medium opacity-80 text-white">Today's Spend</p>
            <div className="flex items-end justify-between mt-1">
              <div className="text-4xl font-bold text-white currency">
                ₹
                <CountUp
                  value={stats?.todaySpend || 0}
                  formatter={(n) => n.toLocaleString("en-IN")}
                />
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 text-white">{currentMonth}</p>
                <p className="text-lg font-semibold text-white currency">
                  ₹
                  <CountUp
                    value={stats?.monthSpend || 0}
                    formatter={(n) => n.toLocaleString("en-IN")}
                  />
                </p>
              </div>
            </div>

            {/* Budget progress */}
            {monthBudget > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white opacity-70 mb-1.5">
                  <span>Budget</span>
                  <span>{Math.round(budgetPct)}% used</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetPct}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: budgetPct > 90 ? "#FCA5A5" : "white",
                    }}
                  />
                </div>
                <p className="text-xs text-white opacity-70 mt-1">
                  ₹{(monthBudget - monthSpend).toLocaleString("en-IN")} remaining
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Stats Row */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="This Month Income"
              value={stats?.monthIncome || 0}
              icon={<TrendingUp size={18} />}
              color="var(--income)"
              bg="var(--income-bg)"
            />
            <StatCard
              label="Invested"
              value={stats?.monthInvestment || 0}
              icon={<Wallet size={18} />}
              color="var(--investment)"
              bg="var(--investment-bg)"
            />
          </div>
        </FadeIn>

        {/* Quick Add Button */}
        <FadeIn delay={0.15}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setAddingOpen(true)}
            className="w-full h-14 rounded-[16px] flex items-center justify-center gap-3 font-semibold text-white"
            style={{
              background: "var(--accent)",
              boxShadow: "0 4px 16px rgba(212,98,45,0.35)",
            }}
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Plus size={18} />
            </div>
            Add Transaction
          </motion.button>
        </FadeIn>

        {/* Quick Categories */}
        <FadeIn delay={0.2}>
          <div>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Quick Add
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {topExpenseCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    useTransactionStore.setState({
                      isAddingOpen: true,
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 p-3 rounded-[14px] w-[72px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: cat.color + "22" }}
                  >
                    <CategoryIcon name={cat.icon} size={18} color={cat.color} />
                  </div>
                  <span
                    className="text-[10px] font-medium text-center leading-tight line-clamp-2"
                    style={{ color: "var(--text-2)" }}
                  >
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Top Spending Categories */}
        {stats?.topCategories && stats.topCategories.length > 0 && (
          <FadeIn delay={0.25}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                  Top Categories
                </p>
                <Link href="/analytics">
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    See all
                  </span>
                </Link>
              </div>
              <div className="space-y-2">
                {stats.topCategories.slice(0, 4).map((cat, i) => (
                  <CategoryBar key={i} name={cat.category} amount={cat.amount} color={cat.color} max={stats.monthSpend} />
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Recent Transactions */}
        <FadeIn delay={0.3}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Recent
              </p>
              <Link href="/transactions">
                <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                  See all
                </span>
              </Link>
            </div>
            <div
              className="rounded-[16px] overflow-hidden divide-y"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 6).map((txn) => (
                  <TransactionRow
                    key={txn.id}
                    transaction={txn}
                    onEdit={(t) => setEditingTransaction(t)}
                    showDate
                  />
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">💸</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>No transactions yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Tap "Add Transaction" to get started</p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Add Transaction Form */}
      <TransactionForm
        isOpen={isAddingOpen}
        onClose={() => { setAddingOpen(false); setEditingTransaction(null); }}
        editTransaction={editingTransaction}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="p-4 rounded-[16px]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs" style={{ color: "var(--text-3)" }}>{label}</p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold currency" style={{ color }}>
        ₹<CountUp value={value} formatter={(n) => n.toLocaleString("en-IN")} />
      </p>
    </div>
  );
}

function CategoryBar({ name, amount, color, max }: { name: string; amount: number; color: string; max: number }) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>{name}</span>
          <span className="text-xs font-semibold currency" style={{ color: "var(--text-2)" }}>
            ₹{amount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    </div>
  );
}
