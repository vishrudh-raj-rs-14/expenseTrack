"use client";

import { create } from "zustand";
import type { Category } from "@/lib/types";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  setCategories: (cats: Category[]) => void;
  fetchCategories: () => Promise<void>;
  addCategory: (data: Partial<Category>) => Promise<Category | null>;
  updateCategory: (cat: Category) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Selectors
  getParents: (type?: string) => Category[];
  getChildren: (parentName: string) => Category[];
  getByName: (name: string) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  setCategories: (cats) => set({ categories: cats }),

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.data) set({ categories: json.data });
    } catch (e) {
      console.error("fetchCategories error:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: async (data) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.data) {
        set((state) => ({ categories: [...state.categories, json.data] }));
        return json.data;
      }
      return null;
    } catch (e) {
      console.error("addCategory error:", e);
      return null;
    }
  },

  updateCategory: async (cat) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      if (res.ok) {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === cat.id ? cat : c)),
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("updateCategory error:", e);
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
        return true;
      }
      return false;
    } catch (e) {
      console.error("deleteCategory error:", e);
      return false;
    }
  },

  getParents: (type) => {
    return get().categories.filter(
      (c) => c.parent === "" && c.isActive && (type ? c.type === type : true)
    );
  },

  getChildren: (parentName) => {
    return get().categories.filter((c) => c.parent === parentName && c.isActive);
  },

  getByName: (name) => {
    return get().categories.find((c) => c.name === name);
  },
}));
