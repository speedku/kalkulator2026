"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  mono?: boolean;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  total?: number;
  page?: number;
  perPage?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onSortChange?: (key: string, direction: SortDirection) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total = 0,
  page = 1,
  perPage = 20,
  searchPlaceholder = "Szukaj...",
  searchValue = "",
  onSearchChange,
  onPageChange,
  onPerPageChange,
  onSortChange,
  sortKey,
  sortDirection,
  className,
  emptyMessage = "Brak danych",
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / perPage);

  function handleSort(key: string, sortable?: boolean) {
    if (!sortable || !onSortChange) return;
    if (sortKey === key) {
      if (sortDirection === "asc") onSortChange(key, "desc");
      else if (sortDirection === "desc") onSortChange(key, null);
      else onSortChange(key, "asc");
    } else {
      onSortChange(key, "asc");
    }
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    if (sortDirection === "asc") return <ChevronUp className="h-3 w-3 text-aether-blue" />;
    if (sortDirection === "desc") return <ChevronDown className="h-3 w-3 text-aether-blue" />;
    return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Search + per-page */}
      {(onSearchChange || onPerPageChange) && (
        <div className="flex items-center justify-between gap-4">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aether-text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  "w-full h-9 pl-9 pr-3 text-sm rounded-lg",
                  "bg-aether-elevated border border-aether-border",
                  "text-aether-text placeholder:text-aether-text-muted",
                  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
                  "transition-all duration-200"
                )}
              />
            </div>
          )}
          {onPerPageChange && (
            <Select
              value={String(perPage)}
              onValueChange={(v) => onPerPageChange(Number(v))}
            >
              <SelectTrigger className="w-24 h-9 bg-aether-elevated border-aether-border text-aether-text text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-aether-elevated border-aether-border">
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem
                    key={n}
                    value={String(n)}
                    className="text-aether-text text-sm"
                  >
                    {n} / str.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-aether-border overflow-hidden bg-aether-surface backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-aether-elevated border-b border-aether-border hover:bg-aether-elevated">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-aether-text-secondary text-xs font-semibold uppercase tracking-wider",
                    col.mono && "font-mono",
                    col.sortable && "cursor-pointer select-none",
                    col.className
                  )}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-aether-text-muted"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "text-aether-text text-sm py-3",
                        col.mono && "font-mono text-xs",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between text-sm text-aether-text-secondary">
          <span>
            Wyniki {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} z {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={cn(
                "px-3 py-1.5 rounded-lg border border-aether-border text-xs",
                "hover:border-aether-border-glow hover:text-aether-text transition-colors",
                page <= 1 && "opacity-40 cursor-not-allowed"
              )}
            >
              Poprzednia
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "w-8 h-8 rounded-lg border text-xs transition-colors",
                    p === page
                      ? "border-aether-blue bg-aether-blue/20 text-aether-text"
                      : "border-aether-border hover:border-aether-border-glow hover:text-aether-text"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
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
