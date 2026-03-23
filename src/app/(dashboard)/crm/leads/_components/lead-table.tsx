"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { deleteLeadAction } from "@/lib/actions/crm";
import { GlowButton } from "@/components/aether/glow-button";
import { LeadForm } from "./lead-form";
import { cn } from "@/lib/utils";
import type { LeadRow } from "@/lib/dal/crm";

interface LeadTableProps {
  leads: LeadRow[];
}

const statusColors: Record<string, string> = {
  new: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  converted: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  lost: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const statusLabels: Record<string, string> = {
  new: "Nowy",
  contacted: "Skontaktowany",
  qualified: "Zakwalifikowany",
  converted: "Przekonwertowany",
  lost: "Utracony",
};

export function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [editingLead, setEditingLead] = React.useState<LeadRow | null>(null);

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Czy na pewno chcesz usunąć lead "${name}"?`)) return;
    const result = await deleteLeadAction(id);
    if (result.error) {
      alert(result.error);
    }
  }

  const currentStatus = searchParams.get("status") ?? "";

  const columns: ColumnDef<LeadRow>[] = [
    {
      id: "name",
      header: "Imię i nazwisko",
      cell: ({ row }) => (
        <span className="font-medium text-aether-text">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "company",
      header: "Firma",
      cell: ({ row }) => (
        <span className="text-sm text-aether-text-secondary">
          {row.original.company ?? "—"}
        </span>
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
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            statusColors[row.original.status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
          }`}
        >
          {statusLabels[row.original.status] ?? row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Źródło",
      cell: ({ row }) => (
        <span className="text-sm text-aether-text-secondary">
          {row.original.source ?? "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-sm">{format(new Date(row.original.createdAt), "dd.MM.yyyy")}</span>
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
            onClick={() => setEditingLead(row.original)}
          >
            Edytuj
          </GlowButton>
          <GlowButton
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.original.id, row.original.name)}
          >
            Usuń
          </GlowButton>
        </div>
      ),
      size: 160,
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="space-y-4">
      {/* Edit modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl">
            <LeadForm
              mode="edit"
              lead={editingLead}
              onClose={() => setEditingLead(null)}
              onSuccess={() => setEditingLead(null)}
            />
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <select
          defaultValue={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={cn(
            "h-9 px-3 text-sm rounded-lg",
            "bg-aether-elevated border border-aether-border",
            "text-aether-text",
            "focus:outline-none focus:border-aether-border-glow",
            "transition-all duration-200"
          )}
        >
          <option value="">Wszystkie statusy</option>
          <option value="new">Nowy</option>
          <option value="contacted">Skontaktowany</option>
          <option value="qualified">Zakwalifikowany</option>
          <option value="converted">Przekonwertowany</option>
          <option value="lost">Utracony</option>
        </select>
        <span className="text-sm text-aether-text-muted">
          {leads.length} leadów
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
                  Brak leadów
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
