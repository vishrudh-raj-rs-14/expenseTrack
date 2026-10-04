"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "text-white font-semibold",
  secondary: "font-medium",
  ghost: "font-medium",
  danger: "text-white font-medium",
  outline: "font-medium border",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-[10px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[12px] gap-2",
  lg: "h-12 px-5 text-base rounded-[14px] gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const inlineStyle: React.CSSProperties = {};
  if (variant === "primary") {
    inlineStyle.background = isDisabled ? "var(--border-strong)" : "var(--accent)";
    inlineStyle.color = isDisabled ? "var(--text-3)" : "white";
  } else if (variant === "secondary") {
    inlineStyle.background = "var(--surface-2)";
    inlineStyle.color = "var(--text-1)";
  } else if (variant === "ghost") {
    inlineStyle.background = "transparent";
    inlineStyle.color = "var(--text-2)";
  } else if (variant === "danger") {
    inlineStyle.background = isDisabled ? "var(--border-strong)" : "var(--expense)";
    inlineStyle.color = "white";
  } else if (variant === "outline") {
    inlineStyle.background = "transparent";
    inlineStyle.borderColor = "var(--border-strong)";
    inlineStyle.color = "var(--text-1)";
  }

  return (
    <motion.button
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={clsx(
        "inline-flex items-center justify-center select-none transition-opacity",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={inlineStyle}
      disabled={isDisabled}
      {...(props as any)}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        icon
      )}
      {children}
      {iconRight && !loading && iconRight}
    </motion.button>
  );
}
