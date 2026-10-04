import React from "react";
import { clsx } from "@/lib/utils";

type BadgeVariant = "default" | "income" | "expense" | "investment" | "pending" | "settled" | "partial";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: "var(--surface-2)", color: "var(--text-2)" },
  income: { bg: "var(--income-bg)", color: "var(--income)" },
  expense: { bg: "var(--expense-bg)", color: "var(--expense)" },
  investment: { bg: "var(--investment-bg)", color: "var(--investment)" },
  pending: { bg: "#FEF3C7", color: "#92400E" },
  settled: { bg: "var(--income-bg)", color: "var(--income)" },
  partial: { bg: "#DBEAFE", color: "#1E40AF" },
};

export function Badge({ variant = "default", children, className, size = "md" }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}
