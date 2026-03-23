"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";
import { type NavItem } from "@/lib/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarClientProps {
  items: NavItem[];
  user: { name: string; role: string } | null;
}

export function SidebarClient({ items, user }: SidebarClientProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, closeMobileSidebar } =
    useUIStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
      {items.map((item, idx) => {
        if (item.type === "separator") {
          return (
            <div
              key={`sep-${idx}`}
              className="mx-3 my-2 h-px bg-aether-border"
            />
          );
        }

        const Icon = item.icon;
        const active = isActive(item.href);

        if (sidebarCollapsed) {
          return (
            <TooltipProvider key={item.href} delay={300}>
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    "mx-2 flex items-center justify-center rounded-lg p-2.5 text-sm transition-all duration-200 w-full",
                    active
                      ? "bg-aether-blue/10 text-aether-blue border-l-2 border-aether-blue"
                      : "text-aether-text-secondary hover:bg-aether-elevated hover:text-aether-text"
                  )}
                  render={
                    <Link href={item.href} onClick={closeMobileSidebar} />
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="sr-only">{item.label}</span>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileSidebar}
            className={cn(
              "mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
              active
                ? "bg-aether-blue/10 text-aether-blue border-l-2 border-aether-blue"
                : "text-aether-text-secondary hover:bg-aether-elevated hover:text-aether-text"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const userSection = user && (
    <div className="border-t border-aether-border p-3">
      {sidebarCollapsed ? (
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              className="flex w-full items-center justify-center rounded-lg p-2.5 text-aether-text-secondary transition-colors hover:bg-aether-rose/10 hover:text-aether-rose"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-5" />
              <span className="sr-only">Wyloguj</span>
            </TooltipTrigger>
            <TooltipContent side="right">Wyloguj</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-aether-blue/20 text-xs font-semibold text-aether-blue">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-aether-text">
              {user.name}
            </span>
            <span className="text-xs text-aether-text-muted capitalize">
              {user.role === "admin" ? "Administrator" : "Użytkownik"}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-aether-text-muted transition-colors hover:bg-aether-rose/10 hover:text-aether-rose"
            title="Wyloguj"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </div>
  );

  const collapseButton = (
    <div className="border-b border-aether-border p-3">
      {sidebarCollapsed ? (
        <div className="flex items-center justify-center">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center rounded-lg p-2 text-aether-text-muted transition-colors hover:bg-aether-elevated hover:text-aether-text"
            title="Rozwiń sidebar"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold text-aether-text">
            Kalkulator 2026
          </span>
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center rounded-lg p-1.5 text-aether-text-muted transition-colors hover:bg-aether-elevated hover:text-aether-text"
            title="Zwiń sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-aether-sidebar border-r border-aether-border transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {collapseButton}
        {navContent}
        {userSection}
      </aside>

      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileSidebar}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 flex h-full w-60 flex-col bg-aether-sidebar border-r border-aether-border">
            <div className="flex items-center justify-between border-b border-aether-border p-3">
              <span className="font-display text-sm font-semibold text-aether-text">
                Kalkulator 2026
              </span>
              <button
                onClick={closeMobileSidebar}
                className="flex items-center justify-center rounded-lg p-1.5 text-aether-text-muted transition-colors hover:bg-aether-elevated hover:text-aether-text"
              >
                <X className="size-4" />
              </button>
            </div>
            {navContent}
            {userSection}
          </aside>
        </div>
      )}
    </>
  );
}

/**
 * MobileMenuButton — renders the hamburger for mobile.
 * Used in Topbar to open the mobile sidebar.
 */
export function MobileMenuButton() {
  const { toggleMobileSidebar } = useUIStore();
  return (
    <button
      onClick={toggleMobileSidebar}
      className="flex lg:hidden items-center justify-center rounded-lg p-2 text-aether-text-secondary transition-colors hover:bg-aether-elevated hover:text-aether-text"
      aria-label="Otwórz menu"
    >
      <Menu className="size-5" />
    </button>
  );
}
