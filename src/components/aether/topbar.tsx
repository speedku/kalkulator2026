"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenuButton } from "./sidebar-client";

interface TopbarProps {
  user: { name: string; role: string } | null;
  className?: string;
}

export function Topbar({ user, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center gap-3 border-b border-aether-border bg-aether-sidebar px-4",
        className
      )}
    >
      {/* Mobile hamburger */}
      <MobileMenuButton />

      {/* App title (mobile) */}
      <span className="font-display text-sm font-semibold text-aether-text lg:hidden">
        Kalkulator 2026
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section: user info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span
            className={cn(
              "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              user.role === "admin"
                ? "bg-aether-purple/20 text-aether-purple"
                : "bg-aether-blue/20 text-aether-blue"
            )}
          >
            {user.role === "admin" ? "Admin" : "Użytkownik"}
          </span>

          {/* User name */}
          <span className="hidden sm:block text-sm text-aether-text-secondary">
            {user.name}
          </span>

          {/* Avatar */}
          <div className="flex size-8 items-center justify-center rounded-full bg-aether-blue/20 text-xs font-semibold text-aether-blue">
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Logout button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-aether-text-secondary transition-colors hover:bg-aether-rose/10 hover:text-aether-rose"
            title="Wyloguj się"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:block">Wyloguj</span>
          </button>
        </div>
      )}
    </header>
  );
}
