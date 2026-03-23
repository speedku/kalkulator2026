"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Trash2, ToggleLeft } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/aether/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteAccessCodeAction,
  updateAccessCodeAction,
} from "@/lib/actions/access-codes";
import { cn } from "@/lib/utils";

interface AccessCode {
  id: number;
  code: string;
  description: string | null;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiresAt: Date | null;
  createdAt: Date;
}

interface AccessCodesTableProps {
  codes: AccessCode[];
  total: number;
  page: number;
  perPage: number;
  search: string;
}

export function AccessCodesTable({
  codes,
  total,
  page,
  perPage,
  search,
}: AccessCodesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = React.useState(search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchValue) params.set("search", searchValue);
      router.push(`${pathname}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue, pathname, router]);

  const columns: ColumnDef<Record<string, unknown>>[] = [
    {
      key: "code",
      header: "Kod",
      mono: true,
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-mono font-semibold text-aether-text">{val as string}</p>
          {(row.description as string | null) && (
            <p className="text-xs text-aether-text-muted">{row.description as string}</p>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (val) => (
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            val
              ? "bg-aether-emerald/20 text-aether-emerald border-aether-emerald/30"
              : "bg-aether-rose/20 text-aether-rose border-aether-rose/30"
          )}
        >
          {val ? "aktywny" : "nieaktywny"}
        </Badge>
      ),
    },
    {
      key: "uses",
      header: "Użycia",
      render: (_, row) => {
        const current = row.currentUses as number;
        const max = row.maxUses as number;
        const pct = max > 0 ? (current / max) * 100 : 0;
        return (
          <div className="space-y-1 min-w-[80px]">
            <div className="flex justify-between text-xs text-aether-text-secondary">
              <span>{current}</span>
              <span>{max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-aether-elevated overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct >= 100
                    ? "bg-aether-rose"
                    : pct >= 80
                    ? "bg-amber-500"
                    : "bg-aether-emerald"
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "expiresAt",
      header: "Wygasa",
      render: (val) =>
        val ? (
          <span className="text-xs text-aether-text-secondary font-mono">
            {new Date(val as string).toLocaleDateString("pl-PL")}
          </span>
        ) : (
          <span className="text-xs text-aether-text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="p-1.5 rounded hover:bg-aether-elevated transition-colors">
              <MoreHorizontal className="h-4 w-4 text-aether-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-aether-elevated border-aether-border"
          >
            <DropdownMenuItem
              onClick={async () => {
                const fd = new FormData();
                fd.set("id", String(row.id));
                fd.set("isActive", row.isActive ? "false" : "true");
                await updateAccessCodeAction({}, fd);
              }}
              className="flex items-center gap-2 text-aether-text text-sm"
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              {row.isActive ? "Dezaktywuj" : "Aktywuj"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const fd = new FormData();
                fd.set("id", String(row.id));
                await deleteAccessCodeAction({}, fd);
              }}
              className="flex items-center gap-2 text-aether-rose text-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Usuń (dezaktywuj)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tableData = codes.map((c) => ({
    id: c.id as unknown,
    code: c.code as unknown,
    description: c.description as unknown,
    isActive: c.isActive as unknown,
    maxUses: c.maxUses as unknown,
    currentUses: c.currentUses as unknown,
    uses: null as unknown,
    expiresAt: c.expiresAt as unknown,
    createdAt: c.createdAt as unknown,
    actions: null as unknown,
  })) as unknown as Record<string, unknown>[];

  return (
    <DataTable
      columns={columns}
      data={tableData}
      total={total}
      page={page}
      perPage={perPage}
      searchValue={searchValue}
      searchPlaceholder="Szukaj po kodzie..."
      onSearchChange={setSearchValue}
      onPageChange={(p) => {
        const params = new URLSearchParams();
        if (searchValue) params.set("search", searchValue);
        params.set("page", String(p));
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}
