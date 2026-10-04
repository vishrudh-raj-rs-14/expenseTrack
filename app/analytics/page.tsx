"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { CountUp } from "@/components/ui/AnimatedNumber";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import type { AnalyticsData, CategoryBreakdown } from "@/lib/types";

type Period = "month" | "week";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryBreakdown | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let start: string, end: string;
      const now = new Date();
      if (period === "month") {
        start = format(startOfMonth(now), "yyyy-MM-dd");
        end = format(endOfMonth(now), "yyyy-MM-dd");
      } else {
        start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      }
      const res = await fetch(`/api/stats?type=analytics&start=${start}&end=${end}`);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpense = data?.incomeVsExpense.expense || 0;
  const totalIncome = data?.incomeVsExpense.income || 0;
  const totalInvestment = data?.incomeVsExpense.investment || 0;
  const totalSavings = totalIncome - totalExpense - totalInvestment;

  return (
    <div style={{ background: "var(--bg)" }}>
      <Header title="Analytics" />

      {/* Period Toggle */}
      <FadeIn className="px-4 pt-3 pb-2">
        <div
          className="flex h-10 rounded-[12px] p-1"
          style={{ background: "var(--surface-2)" }}
        >
          {(["month", "week"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 rounded-[9px] text-sm font-medium transition-all"
              style={{
                background: period === p ? "var(--surface)" : "transparent",
                color: period === p ? "var(--text-1)" : "var(--text-3)",
                boxShadow: period === p ? "var(--shadow-sm)" : "none",
              }}
            >
              {p === "month" ? "This Month" : "This Week"}
            </button>
          ))}
        </div>
      </FadeIn>

      <div className="px-4 pb-6 space-y-4">
        {isLoading ? (
          <AnalyticsSkeleton />
        ) : !data ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>No data yet</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <FadeIn delay={0.05}>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label="Spent" value={totalExpense} color="var(--expense)" />
                <SummaryCard label="Income" value={totalIncome} color="var(--income)" />
                <SummaryCard label="Invested" value={totalInvestment} color="var(--investment)" />
                <SummaryCard
                  label="Saved"
                  value={totalSavings}
                  color={totalSavings >= 0 ? "var(--income)" : "var(--expense)"}
                />
              </div>
            </FadeIn>

            {/* Donut Chart + Breakdown */}
            {data.categoryBreakdown.length > 0 && (
              <FadeIn delay={0.1}>
                <div
                  className="p-4 rounded-[20px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {selectedCategory ? `${selectedCategory.category} breakdown` : "Spending by Category"}
                    </h3>
                    {selectedCategory && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs" style={{ color: "var(--accent)" }}
                      >
                        ← Back
                      </button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCategory?.category || "root"}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DonutChart
                        data={selectedCategory
                          ? (selectedCategory.children || []).map(c => ({ name: c.category, value: c.amount, color: c.color }))
                          : data.categoryBreakdown.map(c => ({ name: c.category, value: c.amount, color: c.color }))
                        }
                        total={totalExpense}
                        onSliceClick={(name) => {
                          if (!selectedCategory) {
                            const cat = data.categoryBreakdown.find(c => c.category === name);
                            if (cat?.children && cat.children.length > 0) {
                              setSelectedCategory(cat);
                            }
                          }
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Category list */}
                  <div className="space-y-2.5 mt-3">
                    {(selectedCategory
                      ? (selectedCategory.children || []).map(c => ({ category: c.category, amount: c.amount, percentage: c.percentage, color: c.color, icon: c.icon }))
                      : data.categoryBreakdown.slice(0, 6)
                    ).map((cat) => (
                      <CategoryBarRow
                        key={cat.category}
                        name={cat.category}
                        amount={cat.amount}
                        percentage={cat.percentage}
                        color={cat.color}
                        icon={cat.icon}
                        onClick={() => {
                          if (!selectedCategory) {
                            const full = data.categoryBreakdown.find(c => c.category === cat.category);
                            if (full?.children && full.children.length > 0) setSelectedCategory(full);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Income vs Expense Pie */}
            <FadeIn delay={0.15}>
              <div
                className="p-4 rounded-[20px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>
                  Income Allocation
                </h3>
                <DonutChart
                  data={[
                    { name: "Expenses", value: totalExpense, color: "var(--expense)" },
                    { name: "Invested", value: totalInvestment, color: "var(--investment)" },
                    { name: "Saved", value: Math.max(totalSavings, 0), color: "var(--income)" },
                  ].filter(d => d.value > 0)}
                  total={totalIncome}
                  centerLabel="Income"
                />
              </div>
            </FadeIn>

            {/* 6-Month Trend */}
            {data.monthlyTrend.length > 0 && (
              <FadeIn delay={0.2}>
                <div
                  className="p-4 rounded-[20px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-1)" }}>
                    6-Month Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-3)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-3)" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="expense" stroke="var(--expense)" strokeWidth={2} dot={false} name="Expense" />
                      <Line type="monotone" dataKey="income" stroke="var(--income)" strokeWidth={2} dot={false} name="Income" />
                      <Line type="monotone" dataKey="investment" stroke="var(--investment)" strokeWidth={2} dot={false} name="Investment" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <LegendDot color="var(--expense)" label="Expense" />
                    <LegendDot color="var(--income)" label="Income" />
                    <LegendDot color="var(--investment)" label="Investment" />
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Top Subcategories */}
            {data.topSubcategories.length > 0 && (
              <FadeIn delay={0.25}>
                <div
                  className="p-4 rounded-[20px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>
                    Top Spending Areas
                  </h3>
                  <div className="space-y-3">
                    {data.topSubcategories.slice(0, 8).map((sub, i) => (
                      <div key={sub.category} className="flex items-center gap-3">
                        <span
                          className="text-xs font-bold w-5 text-center"
                          style={{ color: "var(--text-3)" }}
                        >
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: sub.color + "22" }}
                        >
                          <CategoryIcon name={sub.icon} size={16} color={sub.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: "var(--text-1)" }}>{sub.category}</p>
                          <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--surface-2)" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${sub.percentage}%` }}
                              transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ background: sub.color }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold currency" style={{ color: "var(--text-2)" }}>
                          ₹{sub.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Daily Spend Heatmap */}
            {data.dailySpend.length > 0 && (
              <FadeIn delay={0.3}>
                <div
                  className="p-4 rounded-[20px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>
                    Daily Spend Heatmap
                  </h3>
                  <DailyHeatmap data={data.dailySpend} />
                </div>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DonutChart({
  data,
  total,
  centerLabel,
  onSliceClick,
}: {
  data: { name: string; value: number; color: string }[];
  total: number;
  centerLabel?: string;
  onSliceClick?: (name: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          onClick={(entry: { name?: string }) => onSliceClick?.(entry.name ?? "")}
          style={{ cursor: onSliceClick ? "pointer" : "default" }}
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "var(--text-1)",
          }}
        />
        {/* Center label rendered via absolute positioning is tricky with SVG, skip for now */}
      </PieChart>
    </ResponsiveContainer>
  );
}

function CategoryBarRow({
  name, amount, percentage, color, icon, onClick,
}: {
  name: string; amount: number; percentage: number; color: string; icon: string; onClick?: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2.5"
      onClick={onClick}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "22" }}
      >
        <CategoryIcon name={icon} size={16} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>{name}</span>
          <span className="text-xs font-semibold currency ml-2" style={{ color: "var(--text-2)" }}>
            ₹{amount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
      <span className="text-xs" style={{ color: "var(--text-3)" }}>{percentage}%</span>
    </button>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="p-3.5 rounded-[16px]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-base font-bold currency" style={{ color }}>
        ₹<CountUp value={Math.abs(value)} formatter={(n) => n.toLocaleString("en-IN")} />
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-2.5 rounded-[10px] text-xs"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ₹{p.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

function DailyHeatmap({ data }: { data: { date: string; amount: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.amount));

  return (
    <div className="flex flex-wrap gap-1">
      {data.map((day) => {
        const intensity = max > 0 ? day.amount / max : 0;
        const dayNum = parseInt(day.date.split("-")[2]);
        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: dayNum * 0.015 }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{
              background: intensity > 0
                ? `rgba(212, 98, 45, ${0.1 + intensity * 0.9})`
                : "var(--surface-2)",
            }}
            title={`${day.date}: ₹${day.amount.toLocaleString("en-IN")}`}
          >
            <span className="text-[10px] font-medium" style={{ color: intensity > 0.5 ? "white" : "var(--text-3)" }}>
              {dayNum}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      {[200, 250, 180, 200].map((h, i) => (
        <div key={i} className="rounded-[20px] animate-pulse" style={{ height: h, background: "var(--surface-2)" }} />
      ))}
    </div>
  );
}
