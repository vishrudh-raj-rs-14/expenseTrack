"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, Monitor, LogOut, ExternalLink,
  ChevronRight, Plus, Pencil, Trash2, Check,
  FileSpreadsheet, Tag, Wallet, Target,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Input";
import { CategoryIcon } from "@/components/ui/CategoryGrid";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { applyTheme } from "@/components/providers/ThemeProvider";
import type { Category } from "@/lib/types";

type ThemeOption = "light" | "dark" | "system";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();

  const [theme, setTheme] = useState<ThemeOption>("system");
  const [budget, setBudget] = useState("");
  const [defaultPayment, setDefaultPayment] = useState("UPI");
  const [sheetUrl, setSheetUrl] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedType, setExpandedType] = useState<"expense" | "income" | "investment" | null>("expense");

  useEffect(() => {
    fetchCategories();
    // Load config
    fetch("/api/config").then((r) => r.json()).then((j) => {
      if (j.data) {
        setBudget(j.data.monthlyBudget || "");
        setDefaultPayment(j.data.defaultPaymentMethod || "UPI");
        setSheetUrl(j.data.sheetUrl || "");
        setTheme((j.data.theme as ThemeOption) || "system");
      }
    });

    // Load saved theme from localStorage
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved as ThemeOption);
  }, []);

  const saveConfig = async (key: string, value: string) => {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  const handleThemeChange = (t: ThemeOption) => {
    setTheme(t);
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    } else {
      applyTheme(t);
    }
    saveConfig("theme", t);
  };

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    await saveConfig("monthlyBudget", budget);
    setIsSavingBudget(false);
  };

  const parentCategories = categories.filter((c) => c.parent === "");
  const expenseCats = parentCategories.filter((c) => c.type === "expense");
  const incomeCats = parentCategories.filter((c) => c.type === "income");
  const investmentCats = parentCategories.filter((c) => c.type === "investment");

  return (
    <div style={{ background: "var(--bg)" }}>
      <Header title="Settings" />

      <div className="px-4 pb-6 pt-3 space-y-5">
        {/* Profile */}
        {session?.user && (
          <FadeIn>
            <div
              className="p-4 rounded-[16px] flex items-center gap-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
                >
                  {session.user.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: "var(--text-1)" }}>
                  {session.user.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                  {session.user.email}
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Monthly Budget */}
        <FadeIn delay={0.05}>
          <SettingsSection title="Budget" icon={<Target size={16} />}>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Monthly Budget (₹)"
                  type="number"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0 = no limit"
                />
              </div>
              <Button onClick={handleSaveBudget} loading={isSavingBudget} icon={<Check size={16} />}>
                Save
              </Button>
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Theme */}
        <FadeIn delay={0.1}>
          <SettingsSection title="Appearance" icon={<Monitor size={16} />}>
            <div className="flex gap-2">
              {([
                { value: "light", icon: <Sun size={16} />, label: "Light" },
                { value: "dark", icon: <Moon size={16} />, label: "Dark" },
                { value: "system", icon: <Monitor size={16} />, label: "System" },
              ] as { value: ThemeOption; icon: React.ReactNode; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className="flex-1 h-12 rounded-[12px] flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
                  style={{
                    background: theme === opt.value ? "var(--accent-bg)" : "var(--surface-2)",
                    color: theme === opt.value ? "var(--accent)" : "var(--text-2)",
                    border: `1.5px solid ${theme === opt.value ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingsSection>
        </FadeIn>

        {/* Categories */}
        <FadeIn delay={0.15}>
          <SettingsSection
            title="Categories"
            icon={<Tag size={16} />}
            action={
              <button
                onClick={() => { setEditingCategory(null); setCategorySheetOpen(true); }}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--accent)" }}
              >
                <Plus size={14} />
                Add
              </button>
            }
          >
            {/* Type tabs */}
            {[
              { type: "expense" as const, label: "Expenses", cats: expenseCats },
              { type: "income" as const, label: "Income", cats: incomeCats },
              { type: "investment" as const, label: "Investments", cats: investmentCats },
            ].map(({ type, label, cats }) => (
              <div key={type} className="mb-2">
                <button
                  className="flex items-center justify-between w-full py-2"
                  onClick={() => setExpandedType(expandedType === type ? null : type)}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    {label} ({cats.length})
                  </span>
                  <span style={{ color: "var(--text-3)" }}>{expandedType === type ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {expandedType === type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-1"
                    >
                      {cats.map((cat) => (
                        <CategoryRow
                          key={cat.id}
                          category={cat}
                          subcategories={categories.filter((c) => c.parent === cat.name)}
                          onEdit={() => { setEditingCategory(cat); setCategorySheetOpen(true); }}
                          onToggle={() => updateCategory({ ...cat, isActive: !cat.isActive })}
                          onDelete={() => deleteCategory(cat.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </SettingsSection>
        </FadeIn>

        {/* Google Sheets */}
        {sheetUrl && (
          <FadeIn delay={0.2}>
            <SettingsSection title="Data" icon={<FileSpreadsheet size={16} />}>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-[12px]"
                style={{ background: "var(--surface-2)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#22C55E22", color: "#22C55E" }}
                  >
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Google Sheets</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>View raw data</p>
                  </div>
                </div>
                <ExternalLink size={14} style={{ color: "var(--text-3)" }} />
              </a>
            </SettingsSection>
          </FadeIn>
        )}

        {/* Sign out */}
        <FadeIn delay={0.25}>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[14px] font-medium text-sm"
            style={{
              background: "var(--expense-bg)",
              color: "var(--expense)",
              border: "1px solid var(--expense-bg)",
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </FadeIn>
      </div>

      {/* Category Edit Sheet */}
      <CategorySheet
        isOpen={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        category={editingCategory}
        parentOptions={parentCategories}
        onSave={async (data) => {
          if (editingCategory) {
            await updateCategory({ ...editingCategory, ...data });
          } else {
            await addCategory(data);
          }
          setCategorySheetOpen(false);
        }}
      />
    </div>
  );
}

function SettingsSection({
  title, icon, children, action,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[20px] p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={{ color: "var(--accent)" }}>{icon}</div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function CategoryRow({
  category, subcategories, onEdit, onToggle, onDelete,
}: {
  category: Category;
  subcategories: Category[];
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2.5 p-2.5 rounded-[10px]"
      style={{ background: "var(--surface-2)", opacity: category.isActive ? 1 : 0.5 }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: category.color + "22" }}
      >
        <CategoryIcon name={category.icon} size={16} color={category.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
          {category.name}
          {subcategories.length > 0 && (
            <span className="ml-1 opacity-50">({subcategories.length})</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}>
          {category.isActive ? <Check size={14} /> : <Plus size={14} />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}>
          <Pencil size={14} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: "var(--expense)" }}>
          <Trash2 size={14} />
        </motion.button>
      </div>
    </div>
  );
}

const ICON_OPTIONS = [
  "UtensilsCrossed", "ShoppingBasket", "Coffee", "Film", "MapPin", "Bus", "Plane",
  "Dumbbell", "Activity", "Users", "Heart", "Gift", "Home", "Zap", "Wifi",
  "Smartphone", "ShoppingBag", "Shirt", "Laptop", "HeartPulse", "GraduationCap",
  "TrendingUp", "BarChart3", "PiggyBank", "Banknote", "Briefcase",
  "MoreHorizontal", "Wallet", "BookOpen",
];

const COLOR_OPTIONS = [
  "#E07B39", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B",
  "#6B7280", "#EC4899", "#EF4444", "#3B82F6", "#14B8A6", "#22C55E",
];

function CategorySheet({
  isOpen, onClose, category, parentOptions, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  parentOptions: Category[];
  onSave: (data: Partial<Category>) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name || "");
  const [parent, setParent] = useState(category?.parent || "");
  const [icon, setIcon] = useState(category?.icon || "MoreHorizontal");
  const [color, setColor] = useState(category?.color || "#9CA3AF");
  const [type, setType] = useState<Category["type"]>(category?.type || "expense");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParent(category.parent);
      setIcon(category.icon);
      setColor(category.color);
      setType(category.type);
    } else {
      setName(""); setParent(""); setIcon("MoreHorizontal");
      setColor("#9CA3AF"); setType("expense");
    }
  }, [category, isOpen]);

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    await onSave({ name, parent, icon, color, type });
    setSaving(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={category ? "Edit Category" : "New Category"}>
      <div className="p-5 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Type</label>
          <div className="flex gap-2">
            {(["expense", "income", "investment"] as Category["type"][]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 h-9 rounded-[10px] text-xs font-medium capitalize"
                style={{
                  background: type === t ? "var(--accent-bg)" : "var(--surface-2)",
                  color: type === t ? "var(--accent)" : "var(--text-2)",
                  border: `1.5px solid ${type === t ? "var(--accent)" : "transparent"}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Parent */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>
            Parent (optional — for subcategory)
          </label>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full h-11 rounded-[12px] px-3 text-sm border outline-none"
            style={{ background: "var(--surface)", color: "var(--text-1)", borderColor: "var(--border)" }}
          >
            <option value="">Top-level category</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full"
                style={{
                  background: c,
                  border: color === c ? `3px solid var(--text-1)` : "2px solid transparent",
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Icon</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: icon === ic ? color + "33" : "var(--surface-2)",
                  border: `1.5px solid ${icon === ic ? color : "transparent"}`,
                }}
              >
                <CategoryIcon name={ic} size={18} color={icon === ic ? color : "var(--text-3)"} />
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleSave} loading={saving} disabled={!name}>
          {category ? "Update" : "Add Category"}
        </Button>
      </div>
    </BottomSheet>
  );
}
