"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  List,
  BarChart3,
  Handshake,
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions", icon: List, label: "Expenses" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/lends", icon: Handshake, label: "Lends" },
  { href: "/reports", icon: MoreHorizontal, label: "More" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto pb-safe"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          // Match active state — /reports and /settings both show as "More" active
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/reports"
              ? pathname === "/reports" || pathname === "/settings"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-14 h-14 relative"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -inset-2 rounded-xl"
                    style={{ background: "var(--accent-bg)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={22}
                  className="relative z-10 transition-colors"
                  style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
