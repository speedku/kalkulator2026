"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { createWindykacjaCaseAction } from "@/lib/actions/windykacja";
import { CaseStatusBadge } from "./case-status-badge";
import type { AgingRow } from "@/lib/dal/windykacja";

interface OverdueTableProps {
  rows: AgingRow[];
}

const BUCKET_BADGE: Record<string, string> = {
  "0-30": "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "31-60": "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "61-90": "bg-red-500/20 text-red-300 border border-red-500/30",
  "90+": "bg-red-900/30 text-red-400 border border-red-700/30",
};

const BUCKET_LABELS: Record<string, string> = {
  "0-30": "0–30 dni",
  "31-60": "31–60 dni",
  "61-90": "61–90 dni",
  "90+": "90+ dni",
};

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

const colHelper = createColumnHelper<AgingRow>();

export function OverdueTable({ rows }: OverdueTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "daysOverdue", desc: true },
  ]);
  const [pending, startTransition] = useTransition();
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);

  function handleOpenCase(invoiceId: number) {
    setLoadingInvoiceId(invoiceId);
    startTransition(async () => {
      await createWindykacjaCaseAction(invoiceId);
      router.refresh();
      setLoadingInvoiceId(null);
    });
  }

  const columns = [
    colHelper.accessor("invoiceNumber", {
      header: "Nr faktury",
      cell: (info) => {
        const row = info.row.original;
        if (row.caseId) {
          return (
            <Link
              href={`/windykacja/${row.caseId}`}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              {row.invoiceNumber}
            </Link>
          );
        }
        return <span className="text-gray-300">{row.invoiceNumber}</span>;
      },
    }),
    colHelper.accessor("customerName", {
      header: "Klient",
      cell: (info) => (
        <span className="text-gray-200">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor("customerNip", {
      header: "NIP",
      cell: (info) => (
        <span className="font-mono text-xs text-gray-400">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),
    colHelper.accessor("totalGross", {
      header: "Kwota",
      cell: (info) => (
        <span className="font-mono text-sm text-white">
          {formatPLN(info.getValue())}
        </span>
      ),
    }),
    colHelper.accessor("dueAt", {
      header: "Termin płatności",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-sm text-gray-300">
            {v ? format(v, "dd.MM.yyyy", { locale: pl }) : "—"}
          </span>
        );
      },
    }),
    colHelper.accessor("daysOverdue", {
      header: "Dni po terminie",
      cell: (info) => (
        <span className="font-bold text-red-400">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor("bucket", {
      header: "Przedział",
      cell: (info) => {
        const b = info.getValue();
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BUCKET_BADGE[b] ?? ""}`}
          >
            {BUCKET_LABELS[b] ?? b}
          </span>
        );
      },
    }),
    colHelper.accessor("caseStatus", {
      header: "Status sprawy",
      cell: (info) => {
        const s = info.getValue();
        return s ? <CaseStatusBadge status={s} /> : <span className="text-gray-500 text-xs">—</span>;
      },
    }),
    colHelper.display({
      id: "actions",
      header: "Akcje",
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <a
              href={`/kalkulator2026/api/windykacja/pdf/${row.id}`}
              download
              className="rounded px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors"
            >
              PDF
            </a>
            {!row.caseId && (
              <button
                type="button"
                disabled={pending && loadingInvoiceId === row.id}
                onClick={() => handleOpenCase(row.id)}
                className="rounded px-2 py-1 text-xs text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:bg-sky-500/10 transition-colors disabled:opacity-50"
              >
                {pending && loadingInvoiceId === row.id
                  ? "..."
                  : "Otwórz sprawę"}
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-gray-400">Brak przeterminowanych faktur</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-white/10">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc"
                    ? " ↑"
                    : header.column.getIsSorted() === "desc"
                    ? " ↓"
                    : ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                i % 2 === 0 ? "" : "bg-white/[0.02]"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
