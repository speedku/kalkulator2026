"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GlowButton } from "@/components/aether/glow-button";
import { BulkActionBar } from "./bulk-action-bar";
import type { ProductListItem, ProductCategory, ProductGroup } from "@/types/products";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  data: ProductListItem[];
  total: number;
  categories: ProductCategory[];
  groups: ProductGroup[];
  currentPage: number;
  currentSearch: string;
  currentCategory: string;
  currentGroup: string;
}

export function ProductsTable({
  data,
  total,
  categories,
  groups,
  currentPage,
  currentSearch,
  currentCategory,
  currentGroup,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Debounced search
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(value: string) {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", value);
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  }

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleGroupChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("group", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const columns: ColumnDef<ProductListItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-aether-border bg-aether-elevated"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-aether-border bg-aether-elevated"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.imageUrl ? (
          <Image
            src={row.original.imageUrl}
            width={40}
            height={40}
            alt=""
            className="rounded object-contain"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-aether-elevated flex items-center justify-center text-aether-text-muted text-xs">
            —
          </div>
        ),
      size: 56,
    },
    {
      accessorKey: "name",
      header: "Nazwa",
      cell: ({ row }) => (
        <Link
          href={`/products/${row.original.id}`}
          className="text-aether-blue hover:text-aether-blue/80 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-aether-text-secondary">
          {row.original.sku ?? "—"}
        </span>
      ),
    },
    {
      id: "category",
      header: "Kategoria",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.category?.name ?? "—"}</span>
      ),
    },
    {
      id: "group",
      header: "Grupa",
      cell: ({ row }) => {
        const group = row.original.group;
        if (!group) return <span className="text-aether-text-muted">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${group.backgroundColor}33`, border: `1px solid ${group.backgroundColor}66` }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: group.backgroundColor }}
            />
            {group.name}
          </span>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Cena",
      cell: ({ row }) =>
        row.original.price != null ? (
          <span className="font-mono text-sm">
            {Number(row.original.price).toFixed(2)} zł
          </span>
        ) : (
          <span className="text-aether-text-muted">—</span>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            Aktywny
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            Nieaktywny
          </span>
        ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    rowCount: total,
    state: {
      pagination: { pageIndex: currentPage - 1, pageSize: 20 },
      rowSelection,
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize: 20 })
          : updater;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(next.pageIndex + 1));
      router.push(`${pathname}?${params.toString()}`);
    },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => String(row.id),
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Szukaj po nazwie lub SKU..."
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
        <select
          defaultValue={currentCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={cn(
            "h-9 px-3 text-sm rounded-lg",
            "bg-aether-elevated border border-aether-border",
            "text-aether-text",
            "focus:outline-none focus:border-aether-border-glow",
            "transition-all duration-200"
          )}
        >
          <option value="">Wszystkie kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          defaultValue={currentGroup}
          onChange={(e) => handleGroupChange(e.target.value)}
          className={cn(
            "h-9 px-3 text-sm rounded-lg",
            "bg-aether-elevated border border-aether-border",
            "text-aether-text",
            "focus:outline-none focus:border-aether-border-glow",
            "transition-all duration-200"
          )}
        >
          <option value="">Wszystkie grupy</option>
          {groups.map((grp) => (
            <option key={grp.id} value={String(grp.id)}>
              {grp.name}
            </option>
          ))}
        </select>
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
                  Brak produktów
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-aether-text-secondary">
          <span>
            Strona {currentPage} z {totalPages} ({total} produktów)
          </span>
          <div className="flex items-center gap-2">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Poprzednia
            </GlowButton>
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Następna
            </GlowButton>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        rowSelection={rowSelection}
        onClear={() => setRowSelection({})}
      />
    </div>
  );
}
