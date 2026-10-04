"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatter?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatter, className }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 200, damping: 28 });
  const display = useTransform(spring, (v) =>
    formatter ? formatter(Math.floor(v)) : Math.floor(v).toLocaleString("en-IN")
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

/** Simple counter that counts up from 0 */
export function CountUp({
  value,
  formatter,
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 180, damping: 25 });
  const display = useTransform(spring, (v) =>
    formatter ? formatter(Math.floor(v)) : Math.floor(v).toLocaleString("en-IN")
  );
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      const timer = setTimeout(() => spring.set(value), 100);
      return () => clearTimeout(timer);
    }
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}
