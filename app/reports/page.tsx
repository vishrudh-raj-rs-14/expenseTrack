"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { CountUp } from "@/components/ui/AnimatedNumber";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from "date-fns";
import type { PeriodReport } from "@/lib/types";

type Period = "monthly" | "weekly";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [monthOffset, setMonthOffset] = useState(0);
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetUrl, setSheetUrl] = useState("");

  // Load sheet URL from config
  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((j) => {
      setSheetUrl(j.data?.sheetUrl || "");
    });
  }, []);

  useEffect(() => {
    loadReport();
  }, [period, monthOffset]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let start: string, end: string;

      if (period === "monthly") {
        const date = subMonths(now, monthOffset);
        start = format(startOfMonth(date), "yyyy-MM-dd");
        end = format(endOfMonth(date), "yyyy-MM-dd");
      } else {
        const date = subWeeks(now, monthOffset);
        start = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      }

      const res = await fetch(`/api/stats?type=report&period=${period}&start=${start}&end=${end}`);
      const json = await res.json();
      if (json.data) setReport(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabel = () => {
    const now = new Date();
    if (period === "monthly") {
      if (monthOffset === 0) return "This Month";
      if (monthOffset === 1) return "Last Month";
      return format(subMonths(now, monthOffset), "MMMM yyyy");
    } else {
      if (monthOffset === 0) return "This Week";
      if (monthOffset === 1) return "Last Week";
      return `${monthOffset} weeks ago`;
    }
  };

  return (
    <div style={{ background: "var(--bg)" }}>
      <Header title="Reports" />

      {/* Controls */}
      <FadeIn className="px-4 pt-3 pb-2 space-y-3">
        {/* Period type */}
        <div
          className="flex h-10 rounded-[12px] p-1"
          style={{ background: "var(--surface-2)" }}
        >
          {(["monthly", "weekly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setMonthOffset(0); }}
              className="flex-1 rounded-[9px] text-sm font-medium transition-all capitalize"
              style={{
                background: period === p ? "var(--surface)" : "transparent",
                color: period === p ? "var(--text-1)" : "var(--text-3)",
                boxShadow: period === p ? "var(--shadow-sm)" : "none",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((p) => p + 1)}
            className="p-2 rounded-xl text-sm"
            style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            ← Prev
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {periodLabel()}
          </span>
          <button
            onClick={() => setMonthOffset((p) => Math.max(0, p - 1))}
            disabled={monthOffset === 0}
            className="p-2 rounded-xl text-sm disabled:opacity-30"
            style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            Next →
          </button>
        </div>
      </FadeIn>

      <div className="px-4 pb-6 space-y-4">
        {isLoading ? (
          <ReportSkeleton />
        ) : !report ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>No data</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <FadeIn delay={0.05}>
              <div className="grid grid-cols-2 gap-3">
                <ReportCard
                  label="Income"
                  value={report.totalIncome}
                  prev={report.previousPeriod?.totalIncome || 0}
                  color="var(--income)"
                />
                <ReportCard
                  label="Expenses"
                  value={report.totalExpense}
                  prev={report.previousPeriod?.totalExpense || 0}
                  color="var(--expense)"
                />
                <ReportCard
                  label="Invested"
                  value={report.totalInvestment}
                  prev={report.previousPeriod?.totalInvestment || 0}
                  color="var(--investment)"
                />
                <ReportCard
                  label="Saved"
                  value={report.netSavings}
                  prev={report.previousPeriod?.netSavings || 0}
                  color={report.netSavings >= 0 ? "var(--income)" : "var(--expense)"}
                />
              </div>
            </FadeIn>

            {/* Savings rate */}
            {report.totalIncome > 0 && (
              <FadeIn delay={0.1}>
                <div
                  className="p-4 rounded-[16px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Savings Rate</p>
                    <p className="text-lg font-bold" style={{ color: "var(--income)" }}>
                      {Math.round((report.netSavings / report.totalIncome) * 100)}%
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, (report.netSavings / report.totalIncome) * 100)}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: "var(--income)" }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--text-3)" }}>
                    <span>Income: ₹{report.totalIncome.toLocaleString("en-IN")}</span>
                    <span>Saved: ₹{report.netSavings.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Category Breakdown */}
            {report.categoryBreakdown.length > 0 && (
              <FadeIn delay={0.15}>
                <div
                  className="p-4 rounded-[20px]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-1)" }}>
                    Category Breakdown
                  </h3>
                  <div className="space-y-3">
                    {report.categoryBreakdown.map((cat, i) => (
                      <StaggerItem key={cat.category}>
                        <CategoryBreakdownRow
                          rank={i + 1}
                          name={cat.category}
                          amount={cat.amount}
                          count={cat.count}
                          percentage={cat.percentage}
                          color={cat.color}
                          icon={cat.icon}
                        />
                      </StaggerItem>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Google Sheets Link */}
            {sheetUrl && (
              <FadeIn delay={0.2}>
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-[16px] transition-opacity active:opacity-70"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "#22C55E22", color: "#22C55E" }}
                  >
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>View in Google Sheets</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>Export and analyse your raw data</p>
                  </div>
                  <ExternalLink size={16} style={{ color: "var(--text-3)" }} />
                </a>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  label, value, prev, color,
}: {
  label: string; value: number; prev: number; color: string;
}) {
  const change = prev > 0 ? Math.round(((value - prev) / prev) * 100) : 0;
  const isPositive = value >= prev;

  return (
    <div
      className="p-3.5 rounded-[16px]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs mb-1.5" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-base font-bold currency" style={{ color }}>
        ₹<CountUp value={Math.abs(value)} formatter={(n) => n.toLocaleString("en-IN")} />
      </p>
      {prev > 0 && (
        <div className="flex items-center gap-1 mt-1">
          {change === 0 ? (
            <Minus size={12} style={{ color: "var(--text-3)" }} />
          ) : isPositive ? (
            <ArrowUpRight size={12} style={{ color: "var(--income)" }} />
          ) : (
            <ArrowDownRight size={12} style={{ color: "var(--expense)" }} />
          )}
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            {Math.abs(change)}% vs prev
          </span>
        </div>
      )}
    </div>
  );
}

function CategoryBreakdownRow({
  rank, name, amount, count, percentage, color, icon,
}: {
  rank: number; name: string; amount: number; count: number; percentage: number; color: string; icon: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-bold w-5 text-center" style={{ color: "var(--text-3)" }}>
        {rank}
      </span>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "22" }}
      >
        <CategoryIcon name={icon} size={16} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>{name}</span>
          <span className="text-xs font-semibold currency ml-2" style={{ color: "var(--text-2)" }}>
            ₹{amount.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{count} txns</span>
        </div>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-[16px] animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
      <div className="h-40 rounded-[20px] animate-pulse" style={{ background: "var(--surface-2)" }} />
      <div className="h-60 rounded-[20px] animate-pulse" style={{ background: "var(--surface-2)" }} />
    </div>
  );
}
