"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type ColumnDef } from "@/components/aether/data-table";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  id: number;
  userId: number | null;
  activityType: string;
  action: string;
  description: string;
  entityType: string | null;
  entityId: number | null;
  entityName: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: { id: number; name: string | null; email: string } | null;
}

interface AuditLogTableProps {
  entries: ActivityEntry[];
  total: number;
  page: number;
  perPage: number;
  users: Array<{ id: number; name: string | null; email: string }>;
  activityTypes: string[];
  filters: {
    activityType: string;
    userId: string;
    dateFrom: string;
    dateTo: string;
  };
}

const TYPE_COLORS: Record<string, string> = {
  auth: "bg-aether-purple/20 text-aether-purple border-aether-purple/30",
  user: "bg-aether-blue/20 text-aether-blue border-aether-blue/30",
  system: "bg-aether-cyan/20 text-aether-cyan border-aether-cyan/30",
  product: "bg-aether-emerald/20 text-aether-emerald border-aether-emerald/30",
  container: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  delivery: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  quotation: "bg-aether-rose/20 text-aether-rose border-aether-rose/30",
  sync: "bg-aether-text-muted/20 text-aether-text-muted border-aether-text-muted/30",
};

function ExpandableRow({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <React.Fragment>
      <tr
        className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3 text-xs font-mono text-aether-text-secondary whitespace-nowrap">
          {new Date(entry.createdAt).toLocaleString("pl-PL", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </td>
        <td className="px-4 py-3 text-sm text-aether-text">
          {entry.user?.name ?? entry.user?.email ?? (
            <span className="text-aether-text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-mono",
              TYPE_COLORS[entry.activityType] ?? TYPE_COLORS.sync
            )}
          >
            {entry.activityType}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className="text-xs font-mono bg-aether-elevated text-aether-text-secondary border-aether-border"
          >
            {entry.action}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-aether-text max-w-xs truncate">
          {entry.description}
        </td>
        <td className="px-4 py-3 text-xs text-aether-text-muted">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-aether-border/30 bg-aether-elevated/30">
          <td colSpan={6} className="px-6 py-4">
            <div className="space-y-2 text-xs font-mono text-aether-text-secondary">
              {entry.entityType && (
                <p>
                  <span className="text-aether-text-muted">Encja:</span>{" "}
                  {entry.entityType}
                  {entry.entityId ? ` #${entry.entityId}` : ""}
                  {entry.entityName ? ` (${entry.entityName})` : ""}
                </p>
              )}
              {entry.ipAddress && (
                <p>
                  <span className="text-aether-text-muted">IP:</span>{" "}
                  {entry.ipAddress}
                </p>
              )}
              {entry.userAgent && (
                <p className="truncate">
                  <span className="text-aether-text-muted">User-Agent:</span>{" "}
                  {entry.userAgent}
                </p>
              )}
              {entry.metadata && (
                <div>
                  <span className="text-aether-text-muted">Metadata:</span>
                  <pre className="mt-1 p-2 bg-aether-void rounded text-aether-text overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(entry.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

export function AuditLogTable({
  entries,
  total,
  page,
  perPage,
  users,
  activityTypes,
  filters,
}: AuditLogTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [localFilters, setLocalFilters] = React.useState(filters);

  function applyFilters(newFilters: typeof filters) {
    const params = new URLSearchParams();
    if (newFilters.activityType) params.set("activityType", newFilters.activityType);
    if (newFilters.userId) params.set("userId", newFilters.userId);
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  const inputClass = cn(
    "h-9 px-3 text-sm rounded-lg",
    "bg-aether-elevated border border-aether-border",
    "text-aether-text placeholder:text-aether-text-muted",
    "focus:outline-none focus:border-aether-border-glow",
    "transition-all duration-200"
  );

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-aether-surface backdrop-blur-xl rounded-xl border border-aether-border">
        <Select
          value={localFilters.activityType || "all"}
          onValueChange={(v) => {
            const val = v ?? "";
            const updated = { ...localFilters, activityType: val === "all" ? "" : val };
            setLocalFilters(updated);
            applyFilters(updated);
          }}
        >
          <SelectTrigger className="w-40 h-9 bg-aether-elevated border-aether-border text-aether-text text-sm">
            <SelectValue placeholder="Typ aktywności" />
          </SelectTrigger>
          <SelectContent className="bg-aether-elevated border-aether-border">
            <SelectItem value="all" className="text-aether-text text-sm">
              Wszystkie typy
            </SelectItem>
            {activityTypes.map((t) => (
              <SelectItem key={t} value={t} className="text-aether-text text-sm font-mono">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={localFilters.userId || "all"}
          onValueChange={(v) => {
            const val = v ?? "";
            const updated = { ...localFilters, userId: val === "all" ? "" : val };
            setLocalFilters(updated);
            applyFilters(updated);
          }}
        >
          <SelectTrigger className="w-48 h-9 bg-aether-elevated border-aether-border text-aether-text text-sm">
            <SelectValue placeholder="Użytkownik" />
          </SelectTrigger>
          <SelectContent className="bg-aether-elevated border-aether-border">
            <SelectItem value="all" className="text-aether-text text-sm">
              Wszyscy
            </SelectItem>
            {users.map((u) => (
              <SelectItem
                key={u.id}
                value={String(u.id)}
                className="text-aether-text text-sm"
              >
                {u.name ?? u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={localFilters.dateFrom}
          onChange={(e) => {
            const updated = { ...localFilters, dateFrom: e.target.value };
            setLocalFilters(updated);
            applyFilters(updated);
          }}
          className={inputClass}
        />
        <span className="text-aether-text-muted text-xs">—</span>
        <input
          type="date"
          value={localFilters.dateTo}
          onChange={(e) => {
            const updated = { ...localFilters, dateTo: e.target.value };
            setLocalFilters(updated);
            applyFilters(updated);
          }}
          className={inputClass}
        />

        <button
          onClick={() => {
            const cleared = { activityType: "", userId: "", dateFrom: "", dateTo: "" };
            setLocalFilters(cleared);
            applyFilters(cleared);
          }}
          className="text-xs text-aether-text-muted hover:text-aether-text transition-colors ml-auto"
        >
          Wyczyść filtry
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-aether-border overflow-hidden bg-aether-surface backdrop-blur-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-aether-elevated border-b border-aether-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Czas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Użytkownik
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Typ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Akcja
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Opis
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-aether-text-muted text-sm"
                >
                  Brak wpisów w logu aktywności
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <ExpandableRow key={entry.id} entry={entry} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-aether-text-secondary">
          <span>
            Wpisy {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} z {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (localFilters.activityType) params.set("activityType", localFilters.activityType);
                if (localFilters.userId) params.set("userId", localFilters.userId);
                if (localFilters.dateFrom) params.set("dateFrom", localFilters.dateFrom);
                if (localFilters.dateTo) params.set("dateTo", localFilters.dateTo);
                params.set("page", String(page - 1));
                router.push(`${pathname}?${params.toString()}`);
              }}
              disabled={page <= 1}
              className={cn(
                "px-3 py-1.5 rounded-lg border border-aether-border text-xs",
                "hover:border-aether-border-glow hover:text-aether-text transition-colors",
                page <= 1 && "opacity-40 cursor-not-allowed"
              )}
            >
              Poprzednia
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (localFilters.activityType) params.set("activityType", localFilters.activityType);
                if (localFilters.userId) params.set("userId", localFilters.userId);
                if (localFilters.dateFrom) params.set("dateFrom", localFilters.dateFrom);
                if (localFilters.dateTo) params.set("dateTo", localFilters.dateTo);
                params.set("page", String(page + 1));
                router.push(`${pathname}?${params.toString()}`);
              }}
              disabled={page >= totalPages}
              className={cn(
                "px-3 py-1.5 rounded-lg border border-aether-border text-xs",
                "hover:border-aether-border-glow hover:text-aether-text transition-colors",
                page >= totalPages && "opacity-40 cursor-not-allowed"
              )}
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
