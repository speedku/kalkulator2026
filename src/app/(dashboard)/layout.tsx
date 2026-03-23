import { requireAuth } from "@/lib/dal/auth";
import { SidebarNav } from "@/components/aether/sidebar-nav";
import { Topbar } from "@/components/aether/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard: redirect to /login if not authenticated
  const user = await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-aether-void">
      {/* Sidebar: server component (handles RBAC filtering) */}
      <SidebarNav />

      {/* Main area: topbar + content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{ name: user.name ?? "Użytkownik", role: user.role }}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
