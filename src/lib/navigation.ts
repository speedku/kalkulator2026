import {
  LayoutDashboard,
  Package,
  Truck,
  Ship,
  Calendar,
  Tags,
  FileText,
  StickyNote,
  Users,
  Shield,
  KeyRound,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem =
  | {
      type: "item";
      label: string;
      href: string;
      icon: LucideIcon;
      pageId: string;
    }
  | { type: "separator" };

export const sidebarItems: NavItem[] = [
  {
    type: "item",
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    pageId: "admin-panel",
  },
  {
    type: "item",
    label: "Produkty",
    href: "/products",
    icon: Package,
    pageId: "admin-products",
  },
  {
    type: "item",
    label: "Kontenery",
    href: "/containers",
    icon: Ship,
    pageId: "admin-containers",
  },
  {
    type: "item",
    label: "Dostawy krajowe",
    href: "/deliveries",
    icon: Truck,
    pageId: "admin-deliveries",
  },
  {
    type: "item",
    label: "Kalendarz dostaw",
    href: "/delivery-calendar",
    icon: Calendar,
    pageId: "admin-delivery-calendar",
  },
  {
    type: "item",
    label: "Cenniki",
    href: "/price-lists",
    icon: Tags,
    pageId: "admin-price-lists",
  },
  {
    type: "item",
    label: "Wyceny",
    href: "/quotations",
    icon: FileText,
    pageId: "admin-quotations",
  },
  {
    type: "item",
    label: "Notatnik",
    href: "/notepad",
    icon: StickyNote,
    pageId: "admin-notepad",
  },
  {
    type: "separator",
  },
  {
    type: "item",
    label: "Użytkownicy",
    href: "/settings/users",
    icon: Users,
    pageId: "admin-users",
  },
  {
    type: "item",
    label: "Uprawnienia",
    href: "/settings/permissions",
    icon: Shield,
    pageId: "admin-permissions",
  },
  {
    type: "item",
    label: "Kody dostępu",
    href: "/settings/access-codes",
    icon: KeyRound,
    pageId: "admin-access-codes",
  },
  {
    type: "item",
    label: "Log aktywności",
    href: "/audit-log",
    icon: ScrollText,
    pageId: "admin-audit-log",
  },
  {
    type: "item",
    label: "Ustawienia",
    href: "/settings",
    icon: Settings,
    pageId: "admin-settings",
  },
];
