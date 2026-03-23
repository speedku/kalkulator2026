"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Edit, ToggleLeft, Eye } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/aether/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleUserActiveAction } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
}

interface UsersTableProps {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  search: string;
}

function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} godz. temu`;
  const days = Math.floor(hr / 24);
  return `${days} dni temu`;
}

export function UsersTable({
  users,
  total,
  page,
  perPage,
  search,
}: UsersTableProps) {
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
      key: "name",
      header: "Imię i nazwisko",
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-aether-text">{(row.name as string) || "—"}</p>
          <p className="text-xs text-aether-text-muted">{row.email as string}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rola",
      render: (val) => (
        <Badge
          className={cn(
            "text-xs font-mono",
            val === "admin"
              ? "bg-aether-purple/20 text-aether-purple border-aether-purple/30"
              : "bg-aether-blue/20 text-aether-blue border-aether-blue/30"
          )}
          variant="outline"
        >
          {val as string}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (val) => (
        <Badge
          className={cn(
            "text-xs",
            val
              ? "bg-aether-emerald/20 text-aether-emerald border-aether-emerald/30"
              : "bg-aether-rose/20 text-aether-rose border-aether-rose/30"
          )}
          variant="outline"
        >
          {val ? "aktywny" : "nieaktywny"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Ostatnie logowanie",
      render: (val) => (
        <span className="text-aether-text-secondary text-xs">
          {relativeTime(val as Date | null)}
        </span>
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
              onClick={() => router.push(`/settings/users/${row.id}`)}
              className="flex items-center gap-2 text-aether-text text-sm cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/settings/users/${row.id}`)}
              className="flex items-center gap-2 text-aether-text text-sm cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              Uprawnienia
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                const fd = new FormData();
                fd.set("id", String(row.id));
                await toggleUserActiveAction({}, fd);
              }}
              className="flex items-center gap-2 text-aether-text text-sm cursor-pointer"
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              {row.isActive ? "Dezaktywuj" : "Aktywuj"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tableData = users.map((u) => ({
    id: u.id as unknown,
    name: u.name as unknown,
    email: u.email as unknown,
    role: u.role as unknown,
    isActive: u.isActive as unknown,
    lastLogin: u.lastLogin as unknown,
    createdAt: u.createdAt as unknown,
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
      searchPlaceholder="Szukaj po imieniu lub emailu..."
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
