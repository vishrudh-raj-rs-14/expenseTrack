"use client";

import { useEffect } from "react";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useTransactionStore } from "@/stores/useTransactionStore";

/** Bootstraps data on first load */
export function DataBootstrap() {
  const { fetchCategories } = useCategoryStore();
  const { fetchDashboardStats } = useTransactionStore();

  useEffect(() => {
    fetchCategories();
    fetchDashboardStats();
  }, []);

  return null;
}
