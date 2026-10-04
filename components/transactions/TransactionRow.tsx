"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { formatDateShort, formatCurrency, getTypeSign, getTypeColor } from "@/lib/utils";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import type { Transaction } from "@/lib/types";
import { Trash2, Pencil } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (txn: Transaction) => void;
  showDate?: boolean;
}

export function TransactionRow({ transaction: txn, onEdit, showDate = false }: TransactionRowProps) {
  const { getByName } = useCategoryStore();
  const { deleteTransaction } = useTransactionStore();
  const [deleting, setDeleting] = useState(false);

  const catMeta = getByName(txn.subcategory || txn.category);
  const parentMeta = getByName(txn.category);
  const icon = catMeta?.icon || parentMeta?.icon || "MoreHorizontal";
  const color = catMeta?.color || parentMeta?.color || "#9CA3AF";
  const amountColor = getTypeColor(txn.type);
  const sign = getTypeSign(txn.type);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTransaction(txn.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0 : 1, y: deleting ? -8 : 0, height: deleting ? 0 : "auto" }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative overflow-hidden"
    >
      {/* Swipe action background */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Left: Edit */}
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--investment)" }}
        >
          <Pencil size={14} />
          Edit
        </div>
        {/* Right: Delete */}
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--expense)" }}
        >
          Delete
          <Trash2 size={14} />
        </div>
      </div>

      {/* Main row — draggable */}
      <SwipeableRow
        onSwipeLeft={() => handleDelete()}
        onSwipeRight={() => onEdit?.(txn)}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: "var(--surface)" }}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + "22" }}
          >
            <CategoryIcon name={icon} size={18} color={color} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
              {txn.subcategory || txn.category}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
              {txn.description || txn.category}
              {showDate && ` · ${formatDateShort(txn.date)}`}
            </p>
          </div>

          {/* Amount + method */}
          <div className="text-right flex-shrink-0">
            <p
              className="text-sm font-semibold currency"
              style={{ color: amountColor }}
            >
              {sign}₹{txn.amount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              {txn.paymentMethod}
            </p>
          </div>
        </div>
      </SwipeableRow>
    </motion.div>
  );
}

/** Swipeable wrapper with left/right actions */
function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const x = useMotionValue(0);

  return (
    <motion.div
      style={{ x }}
      drag="x"
      dragConstraints={{ left: -80, right: 80 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (info.offset.x < -60) {
          onSwipeLeft();
        } else if (info.offset.x > 60) {
          onSwipeRight();
        }
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }}
    >
      {children}
    </motion.div>
  );
}
