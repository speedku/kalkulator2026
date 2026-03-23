import NextAuth from "next-auth";
// CRITICAL: Import ONLY from auth.config.ts (Edge-safe), NOT from auth.ts
// Importing from auth.ts would pull in bcryptjs and Prisma which crash Edge Runtime
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Match all paths EXCEPT:
    // - api/auth (Auth.js catch-all route)
    // - _next/static (Next.js static assets)
    // - _next/image (Next.js image optimization)
    // - favicon.ico
    // - auth pages (login, register, forgot-password, reset-password)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password).*)",
  ],
};
