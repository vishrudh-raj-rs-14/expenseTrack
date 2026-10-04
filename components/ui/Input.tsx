"use client";

import React from "react";
import { clsx } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  iconRight,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--text-2)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          >
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            "w-full h-11 rounded-[12px] text-sm transition-all outline-none",
            "border px-3",
          icon ? "pl-9" : "",
          iconRight ? "pr-9" : "",
            error
              ? "border-[var(--expense)] focus:border-[var(--expense)]"
              : "border-[var(--border)] focus:border-[var(--accent)]",
            className
          )}
          style={{
            background: "var(--surface)",
            color: "var(--text-1)",
          }}
          {...props}
        />
        {iconRight && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          >
            {iconRight}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--expense)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--text-2)" }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          "w-full rounded-[12px] text-sm transition-all outline-none resize-none border px-3 py-2.5",
          error
            ? "border-[var(--expense)]"
            : "border-[var(--border)] focus:border-[var(--accent)]",
          className
        )}
        style={{ background: "var(--surface)", color: "var(--text-1)" }}
        rows={3}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--expense)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
