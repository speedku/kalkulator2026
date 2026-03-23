export type UserRole = "admin" | "user";

export interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
}
