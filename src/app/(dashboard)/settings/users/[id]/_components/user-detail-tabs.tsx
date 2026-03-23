"use client";

import * as React from "react";
import { useActionState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/aether/glow-button";
import { updateUserAction } from "@/lib/actions/users";
import { updatePermissionsAction } from "@/lib/actions/permissions";
import { cn } from "@/lib/utils";

interface Permission {
  pageId: string;
  canAccess: boolean;
  canSee: boolean;
}

interface ActivityEntry {
  id: number;
  activityType: string;
  action: string;
  description: string;
  createdAt: Date;
}

interface UserDetailTabsProps {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
    activityLogs: ActivityEntry[];
  };
  permissions: Permission[];
  availablePages: string[];
}

const inputClass = cn(
  "w-full h-10 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} godz. temu`;
  const days = Math.floor(hr / 24);
  return `${days} dni temu`;
}

export function UserDetailTabs({
  user,
  permissions,
  availablePages,
}: UserDetailTabsProps) {
  const [editState, editAction] = useActionState(updateUserAction, {});
  const [permState, permAction] = useActionState(updatePermissionsAction, {});
  const [role, setRole] = React.useState(user.role);
  const [localPerms, setLocalPerms] = React.useState<Permission[]>(permissions);

  function togglePerm(
    pageId: string,
    field: "canAccess" | "canSee",
    value: boolean
  ) {
    setLocalPerms((prev) =>
      prev.map((p) => (p.pageId === pageId ? { ...p, [field]: value } : p))
    );
  }

  return (
    <Tabs defaultValue="data">
      <TabsList className="bg-aether-elevated border border-aether-border rounded-lg p-1 mb-6">
        <TabsTrigger
          value="data"
          className="text-aether-text-secondary data-[state=active]:text-aether-text data-[state=active]:bg-aether-void rounded-md"
        >
          Dane
        </TabsTrigger>
        <TabsTrigger
          value="permissions"
          className="text-aether-text-secondary data-[state=active]:text-aether-text data-[state=active]:bg-aether-void rounded-md"
        >
          Uprawnienia
        </TabsTrigger>
        <TabsTrigger
          value="activity"
          className="text-aether-text-secondary data-[state=active]:text-aether-text data-[state=active]:bg-aether-void rounded-md"
        >
          Aktywność
        </TabsTrigger>
      </TabsList>

      {/* Edit form tab */}
      <TabsContent value="data">
        <form action={editAction} className="space-y-4 max-w-md">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">
              Imię i nazwisko
            </label>
            <input
              name="name"
              defaultValue={user.name ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-aether-text-secondary">Rola</label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v !== null) setRole(v);
              }}
            >
              <SelectTrigger className="h-10 bg-aether-elevated border-aether-border text-aether-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-aether-elevated border-aether-border">
                <SelectItem value="user" className="text-aether-text">
                  Użytkownik
                </SelectItem>
                <SelectItem value="admin" className="text-aether-text">
                  Administrator
                </SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="role" value={role} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-aether-text-secondary">
              Konto aktywne
            </label>
            <input
              type="hidden"
              name="isActive"
              value={user.isActive ? "true" : "false"}
            />
          </div>
          {editState.error && (
            <p className="text-sm text-aether-rose">{editState.error}</p>
          )}
          {editState.success && (
            <p className="text-sm text-aether-emerald">Zapisano pomyślnie</p>
          )}
          <SubmitButton>Zapisz zmiany</SubmitButton>
        </form>
      </TabsContent>

      {/* Permissions tab */}
      <TabsContent value="permissions">
        <form action={permAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="hidden"
            name="permissions"
            value={JSON.stringify(localPerms)}
          />
          <div className="space-y-2">
            {availablePages.map((pageId) => {
              const perm = localPerms.find((p) => p.pageId === pageId) ?? {
                pageId,
                canAccess: false,
                canSee: true,
              };
              return (
                <div
                  key={pageId}
                  className="flex items-center justify-between p-3 rounded-lg bg-aether-elevated border border-aether-border"
                >
                  <span className="font-mono text-xs text-aether-text-secondary">
                    {pageId}
                  </span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-aether-text-muted">Dostęp</span>
                      <Switch
                        checked={perm.canAccess}
                        onCheckedChange={(v) =>
                          togglePerm(pageId, "canAccess", v)
                        }
                        className="data-[state=checked]:bg-aether-blue"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-aether-text-muted">Widoczny</span>
                      <Switch
                        checked={perm.canSee}
                        onCheckedChange={(v) => togglePerm(pageId, "canSee", v)}
                        className="data-[state=checked]:bg-aether-cyan"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {permState.error && (
            <p className="text-sm text-aether-rose">{permState.error}</p>
          )}
          {permState.success && (
            <p className="text-sm text-aether-emerald">Uprawnienia zapisane</p>
          )}
          <SubmitButton>Zapisz uprawnienia</SubmitButton>
        </form>
      </TabsContent>

      {/* Activity tab */}
      <TabsContent value="activity">
        <div className="space-y-2">
          {user.activityLogs.length === 0 ? (
            <p className="text-sm text-aether-text-muted py-8 text-center">
              Brak aktywności
            </p>
          ) : (
            user.activityLogs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-aether-elevated border border-aether-border"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs font-mono bg-aether-blue/10 text-aether-blue border-aether-blue/30"
                >
                  {entry.activityType}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aether-text">{entry.description}</p>
                  <p className="text-xs text-aether-text-muted mt-0.5">
                    {relativeTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
