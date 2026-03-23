// RBAC helper constants
// Page IDs match the existing user_permissions.page_id values in the database

export type PageId =
  | "admin-panel"
  | "admin-products"
  | "admin-deliveries-hub"
  | "admin-price-lists"
  | "admin-quotations"
  | "admin-notepad"
  | "admin-users"
  | "admin-settings"
  | "admin-audit-log"
  | "admin-access-codes"
  | "admin-permissions"
  | "admin-reports"
  | "admin-containers"
  | string; // Allow arbitrary page IDs for future extensibility

/**
 * Pages that require admin role (not just page permission).
 * Admin-only pages are inaccessible even if a user has explicit permissions.
 */
export const ADMIN_ONLY_PAGES: string[] = [
  "admin-users",
  "admin-settings",
  "admin-audit-log",
  "admin-access-codes",
  "admin-permissions",
];

/**
 * Check if a page ID requires admin role.
 */
export function isAdminPage(pageId: string): boolean {
  return ADMIN_ONLY_PAGES.includes(pageId);
}
