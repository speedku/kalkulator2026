import { z } from "zod";

export const permissionEntrySchema = z.object({
  pageId: z.string().min(1, "ID strony jest wymagane"),
  canAccess: z.boolean(),
  canSee: z.boolean(),
});

export const updatePermissionsSchema = z.object({
  userId: z.number().int().positive("ID użytkownika musi być liczbą dodatnią"),
  permissions: z.array(permissionEntrySchema),
});

export type PermissionEntry = z.infer<typeof permissionEntrySchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
