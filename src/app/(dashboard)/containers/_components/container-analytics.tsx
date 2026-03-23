"use client";

import { Ship, DollarSign, TrendingUp, Clock } from "lucide-react";
import { GlassCard } from "@/components/aether/glass-card";
import type { ContainerAnalytics } from "@/types/containers";

interface Props {
  analytics: ContainerAnalytics;
}

export function ContainerAnalyticsPanel({ analytics }: Props) {
  const onTimePctColor =
    analytics.onTimePct === null
      ? "text-gray-400"
      : analytics.onTimePct >= 80
      ? "text-green-400"
      : analytics.onTimePct >= 60
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* W drodze */}
      <GlassCard>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">W drodze</p>
              <p className="text-2xl font-bold text-white">
                {analytics.inTransitCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.etaThisWeekCount > 0
                  ? `${analytics.etaThisWeekCount} oczekiwane w tym tygodniu`
                  : "brak w tym tygodniu"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Ship className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Wartość w tranzycie */}
      <GlassCard>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Wartość w tranzycie</p>
              <p className="text-lg font-bold text-white font-mono">
                {analytics.totalValueUsd.toLocaleString("pl-PL", {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.completedCount} zakończonych
              </p>
            </div>
            <div className="p-2 rounded-lg bg-aether-blue/20">
              <DollarSign className="w-5 h-5 text-aether-blue" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Terminowość */}
      <GlassCard>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Terminowość</p>
              <p className={`text-2xl font-bold ${onTimePctColor}`}>
                {analytics.onTimePct !== null
                  ? `${analytics.onTimePct}%`
                  : "Brak danych"}
              </p>
              <p className="text-xs text-gray-500 mt-1">zakończone kontenery</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Śr. czas dostawy */}
      <GlassCard>
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Śr. czas dostawy</p>
              <p className="text-2xl font-bold text-white">
                {analytics.avgDays > 0 ? analytics.avgDays : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.avgDays > 0 ? "dni" : "brak danych"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
