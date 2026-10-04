"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/utils";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  showBack,
  showSettings,
  rightElement,
  className,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 flex items-center h-14 px-4 pt-safe",
        className
      )}
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {showBack ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="mr-3 p-1.5 rounded-xl"
          style={{ color: "var(--text-2)", background: "var(--surface-2)" }}
        >
          <ArrowLeft size={18} />
        </motion.button>
      ) : (
        <div className="w-9" />
      )}

      <h1
        className="flex-1 text-center text-base font-semibold"
        style={{ color: "var(--text-1)" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {rightElement}
        {showSettings && (
          <Link href="/settings">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-xl"
              style={{ color: "var(--text-2)", background: "var(--surface-2)" }}
            >
              <Settings size={18} />
            </motion.div>
          </Link>
        )}
        {!rightElement && !showSettings && <div className="w-9" />}
      </div>
    </header>
  );
}
