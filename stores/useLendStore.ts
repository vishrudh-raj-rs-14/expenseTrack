"use client";

import { create } from "zustand";
import type { Lend } from "@/lib/types";

interface LendState {
  lends: Lend[];
  isLoading: boolean;
  isAddingOpen: boolean;
  editingLend: Lend | null;
  settlingLend: Lend | null;

  setLends: (lends: Lend[]) => void;
  setAddingOpen: (v: boolean) => void;
  setEditingLend: (lend: Lend | null) => void;
  setSettlingLend: (lend: Lend | null) => void;

  fetchLends: () => Promise<void>;
  addLend: (data: Partial<Lend>) => Promise<Lend | null>;
  updateLend: (lend: Lend) => Promise<boolean>;
  settleLend: (id: string, amount: number, date: string) => Promise<boolean>;
  deleteLend: (id: string) => Promise<boolean>;

  // Derived
  getLent: () => Lend[];
  getBorrowed: () => Lend[];
  getPending: () => Lend[];
  netBalance: () => { owed: number; owing: number };
}

export const useLendStore = create<LendState>((set, get) => ({
  lends: [],
  isLoading: false,
  isAddingOpen: false,
  editingLend: null,
  settlingLend: null,

  setLends: (lends) => set({ lends }),
  setAddingOpen: (v) => set({ isAddingOpen: v }),
  setEditingLend: (lend) => set({ editingLend: lend, isAddingOpen: !!lend }),
  setSettlingLend: (lend) => set({ settlingLend: lend }),

  fetchLends: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/lends");
      const json = await res.json();
      if (json.data) set({ lends: json.data });
    } catch (e) {
      console.error("fetchLends error:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addLend: async (data) => {
    try {
      const res = await fetch("/api/lends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.data) {
        set((state) => ({ lends: [json.data, ...state.lends] }));
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("addLend error:", e);
      return null;
    }
  },

  updateLend: async (lend) => {
    try {
      const res = await fetch("/api/lends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lend),
      });
      if (res.ok) {
        const json = await res.json();
        set((state) => ({
          lends: state.lends.map((l) => (l.id === lend.id ? json.data ?? lend : l)),
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("updateLend error:", e);
      return false;
    }
  },

  settleLend: async (id, amount, date) => {
    try {
      const res = await fetch("/api/lends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "settle", settleAmount: amount, settleDate: date }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          set((state) => ({
            lends: state.lends.map((l) => (l.id === id ? json.data : l)),
          }));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("settleLend error:", e);
      return false;
    }
  },

  deleteLend: async (id) => {
    try {
      const res = await fetch(`/api/lends?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        set((state) => ({ lends: state.lends.filter((l) => l.id !== id) }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("deleteLend error:", e);
      return false;
    }
  },

  getLent: () => get().lends.filter((l) => l.type === "lent"),
  getBorrowed: () => get().lends.filter((l) => l.type === "borrowed"),
  getPending: () => get().lends.filter((l) => l.status !== "settled"),

  netBalance: () => {
    const pending = get().lends.filter((l) => l.status !== "settled");
    const owed = pending
      .filter((l) => l.type === "lent")
      .reduce((sum, l) => sum + (l.amount - (l.settledAmount || 0)), 0);
    const owing = pending
      .filter((l) => l.type === "borrowed")
      .reduce((sum, l) => sum + (l.amount - (l.settledAmount || 0)), 0);
    return { owed, owing };
  },
}));
