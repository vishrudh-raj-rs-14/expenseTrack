"use client";

import React from "react";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  maxDigits?: number;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "del"],
];

export function NumPad({ value, onChange, maxDigits = 8 }: NumPadProps) {
  const handleKey = (key: string) => {
    if (key === "del") {
      onChange(value.slice(0, -1) || "");
      return;
    }

    // Prevent multiple dots
    if (key === "." && value.includes(".")) return;

    // Limit digits
    const [integer, decimal] = value.split(".");
    if (decimal !== undefined && decimal.length >= 2) return;
    if (!value.includes(".") && integer.replace(/^0+/, "").length >= maxDigits) return;

    // Replace leading zero
    if (key !== "." && value === "0") {
      onChange(key);
      return;
    }

    onChange(value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {KEYS.flat().map((key) => (
        <NumKey key={key} keyValue={key} onPress={handleKey} />
      ))}
    </div>
  );
}

function NumKey({ keyValue, onPress }: { keyValue: string; onPress: (k: string) => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92, backgroundColor: "var(--surface-3)" }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={() => onPress(keyValue)}
      className="h-14 rounded-[14px] flex items-center justify-center text-lg font-medium select-none"
      style={{
        background: "var(--surface-2)",
        color: keyValue === "del" ? "var(--text-2)" : "var(--text-1)",
      }}
    >
      {keyValue === "del" ? <Delete size={20} /> : keyValue}
    </motion.button>
  );
}
