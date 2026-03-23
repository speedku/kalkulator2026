import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleMobileSidebar: () =>
        set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
      closeMobileSidebar: () => set({ sidebarMobileOpen: false }),
    }),
    {
      name: "kalkulator2026-ui",
      // Only persist the collapsed state, not the mobile open state
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
