"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/aether/glow-button";
import { updatePermissionsAction } from "@/lib/actions/permissions";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
}

interface Permission {
  pageId: string;
  canAccess: boolean;
  canSee: boolean;
}

interface PermissionsMatrixProps {
  users: User[];
  availablePages: string[];
  selectedUserId: number | null;
  selectedUserPermissions: Permission[] | null;
}

export function PermissionsMatrix({
  users,
  availablePages,
  selectedUserId,
  selectedUserPermissions,
}: PermissionsMatrixProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, action] = useActionState(updatePermissionsAction, {});
  const [localPerms, setLocalPerms] = React.useState<Permission[]>(
    selectedUserPermissions ?? []
  );

  React.useEffect(() => {
    setLocalPerms(selectedUserPermissions ?? []);
  }, [selectedUserPermissions]);

  function selectUser(id: number) {
    router.push(`${pathname}?userId=${id}`);
  }

  function togglePerm(
    pageId: string,
    field: "canAccess" | "canSee",
    value: boolean
  ) {
    setLocalPerms((prev) => {
      const existing = prev.find((p) => p.pageId === pageId);
      if (existing) {
        return prev.map((p) =>
          p.pageId === pageId ? { ...p, [field]: value } : p
        );
      }
      return [
        ...prev,
        {
          pageId,
          canAccess: field === "canAccess" ? value : false,
          canSee: field === "canSee" ? value : true,
        },
      ];
    });
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6">
      {/* User list */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-aether-text-secondary uppercase tracking-wider mb-3">
          Wybierz użytkownika
        </p>
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => selectUser(user.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
              selectedUserId === user.id
                ? "bg-aether-blue/20 border border-aether-blue/40 text-aether-text"
                : "hover:bg-aether-elevated border border-transparent text-aether-text-secondary"
            )}
          >
            <p className="text-sm font-medium">{user.name ?? user.email}</p>
            <p className="text-xs text-aether-text-muted">{user.email}</p>
          </button>
        ))}
      </div>

      {/* Permission grid */}
      <div>
        {!selectedUserId ? (
          <div className="flex items-center justify-center h-48 text-aether-text-muted text-sm">
            Wybierz użytkownika z listy po lewej
          </div>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="userId" value={selectedUserId} />
            <input
              type="hidden"
              name="permissions"
              value={JSON.stringify(
                availablePages.map((pageId) => {
                  const perm = localPerms.find((p) => p.pageId === pageId);
                  return {
                    pageId,
                    canAccess: perm?.canAccess ?? false,
                    canSee: perm?.canSee ?? true,
                  };
                })
              )}
            />
            <div className="grid grid-cols-[1fr_auto_auto] gap-y-1 gap-x-6 items-center">
              <p className="text-xs font-semibold text-aether-text-secondary uppercase tracking-wider">
                Strona
              </p>
              <p className="text-xs font-semibold text-aether-text-secondary uppercase tracking-wider text-center">
                Dostęp
              </p>
              <p className="text-xs font-semibold text-aether-text-secondary uppercase tracking-wider text-center">
                Widoczny
              </p>
              {availablePages.map((pageId) => {
                const perm = localPerms.find((p) => p.pageId === pageId);
                const canAccess = perm?.canAccess ?? false;
                const canSee = perm?.canSee ?? true;
                return (
                  <React.Fragment key={pageId}>
                    <div className="py-2.5 px-3 rounded-lg bg-aether-elevated/50 font-mono text-xs text-aether-text-secondary">
                      {pageId}
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={canAccess}
                        onCheckedChange={(v) =>
                          togglePerm(pageId, "canAccess", v)
                        }
                        className="data-[state=checked]:bg-aether-blue"
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={canSee}
                        onCheckedChange={(v) =>
                          togglePerm(pageId, "canSee", v)
                        }
                        className="data-[state=checked]:bg-aether-cyan"
                      />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            {state.error && (
              <p className="text-sm text-aether-rose">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-aether-emerald">Uprawnienia zapisane</p>
            )}
            <SubmitButton>Zapisz uprawnienia</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
