import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./auth";
import { logActivity } from "./activity-log";

export interface GetUsersParams {
  search?: string;
  page?: number;
  perPage?: number;
  role?: string;
}

export interface GetUsersResult {
  users: Array<{
    id: number;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    lastLogin: Date | null;
  }>;
  total: number;
  page: number;
  perPage: number;
}

export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResult> {
  await requireAdmin();

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: {
    role?: string;
    OR?: Array<{ name?: { contains: string }; email?: { contains: string } }>;
  } = {};

  if (params.role) {
    where.role = params.role;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, perPage };
}

export async function getUserById(id: number) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
      permissions: {
        select: {
          pageId: true,
          canAccess: true,
          canSee: true,
        },
      },
      activityLogs: {
        select: {
          id: true,
          activityType: true,
          action: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return user;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
}) {
  const admin = await requireAdmin();

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  await logActivity({
    activityType: "user",
    action: "create",
    description: `Admin ${admin.email} utworzył użytkownika ${user.email}`,
    entityType: "user",
    entityId: user.id,
    entityName: user.email,
  }).catch(() => {});

  return user;
}

export async function updateUser(
  id: number,
  data: {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }
) {
  const admin = await requireAdmin();

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await logActivity({
    activityType: "user",
    action: "update",
    description: `Admin ${admin.email} zaktualizował użytkownika ${user.email}`,
    entityType: "user",
    entityId: user.id,
    entityName: user.email,
    metadata: data as Record<string, unknown>,
  }).catch(() => {});

  return user;
}

export async function toggleUserActive(id: number) {
  const admin = await requireAdmin();

  const current = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, email: true },
  });

  if (!current) throw new Error("Użytkownik nie istnieje");

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !current.isActive },
    select: { id: true, email: true, isActive: true },
  });

  await logActivity({
    activityType: "user",
    action: "update",
    description: `Admin ${admin.email} ${user.isActive ? "aktywował" : "dezaktywował"} użytkownika ${user.email}`,
    entityType: "user",
    entityId: user.id,
    entityName: user.email,
  }).catch(() => {});

  return user;
}

export async function deleteUser(id: number) {
  const admin = await requireAdmin();

  // Soft delete — never hard delete due to FK constraints
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, email: true },
  });

  await logActivity({
    activityType: "user",
    action: "delete",
    description: `Admin ${admin.email} dezaktywował (soft delete) użytkownika ${user.email}`,
    entityType: "user",
    entityId: user.id,
    entityName: user.email,
  }).catch(() => {});

  return user;
}
