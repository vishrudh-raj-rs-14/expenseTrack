"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, ChevronUp, Check, Handshake } from "lucide-react";
import { useLendStore } from "@/stores/useLendStore";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input, Textarea } from "@/components/ui/Input";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { CountUp } from "@/components/ui/AnimatedNumber";
import { formatDate, todayISO, initials } from "@/lib/utils";
import type { Lend } from "@/lib/types";

type Tab = "lent" | "borrowed";

export default function LendsPage() {
  const {
    lends,
    fetchLends,
    isLoading,
    isAddingOpen,
    setAddingOpen,
    settlingLend,
    setSettlingLend,
    netBalance,
  } = useLendStore();

  const [activeTab, setActiveTab] = useState<Tab>("lent");
  const [showSettled, setShowSettled] = useState(false);

  useEffect(() => {
    fetchLends();
  }, []);

  const { owed, owing } = netBalance();

  const filtered = lends.filter((l) => l.type === activeTab);
  const pending = filtered.filter((l) => l.status !== "settled");
  const settled = filtered.filter((l) => l.status === "settled");

  return (
    <div style={{ background: "var(--bg)" }}>
      <Header
        title="Lends"
        rightElement={
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setAddingOpen(true)}
          >
            Add
          </Button>
        }
      />

      {/* Net Balance Banner */}
      <FadeIn className="px-4 pt-3">
        <div
          className="rounded-[20px] p-4 grid grid-cols-2 gap-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>People owe you</p>
            <p className="text-xl font-bold currency" style={{ color: "var(--income)" }}>
              ₹<CountUp value={owed} formatter={(n) => n.toLocaleString("en-IN")} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>You owe others</p>
            <p className="text-xl font-bold currency" style={{ color: "var(--expense)" }}>
              ₹<CountUp value={owing} formatter={(n) => n.toLocaleString("en-IN")} />
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.05} className="px-4 pt-3">
        <div
          className="flex h-10 rounded-[12px] p-1"
          style={{ background: "var(--surface-2)" }}
        >
          {(["lent", "borrowed"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-[9px] text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "var(--surface)" : "transparent",
                color: activeTab === tab ? "var(--text-1)" : "var(--text-3)",
                boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
              }}
            >
              {tab === "lent" ? "I Lent" : "I Borrowed"}
            </button>
          ))}
        </div>
      </FadeIn>

      <div className="px-4 pt-3 pb-6 space-y-3">
        {isLoading ? (
          <LoadingSkeleton />
        ) : pending.length === 0 && settled.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <StaggerContainer>
                {pending.map((lend) => (
                  <StaggerItem key={lend.id}>
                    <LendCard lend={lend} onSettle={() => setSettlingLend(lend)} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Settled toggle */}
            {settled.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSettled(!showSettled)}
                  className="flex items-center gap-2 py-2"
                  style={{ color: "var(--text-3)" }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Settled ({settled.length})
                  </span>
                  {showSettled ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showSettled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {settled.map((lend) => (
                        <LendCard key={lend.id} lend={lend} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Lend Sheet */}
      <AddLendSheet isOpen={isAddingOpen} onClose={() => setAddingOpen(false)} />

      {/* Settle Sheet */}
      {settlingLend && (
        <SettleSheet lend={settlingLend} onClose={() => setSettlingLend(null)} />
      )}
    </div>
  );
}

function LendCard({ lend, onSettle }: { lend: Lend; onSettle?: () => void }) {
  const { deleteLend } = useLendStore();
  const remaining = lend.amount - (lend.settledAmount || 0);
  const pct = lend.amount > 0 ? ((lend.settledAmount || 0) / lend.amount) * 100 : 0;

  const statusVariant =
    lend.status === "settled" ? "settled"
      : lend.status === "partially_settled" ? "partial"
        : "pending";

  return (
    <motion.div
      layout
      className="p-4 rounded-[16px]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{
            background: lend.type === "lent" ? "var(--income-bg)" : "var(--expense-bg)",
            color: lend.type === "lent" ? "var(--income)" : "var(--expense)",
          }}
        >
          {initials(lend.person)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
              {lend.person}
            </p>
            <Badge variant={statusVariant} size="sm">
              {lend.status === "settled" ? "Settled" : lend.status === "partially_settled" ? "Partial" : "Pending"}
            </Badge>
          </div>
          {lend.reason && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
              {lend.reason}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {formatDate(lend.date)}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {lend.status === "settled"
              ? "Settled"
              : lend.status === "partially_settled"
              ? `₹${remaining.toLocaleString("en-IN")} remaining`
              : "Amount"}
          </p>
          <p
            className="text-xl font-bold currency"
            style={{ color: lend.type === "lent" ? "var(--income)" : "var(--expense)" }}
          >
            ₹{lend.amount.toLocaleString("en-IN")}
          </p>
        </div>

        {lend.status !== "settled" && onSettle && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Check size={14} />}
            onClick={onSettle}
          >
            Settle
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {lend.status === "partially_settled" && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: "var(--income)" }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            ₹{(lend.settledAmount || 0).toLocaleString("en-IN")} paid · {Math.round(pct)}%
          </p>
        </div>
      )}
    </motion.div>
  );
}

function AddLendSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addLend } = useLendStore();
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPerson(""); setAmount(""); setType("lent"); setReason(""); setDate(todayISO());
  };

  const handleSave = async () => {
    if (!person || !amount) return;
    setSaving(true);
    await addLend({ person, amount: parseFloat(amount), type, reason, date });
    setSaving(false);
    reset();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="New Lend / Borrow">
      <div className="p-5 space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setType("lent")}
            className="flex-1 h-10 rounded-[10px] text-sm font-medium"
            style={{
              background: type === "lent" ? "var(--income-bg)" : "var(--surface-2)",
              color: type === "lent" ? "var(--income)" : "var(--text-2)",
              border: `1.5px solid ${type === "lent" ? "var(--income)" : "transparent"}`,
            }}
          >
            I Lent
          </button>
          <button
            onClick={() => setType("borrowed")}
            className="flex-1 h-10 rounded-[10px] text-sm font-medium"
            style={{
              background: type === "borrowed" ? "var(--expense-bg)" : "var(--surface-2)",
              color: type === "borrowed" ? "var(--expense)" : "var(--text-2)",
              border: `1.5px solid ${type === "borrowed" ? "var(--expense)" : "transparent"}`,
            }}
          >
            I Borrowed
          </button>
        </div>

        <Input
          label="Person"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Name"
        />

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Amount (₹)</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full h-11 rounded-[12px] text-sm px-3 border outline-none"
            style={{ background: "var(--surface)", color: "var(--text-1)", borderColor: "var(--border)" }}
          />
        </div>

        <Textarea
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What's it for?"
          rows={2}
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          loading={saving}
          disabled={!person || !amount}
        >
          Save
        </Button>
      </div>
    </BottomSheet>
  );
}

