"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** snap points as percentages of screen height (e.g. [0.5, 0.9]) */
  snapPoints?: number[];
  /** Show drag handle */
  showHandle?: boolean;
  /** Show close button */
  showClose?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
  showClose = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sheet-overlay"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className={clsx(
              "fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto",
              "rounded-t-[28px] overflow-hidden",
              className
            )}
            style={{
              background: "var(--surface)",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "92vh",
            }}
          >
            {/* Handle + Header */}
            <div className="sticky top-0 z-10" style={{ background: "var(--surface)" }}>
              {showHandle && (
                <div className="flex justify-center pt-3 pb-2">
                  <div
                    className="w-10 h-1 rounded-full"
                    style={{ background: "var(--border-strong)" }}
                  />
                </div>
              )}
              {(title || showClose) && (
                <div className="flex items-center justify-between px-5 pb-3 pt-1">
                  {title && (
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="ml-auto p-1.5 rounded-full transition-colors"
                      style={{ color: "var(--text-2)" }}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}
              <div className="h-px" style={{ background: "var(--border)" }} />
            </div>

            {/* Content */}
            <div className="overflow-y-auto pb-safe" style={{ maxHeight: "calc(92vh - 80px)" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
