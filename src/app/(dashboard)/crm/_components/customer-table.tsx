"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { deleteCustomerAction } from "@/lib/actions/crm";
import { GlowButton } from "@/components/aether/glow-button";
import { cn } from "@/lib/utils";
import type { CustomerRow } from "@/lib/dal/crm";

interface CustomerTableProps {
  customers: CustomerRow[];
  total: number;
}

export function CustomerTable({ customers, total }: CustomerTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  }

  function handleActiveToggle(showActive: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (!showActive) {
      params.set("active", "false");
    } else {
      params.delete("active");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`Czy na pewno chcesz dezaktywować klienta "${name}"?`)) return;
    const result = await deleteCustomerAction(id);
    if (result.error) {
      alert(result.error);
    }
  }

  const currentSearch = searchParams.get("search") ?? "";
  const showActive = searchParams.get("active") !== "false";

  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: "name",
      header: "Nazwa klienta",
      cell: ({ row }) => (
        <Link
          href={`/crm/${row.original.id}`}
          className="text-aether-blue hover:text-aether-blue/80 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-aether-text-secondary">
          {row.original.email ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Telefon",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      accessorKey: "nip",
      header: "NIP",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-aether-text-secondary">
          {row.original.nip ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            Aktywny
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
            Nieaktywny
          </span>
        ),
    },
    {
      id: "lastContact",
      header: "Ostatni kontakt",
      cell: ({ row }) =>
        row.original.lastContactAt ? (
          <span className="text-sm">{format(new Date(row.original.lastContactAt), "dd.MM.yyyy")}</span>
        ) : (
          <span className="text-aether-text-muted">—</span>
        ),
    },
    {
      id: "deals",
      header: "Deale",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original._count.deals}</span>
      ),
    },
    {
      id: "leads",
      header: "Leady",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original._count.leads}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/crm/${row.original.id}/edit`)}
          >
            Edytuj
          </GlowButton>
          {row.original.isActive && (
            <GlowButton
              variant="danger"
              size="sm"
              onClick={() => handleDeactivate(row.original.id, row.original.name)}
            >
              Dezaktywuj
            </GlowButton>
          )}
        </div>
      ),
      size: 180,
    },
  ];

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Szukaj po nazwie, email, NIP..."
            defaultValue={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              "w-full h-9 pl-3 pr-3 text-sm rounded-lg",
              "bg-aether-elevated border border-aether-border",
              "text-aether-text placeholder:text-aether-text-muted",
              "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
              "transition-all duration-200"
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <GlowButton
            variant={showActive ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleActiveToggle(true)}
          >
            Aktywni
          </GlowButton>
          <GlowButton
            variant={!showActive ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleActiveToggle(false)}
          >
            Nieaktywni
          </GlowButton>
        </div>
        <span className="text-sm text-aether-text-muted ml-auto">
          {total} klientów
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-aether-border overflow-hidden bg-aether-surface backdrop-blur-xl">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-aether-elevated border-b border-aether-border"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-aether-text-secondary"
                    style={header.column.getSize() ? { width: header.column.getSize() } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-aether-text-muted"
                >
                  Brak klientów
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-aether-border/50 hover:bg-aether-elevated/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-aether-text">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