function SettleSheet({ lend, onClose }: { lend: Lend; onClose: () => void }) {
  const { settleLend } = useLendStore();
  const remaining = lend.amount - (lend.settledAmount || 0);
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const handleSettle = async () => {
    setSaving(true);
    await settleLend(lend.id, parseFloat(amount), date);
    setSaving(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Settle Amount">
      <div className="p-5 space-y-4">
        <div
          className="p-4 rounded-[14px] text-center"
          style={{ background: "var(--surface-2)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-3)" }}>With {lend.person}</p>
          <p className="text-2xl font-bold currency mt-1" style={{ color: "var(--income)" }}>
            ₹{remaining.toLocaleString("en-IN")} remaining
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Settle Amount (₹)</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 rounded-[12px] text-sm px-3 border outline-none"
            style={{ background: "var(--surface)", color: "var(--text-1)", borderColor: "var(--border)" }}
          />
        </div>

        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => { setAmount(String(remaining)); }}
          >
            Full Amount
          </Button>
          <Button fullWidth onClick={handleSettle} loading={saving}>
            Settle
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

function EmptyState({ type }: { type: Tab }) {
  return (
    <div className="py-16 text-center">
      <Handshake size={40} className="mx-auto mb-3" style={{ color: "var(--text-3)" }} />
      <p className="text-base font-medium" style={{ color: "var(--text-2)" }}>
        No {type === "lent" ? "lends" : "borrows"} yet
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
        Tap + to add one
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-[16px] animate-pulse" style={{ background: "var(--surface-2)" }} />
      ))}
    </div>
  );
}
