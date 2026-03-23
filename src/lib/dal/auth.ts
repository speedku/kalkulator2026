import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Get the current authenticated user from the database.
 * Wrapped with React cache() to deduplicate requests within a single render.
 * Returns null if not authenticated or user is inactive.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

/**
 * Check if current user has access to a specific page.
 * Admin role always has access to all pages.
 * Uses existing user_permissions table (page_id + can_access model).
 */
export async function hasPageAccess(pageId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === "admin") return true;

  const permission = await prisma.userPermission.findUnique({
    where: { userId_pageId: { userId: user.id, pageId } },
    select: { canAccess: true },
  });
  return permission?.canAccess ?? false;
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require admin role. Redirects to /login if not authenticated,
 * throws 403 error if authenticated but not admin.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}
