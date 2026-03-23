"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function GlassCard({
  children,
  className,
  title,
  description,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "bg-aether-surface backdrop-blur-xl border border-aether-border rounded-xl",
        "hover:border-aether-border-glow hover:shadow-glow-sm transition-all duration-300",
        className
      )}
    >
      {(title || description) && (
        <div className="px-6 pt-6 pb-2">
          {title && (
            <h2 className="font-display text-xl font-semibold text-aether-text">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-aether-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
