"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Wallet, Handshake } from "lucide-react";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      {/* Logo / Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="text-center mb-10"
      >
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
            boxShadow: "0 8px 32px rgba(212,98,45,0.35)",
          }}
        >
          <TrendingUp size={36} color="white" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
          ExpenseTrack
        </h1>
        <p className="text-base" style={{ color: "var(--text-2)" }}>
          Your money, your way.
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Minimal. Portable. Powerful.
        </p>
      </motion.div>

      {/* Features preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-sm space-y-3 mb-10"
      >
        {[
          { icon: <Wallet size={18} />, text: "Track expenses in seconds", color: "var(--accent)" },
          { icon: <BarChart3 size={18} />, text: "Deep analytics & charts", color: "var(--investment)" },
          { icon: <Handshake size={18} />, text: "Track lending & borrowing", color: "var(--income)" },
          { icon: <TrendingUp size={18} />, text: "Backed by Google Sheets", color: "#8B5CF6" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.07, type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center gap-3 p-3.5 rounded-[14px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: item.color + "22", color: item.color }}
            >
              {item.icon}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
              {item.text}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Sign in button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-sm"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full h-14 rounded-[16px] flex items-center justify-center gap-3 font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
            boxShadow: "0 6px 24px rgba(212,98,45,0.4)",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </motion.button>
        <p className="text-center text-xs mt-4" style={{ color: "var(--text-3)" }}>
          Your data lives in your own Google Sheet.
          <br />
          We never see or store it.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#fff"
        opacity="0.9"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#fff"
        opacity="0.9"
      />
    </svg>
  );
}
