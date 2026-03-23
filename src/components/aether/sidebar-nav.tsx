import { getCurrentUser, hasPageAccess } from "@/lib/dal/auth";
import { sidebarItems, type NavItem } from "@/lib/navigation";
import { SidebarClient } from "./sidebar-client";

/**
 * SidebarNav — Server Component.
 *
 * Fetches current user and filters navigation items based on RBAC.
 * Admin sees everything; regular users see only items where hasPageAccess(pageId) is true.
 * Passes filtered items to SidebarClient for interactivity.
 */
export async function SidebarNav() {
  const user = await getCurrentUser();

  let filteredItems: NavItem[];

  if (!user) {
    filteredItems = [];
  } else if (user.role === "admin") {
    // Admin sees all items
    filteredItems = sidebarItems;
  } else {
    // Regular user: filter based on user_permissions
    const results: NavItem[] = [];

    for (const item of sidebarItems) {
      if (item.type === "separator") {
        // Include separator only if at least one item before it was included
        // We'll handle separator trimming on the client
        results.push(item);
        continue;
      }

      const canSee = await hasPageAccess(item.pageId);
      if (canSee) {
        results.push(item);
      }
    }

    // Remove leading and trailing separators
    filteredItems = results
      .filter((item, idx, arr) => {
        if (item.type !== "separator") return true;
        const prev = arr[idx - 1];
        const next = arr[idx + 1];
        // Remove if first item, last item, or surrounded by separators
        if (!prev || !next) return false;
        if (prev.type === "separator") return false;
        return true;
      });
  }

  return (
    <SidebarClient
      items={filteredItems}
      user={user ? { name: user.name ?? "Użytkownik", role: user.role } : null}
    />
  );
}
