import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTransactions, getCategories, getConfig, initializeSheets } from "@/lib/sheets";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import type { Transaction, CategoryBreakdown, MonthlyTrend, DailySpend } from "@/lib/types";
import { todayISO, thisMonthStart, thisMonthEnd } from "@/lib/utils";

function sumByType(txns: Transaction[], type: string) {
  return txns.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

function filterByRange(txns: Transaction[], start: string, end: string) {
  return txns.filter((t) => t.date >= start && t.date <= end);
}

function buildCategoryBreakdown(
  txns: Transaction[],
  categories: { name: string; parent: string; color: string; icon: string }[]
): CategoryBreakdown[] {
  const expenses = txns.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  const parentMap: Record<string, { amount: number; count: number; children: Record<string, { amount: number; count: number }> }> = {};

  for (const txn of expenses) {
    const parent = txn.category;
    const sub = txn.subcategory;
    if (!parentMap[parent]) parentMap[parent] = { amount: 0, count: 0, children: {} };
    parentMap[parent].amount += txn.amount;
    parentMap[parent].count += 1;
    if (sub) {
      if (!parentMap[parent].children[sub]) parentMap[parent].children[sub] = { amount: 0, count: 0 };
      parentMap[parent].children[sub].amount += txn.amount;
      parentMap[parent].children[sub].count += 1;
    }
  }

  return Object.entries(parentMap)
    .map(([name, data]) => {
      const catMeta = categories.find((c) => c.name === name);
      const children = Object.entries(data.children).map(([subName, subData]) => {
        const subMeta = categories.find((c) => c.name === subName);
        return {
          category: subName,
          amount: subData.amount,
          count: subData.count,
          percentage: totalExpense > 0 ? Math.round((subData.amount / totalExpense) * 100) : 0,
          color: subMeta?.color ?? "#9CA3AF",
          icon: subMeta?.icon ?? "MoreHorizontal",
        };
      }).sort((a, b) => b.amount - a.amount);

      return {
        category: name,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
        color: catMeta?.color ?? "#9CA3AF",
        icon: catMeta?.icon ?? "MoreHorizontal",
        children,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

// GET /api/stats
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const [allTxns, categories, config] = await Promise.all([
      getTransactions(),
      getCategories(),
      getConfig(),
    ]);

    const type = req.nextUrl.searchParams.get("type") || "dashboard";
    const startParam = req.nextUrl.searchParams.get("start");
    const endParam = req.nextUrl.searchParams.get("end");

    const today = todayISO();
    const monthStart = startParam || thisMonthStart();
    const monthEnd = endParam || thisMonthEnd();

    if (type === "dashboard") {
      const todayTxns = filterByRange(allTxns, today, today);
      const monthTxns = filterByRange(allTxns, monthStart, monthEnd);
      const catMeta = categories.map((c) => ({ name: c.name, parent: c.parent, color: c.color, icon: c.icon }));

      return NextResponse.json({
        data: {
          todaySpend: sumByType(todayTxns, "expense"),
          monthSpend: sumByType(monthTxns, "expense"),
          monthIncome: sumByType(monthTxns, "income"),
          monthInvestment: sumByType(monthTxns, "investment"),
          monthBudget: parseFloat(config.monthlyBudget || "0"),
          recentTransactions: allTxns.slice(0, 10),
          topCategories: buildCategoryBreakdown(monthTxns, catMeta).slice(0, 6),
        },
      });
    }

    if (type === "analytics") {
      const monthTxns = filterByRange(allTxns, monthStart, monthEnd);
      const catMeta = categories.map((c) => ({ name: c.name, parent: c.parent, color: c.color, icon: c.icon }));

      // Monthly trend — last 6 months
      const monthlyTrend: MonthlyTrend[] = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        const start = format(startOfMonth(date), "yyyy-MM-dd");
        const end = format(endOfMonth(date), "yyyy-MM-dd");
        const txns = filterByRange(allTxns, start, end);
        const income = sumByType(txns, "income");
        const expense = sumByType(txns, "expense");
        const investment = sumByType(txns, "investment");
        return {
          month: format(date, "MMM"),
          year: date.getFullYear(),
          expense,
          income,
          investment,
          savings: income - expense - investment,
        };
      });

      // Daily spend for current month
      const dailySpend: DailySpend[] = [];
      const dailyMap: Record<string, { amount: number; count: number }> = {};
      for (const txn of monthTxns.filter((t) => t.type === "expense")) {
        if (!dailyMap[txn.date]) dailyMap[txn.date] = { amount: 0, count: 0 };
        dailyMap[txn.date].amount += txn.amount;
        dailyMap[txn.date].count += 1;
      }
      for (const [date, data] of Object.entries(dailyMap)) {
        dailySpend.push({ date, ...data });
      }

      const categoryBreakdown = buildCategoryBreakdown(monthTxns, catMeta);
      const allSubcategories = categoryBreakdown.flatMap((c) => c.children ?? []);

      return NextResponse.json({
        data: {
          categoryBreakdown,
          monthlyTrend,
          dailySpend: dailySpend.sort((a, b) => a.date.localeCompare(b.date)),
          topSubcategories: allSubcategories.sort((a, b) => b.amount - a.amount).slice(0, 10),
          incomeVsExpense: {
            income: sumByType(monthTxns, "income"),
            expense: sumByType(monthTxns, "expense"),
            investment: sumByType(monthTxns, "investment"),
            savings: sumByType(monthTxns, "income") - sumByType(monthTxns, "expense") - sumByType(monthTxns, "investment"),
          },
        },
      });
    }

    if (type === "report") {
      const period = req.nextUrl.searchParams.get("period") || "monthly";
      const txns = filterByRange(allTxns, monthStart, monthEnd);
      const catMeta = categories.map((c) => ({ name: c.name, parent: c.parent, color: c.color, icon: c.icon }));

      // Previous period
      let prevStart: string, prevEnd: string;
      if (period === "weekly") {
        const s = parseISO(monthStart);
        prevStart = format(new Date(s.getTime() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
        prevEnd = format(new Date(parseISO(monthEnd).getTime() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      } else {
        prevStart = format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
        prevEnd = format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
      }
      const prevTxns = filterByRange(allTxns, prevStart, prevEnd);

      return NextResponse.json({
        data: {
          period: monthStart + " to " + monthEnd,
          startDate: monthStart,
          endDate: monthEnd,
          totalIncome: sumByType(txns, "income"),
          totalExpense: sumByType(txns, "expense"),
          totalInvestment: sumByType(txns, "investment"),
          netSavings: sumByType(txns, "income") - sumByType(txns, "expense") - sumByType(txns, "investment"),
          categoryBreakdown: buildCategoryBreakdown(txns, catMeta),
          previousPeriod: {
            totalIncome: sumByType(prevTxns, "income"),
            totalExpense: sumByType(prevTxns, "expense"),
            totalInvestment: sumByType(prevTxns, "investment"),
            netSavings: sumByType(prevTxns, "income") - sumByType(prevTxns, "expense") - sumByType(prevTxns, "investment"),
          },
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
