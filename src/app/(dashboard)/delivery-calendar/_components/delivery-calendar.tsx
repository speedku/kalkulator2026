"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ship, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  isToday,
} from "date-fns";
import { pl } from "date-fns/locale";
import { GlassCard } from "@/components/aether/glass-card";
import type { CalendarEvent } from "@/types/domestic-deliveries";

interface Props {
  year: number;
  month: number;
  containers: CalendarEvent[];
  domesticDeliveries: CalendarEvent[];
}

function buildCalendarGrid(year: number, month: number): Date[][] {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

const MAX_VISIBLE_EVENTS = 3;

export function DeliveryCalendar({
  year,
  month,
  containers,
  domesticDeliveries,
}: Props) {
  const router = useRouter();
  const weeks = buildCalendarGrid(year, month);
  const currentMonthDate = new Date(year, month - 1);

  const navigateToMonth = (dir: 1 | -1) => {
    const d = new Date(year, month - 1 + dir, 1);
    router.push(
      `/delivery-calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`
    );
  };

  return (
    <GlassCard>
      <div className="px-6 py-6">
        {/* Month header + navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateToMonth(-1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-semibold text-white capitalize">
            {format(currentMonthDate, "LLLL yyyy", { locale: pl })}
          </h2>

          <button
            onClick={() => navigateToMonth(1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Następny miesiąc"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weeks[0]?.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center text-xs text-gray-500 font-medium py-1"
            >
              {format(day, "EEE", { locale: pl })}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const inCurrentMonth = isSameMonth(day, currentMonthDate);
                const today = isToday(day);

                // Find events for this day
                const dayContainers = containers.filter((e) =>
                  isSameDay(new Date(e.etaDate), day)
                );
                const dayDeliveries = domesticDeliveries.filter((e) =>
                  isSameDay(new Date(e.etaDate), day)
                );
                const allEvents = [
                  ...dayContainers.map((e) => ({ ...e, kind: "container" as const })),
                  ...dayDeliveries.map((e) => ({ ...e, kind: "domestic" as const })),
                ];
                const visibleEvents = allEvents.slice(0, MAX_VISIBLE_EVENTS);
                const overflowCount = allEvents.length - MAX_VISIBLE_EVENTS;

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] rounded-lg p-1.5 border transition-colors ${
                      inCurrentMonth
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-transparent bg-transparent"
                    } ${today ? "ring-1 ring-cyan-400/50" : ""}`}
                  >
                    {/* Day number */}
                    <div
                      className={`text-xs mb-1 font-medium text-right pr-0.5 ${
                        today
                          ? "text-cyan-400"
                          : inCurrentMonth
                          ? "text-gray-300"
                          : "text-white/20"
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    {/* Event chips */}
                    <div className="space-y-0.5">
                      {visibleEvents.map((event) =>
                        event.kind === "container" ? (
                          <Link
                            key={`c-${event.id}`}
                            href={event.href}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors truncate"
                            title={event.label}
                          >
                            <Ship className="w-3 h-3 shrink-0" />
                            <span className="truncate">{event.label}</span>
                          </Link>
                        ) : (
                          <Link
                            key={`d-${event.id}`}
                            href={event.href}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors truncate"
                            title={event.label}
                          >
                            <Truck className="w-3 h-3 shrink-0" />
                            <span className="truncate">{event.label}</span>
                          </Link>
                        )
                      )}
                      {overflowCount > 0 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{overflowCount} więcej
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              <Ship className="w-3 h-3" />
              <span>Kontener (China)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
              <Truck className="w-3 h-3" />
              <span>Dostawa krajowa</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
