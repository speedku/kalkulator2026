import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            isActive: true,
            emailVerified: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;
        if (!user.emailVerified) return null;

        // AUTH-07: Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcryptjs.compare(password, user.passwordHash);

        if (!valid) {
          // Increment failed attempts, lock account after 5 failures (15 min)
          const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              ...(newAttempts >= 5
                ? {
                    lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
                  }
                : {}),
            },
          });
          return null;
        }

        // Reset on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLogin: new Date(),
          },
        });

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role as "admin" | "user",
        };
      },
    }),
  ],
});
