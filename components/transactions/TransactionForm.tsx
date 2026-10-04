"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NumPad } from "@/components/ui/NumPad";
import { CategoryGrid, CategoryIcon } from "@/components/ui/CategoryGrid";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { todayISO, formatCurrency, isValidAmount } from "@/lib/utils";
import type { Transaction, TransactionType, PaymentMethod } from "@/lib/types";
import { ChevronRight, ChevronLeft, Calendar, CreditCard, Check } from "lucide-react";

type Step = "amount" | "category" | "subcategory" | "details";

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Cash", "Card", "NetBanking", "Wallet"];

const TYPE_OPTIONS: { label: string; value: TransactionType; color: string }[] = [
  { label: "Expense", value: "expense", color: "var(--expense)" },
  { label: "Income", value: "income", color: "var(--income)" },
  { label: "Investment", value: "investment", color: "var(--investment)" },
];

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export function TransactionForm({ isOpen, onClose, editTransaction }: TransactionFormProps) {
  const { getParents, getChildren } = useCategoryStore();
  const { addTransaction, updateTransaction } = useTransactionStore();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [date, setDate] = useState(todayISO());
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isEditing = !!editTransaction;

  // Populate form when editing
  useEffect(() => {
    if (editTransaction) {
      setAmount(String(editTransaction.amount));
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setSubcategory(editTransaction.subcategory);
      setDescription(editTransaction.description);
      setPaymentMethod(editTransaction.paymentMethod);
      setDate(editTransaction.date);
      setStep("amount");
    }
  }, [editTransaction]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("amount");
        setAmount("");
        setType("expense");
        setCategory("");
        setSubcategory("");
        setDescription("");
        setPaymentMethod("UPI");
        setDate(todayISO());
        setSaved(false);
      }, 300);
    }
  }, [isOpen]);

  const parentCategories = getParents(type);
  const subcategories = getChildren(category);

  const accentColor =
    type === "income"
      ? "var(--income)"
      : type === "investment"
      ? "var(--investment)"
      : "var(--accent)";

  const handleNext = () => {
    if (step === "amount" && isValidAmount(amount)) setStep("category");
    else if (step === "category" && category) {
      if (subcategories.length > 0) setStep("subcategory");
      else setStep("details");
    } else if (step === "subcategory") setStep("details");
  };

  const handleBack = () => {
    if (step === "details") {
      if (subcategories.length > 0) setStep("subcategory");
      else setStep("category");
    } else if (step === "subcategory") setStep("category");
    else if (step === "category") setStep("amount");
  };

  const handleSave = async () => {
    if (!isValidAmount(amount) || !category) return;
    setIsSaving(true);
    try {
      const data = {
        amount: parseFloat(amount),
        type,
        category,
        subcategory,
        description,
        paymentMethod,
        date,
      };

      if (isEditing && editTransaction) {
        await updateTransaction({ ...editTransaction, ...data });
      } else {
        await addTransaction(data);
      }

      setSaved(true);
      setTimeout(onClose, 600);
    } finally {
      setIsSaving(false);
    }
  };

  const canNext =
    step === "amount"
      ? isValidAmount(amount)
      : step === "category"
      ? !!category
      : step === "subcategory"
      ? true
      : false;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      showHandle
      showClose={false}
    >
      <div className="flex flex-col min-h-[60vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            {step !== "amount" && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleBack}
                className="p-1.5 rounded-xl"
                style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
              >
                <ChevronLeft size={18} />
              </motion.button>
            )}
          </div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
            {isEditing ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="text-sm font-medium"
            style={{ color: "var(--text-3)" }}
          >
            Cancel
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 px-5 pb-3">
          {(["amount", "category", "subcategory", "details"] as Step[]).map((s, i) => {
            const stepIndex = ["amount", "category", "subcategory", "details"].indexOf(step);
            const isActive = s === step;
            const isPast = i < stepIndex;
            if (s === "subcategory" && subcategories.length === 0) return null;
            return (
              <motion.div
                key={s}
                animate={{
                  width: isActive ? 24 : 6,
                  opacity: isActive || isPast ? 1 : 0.3,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="h-1.5 rounded-full"
                style={{ background: isActive || isPast ? accentColor : "var(--border-strong)" }}
              />
            );
          })}
        </div>

        {/* Type Toggle (visible on amount step) */}
        <AnimatePresence mode="wait">
          {step === "amount" && (
            <motion.div
              key="type-toggle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 px-5 pb-4"
            >
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setCategory(""); setSubcategory(""); }}
                  className="flex-1 h-9 rounded-[10px] text-sm font-medium transition-colors"
                  style={{
                    background: type === t.value ? t.color + "20" : "var(--surface-2)",
                    color: type === t.value ? t.color : "var(--text-2)",
                    border: `1.5px solid ${type === t.value ? t.color : "transparent"}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 px-5">
          <AnimatePresence mode="wait">

            {/* Step: Amount */}
            {step === "amount" && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              >
                {/* Amount Display */}
                <div className="text-center mb-4">
                  <div
                    className="text-5xl font-bold tracking-tight currency"
                    style={{ color: accentColor }}
                  >
                    ₹{amount || "0"}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
                    Enter amount
                  </p>
                </div>
                <NumPad value={amount} onChange={setAmount} />
              </motion.div>
            )}

            {/* Step: Category */}
            {step === "category" && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: "var(--text-2)" }}>
                  Pick a category
                </p>
                <div className="max-h-72 overflow-y-auto">
                  <CategoryGrid
                    categories={parentCategories}
                    selected={category}
                    onSelect={(name) => {
                      setCategory(name);
                      setSubcategory("");
                      const children = getChildren(name);
                      if (children.length > 0) {
                        setTimeout(() => setStep("subcategory"), 200);
                      } else {
                        setTimeout(() => setStep("details"), 200);
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step: Subcategory */}
            {step === "subcategory" && (
              <motion.div
                key="subcategory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-2)" }}>
                  {category} — pick subcategory
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
                  Tap to select, or skip below
                </p>
                <div className="max-h-72 overflow-y-auto">
                  <CategoryGrid
                    categories={subcategories}
                    selected={subcategory}
                    onSelect={(name) => {
                      setSubcategory(name);
                      setTimeout(() => setStep("details"), 200);
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step: Details */}
            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div
                  className="flex items-center justify-between p-3 rounded-[14px]"
                  style={{ background: "var(--surface-2)" }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {subcategory || category}
                    </span>
                    <span
                      className="text-xl font-bold currency"
                      style={{ color: accentColor }}
                    >
                      ₹{amount}
                    </span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: accentColor + "22" }}
                  >
                    <CategoryIcon
                      name={
                        useCategoryStore.getState().getByName(subcategory || category)?.icon ||
                        "MoreHorizontal"
                      }
                      size={20}
                      color={accentColor}
                    />
                  </div>
                </div>

                {/* Description */}
                <Textarea
                  label="Note (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  rows={2}
                />

                {/* Date */}
                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  icon={<Calendar size={16} />}
                />

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>
                    Payment Method
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className="h-8 px-3 rounded-[10px] text-xs font-medium transition-colors"
                        style={{
                          background: paymentMethod === pm ? "var(--accent-bg)" : "var(--surface-2)",
                          color: paymentMethod === pm ? "var(--accent)" : "var(--text-2)",
                          border: `1.5px solid ${paymentMethod === pm ? "var(--accent)" : "transparent"}`,
                        }}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action */}
        <div className="p-5 pt-4">
          {step === "details" ? (
            <Button
              fullWidth
              size="lg"
              onClick={handleSave}
              loading={isSaving}
              disabled={!isValidAmount(amount) || !category}
              icon={saved ? <Check size={20} /> : undefined}
            >
              {saved ? "Saved!" : isEditing ? "Update" : "Save Transaction"}
            </Button>
          ) : step !== "category" && step !== "subcategory" ? (
            <Button
              fullWidth
              size="lg"
              onClick={handleNext}
              disabled={!canNext}
              iconRight={<ChevronRight size={20} />}
            >
              Continue
            </Button>
          ) : null}

          {step === "subcategory" && (
            <Button
              variant="ghost"
              fullWidth
              size="md"
              onClick={() => setStep("details")}
              className="mt-2"
            >
              Skip subcategory
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
