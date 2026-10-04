"use client";

import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryGridProps {
  categories: Category[];
  selected: string;
  onSelect: (name: string) => void;
}

export function CategoryGrid({ categories, selected, onSelect }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-1">
      {categories.map((cat, i) => (
        <motion.button
          key={cat.id}
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelect(cat.name)}
          className="flex flex-col items-center gap-1.5 p-2.5 rounded-[14px] transition-colors"
          style={{
            background: selected === cat.name ? cat.color + "22" : "var(--surface-2)",
            border: selected === cat.name ? `2px solid ${cat.color}` : "2px solid transparent",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: selected === cat.name ? cat.color : cat.color + "22",
            }}
          >
            <CategoryIcon
              name={cat.icon}
              size={18}
              color={selected === cat.name ? "white" : cat.color}
            />
          </div>
          <span
            className="text-[10px] font-medium text-center leading-tight line-clamp-2"
            style={{ color: selected === cat.name ? cat.color : "var(--text-2)" }}
          >
            {cat.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function CategoryIcon({
  name,
  size = 20,
  color,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  // Dynamically get icon from lucide-react
  const IconComponent = (Icons as any)[name] as React.ComponentType<{
    size?: number;
    color?: string;
    className?: string;
  }>;
  if (!IconComponent) {
    const Fallback = Icons.MoreHorizontal;
    return <Fallback size={size} color={color} className={className} />;
  }
  return <IconComponent size={size} color={color} className={className} />;
}
