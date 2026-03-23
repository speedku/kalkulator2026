import * as React from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendData {
  value: number;
  direction: "up" | "down";
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: TrendData;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-aether-border",
        "bg-aether-surface backdrop-blur-xl p-5",
        "hover:border-aether-border-glow hover:shadow-glow-sm transition-all duration-300",
        className
      )}
    >
      {/* Icon badge top-right */}
      <div className="absolute top-4 right-4 p-2 rounded-lg bg-aether-blue/20">
        <Icon className="h-4 w-4 text-aether-blue" />
      </div>

      {/* Value */}
      <div className="mt-1">
        <p className="text-3xl font-display font-bold text-aether-text tracking-tight">
          {value}
        </p>
      </div>

      {/* Label */}
      <p className="mt-1 text-sm text-aether-text-secondary">{label}</p>

      {/* Trend */}
      {trend && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-aether-emerald" : "text-aether-rose"
          )}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
}
