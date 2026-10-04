"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { formatDateShort, getTypeSign, getTypeColor } from "@/lib/utils";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import type { Transaction } from "@/lib/types";
import { Trash2, Pencil } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (txn: Transaction) => void;
  showDate?: boolean;
}

const ACTION_WIDTH = 72;
const SWIPE_THRESHOLD = 60;

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

  const x = useMotionValue(0);
  const editOpacity = useTransform(x, [0, ACTION_WIDTH], [0, 1]);
  const deleteOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0]);

  const snapBack = () =>
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });

  const handleDelete = async () => {
    await animate(x, -400, { duration: 0.22, ease: "easeIn" });
    setDeleting(true);
    await deleteTransaction(txn.id);
  };

  const handleEdit = () => {
    snapBack();
    onEdit?.(txn);
  };

  if (deleting) return null;

  return (
    <div className="relative overflow-hidden">
      {/* Left action — Edit (revealed on swipe right) */}
      <motion.div
        className="absolute left-0 inset-y-0 flex items-center justify-center"
        style={{ width: ACTION_WIDTH, opacity: editOpacity }}
      >
        <button
          onClick={handleEdit}
          className="flex flex-col items-center gap-1"
          style={{ color: "var(--investment)" }}
        >
          <Pencil size={18} />
          <span className="text-[10px] font-semibold">Edit</span>
        </button>
      </motion.div>

      {/* Right action — Delete (revealed on swipe left) */}
      <motion.div
        className="absolute right-0 inset-y-0 flex items-center justify-center"
        style={{ width: ACTION_WIDTH, opacity: deleteOpacity }}
      >
        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-1"
          style={{ color: "var(--expense)" }}
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </motion.div>

      {/* Draggable card — covers action buttons at rest */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
        dragElastic={0.1}
        style={{ x, background: "var(--surface)", touchAction: "pan-y" }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -SWIPE_THRESHOLD) {
            handleDelete();
          } else if (info.offset.x > SWIPE_THRESHOLD) {
            handleEdit();
          } else {
            snapBack();
          }
        }}
        className="relative flex items-center gap-3 px-4 py-3.5 select-none"
      >
        {/* Category icon badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + "22" }}
        >
          <CategoryIcon name={icon} size={18} color={color} />
        </div>

        {/* Label + subtitle — flex-1 + min-w-0 ensures truncation */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-1)" }}
          >
            {txn.subcategory || txn.category}
          </p>
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: "var(--text-3)" }}
          >
            {txn.description || txn.category}
            {showDate && <span> · {formatDateShort(txn.date)}</span>}
          </p>
        </div>

        {/* Amount — fixed width, never squishes the label */}
        <div className="flex-shrink-0 text-right w-24">
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: amountColor }}
          >
            {sign}₹{txn.amount.toLocaleString("en-IN")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {txn.paymentMethod}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
