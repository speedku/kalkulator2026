"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast:
              "bg-aether-elevated border border-aether-border text-aether-text",
            description: "text-aether-text-secondary",
          },
        }}
      />
    </SessionProvider>
  );
}
