"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Building,
  Hotel,
  Globe,
  Flag,
  GitBranch,
  FolderTree,
  Users,
  Shield,
  Contact,
  UserPlus,
  Briefcase,
  Calendar,
  Phone,
  FileText,
  UserCircle,
  MapPin,
  Menu,
  ChevronLeft,
  ScrollText,
  ShieldCheck,
  BarChart3,
  CheckSquare,
  Package,
  type LucideIcon,
} from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Zustand store -- sidebar expanded / collapsed state
// ---------------------------------------------------------------------------
interface SidebarState {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      toggle: () => set((s) => ({ expanded: !s.expanded })),
      setExpanded: (value: boolean) => set({ expanded: value }),
    }),
    { name: "sidebar-state" }
  )
);

// ---------------------------------------------------------------------------
// Navigation modules
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Business Lines", icon: Building2, href: "/business-lines" },
  { label: "Regions", icon: Globe, href: "/regions" },
  { label: "Countries", icon: Flag, href: "/countries" },
  { label: "Branches", icon: GitBranch, href: "/branches" },
  { label: "Departments", icon: FolderTree, href: "/departments" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Roles", icon: Shield, href: "/roles" },
  { label: "Contacts", icon: Contact, href: "/contacts" },
  { label: "Corporate Leads", icon: Building2, href: "/leads/corporate" },
  { label: "Hotel Leads", icon: Hotel, href: "/leads/hotel" },
  { label: "Corporate Accounts", icon: Briefcase, href: "/accounts/corporate" },
  { label: "Hotel Accounts", icon: Building, href: "/accounts/hotel" },
  { label: "Meetings", icon: Calendar, href: "/activities/meetings" },
  { label: "Call Logs", icon: Phone, href: "/activities/calls" },
  { label: "MOM", icon: FileText, href: "/activities/mom" },
  { label: "Check-Ins", icon: MapPin, href: "/activities/check-ins" },
  { label: "Proposals", icon: FileText, href: "/proposals" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "KYB Compliance", icon: ShieldCheck, href: "/kyb" },
  { label: "Approvals", icon: CheckSquare, href: "/approvals" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Audit Logs", icon: ScrollText, href: "/audit-logs" },
  { label: "Profile", icon: UserCircle, href: "/profile" },
];

// Breakpoint (px) below which the sidebar auto-collapses
const MOBILE_BREAKPOINT = 768;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const pathname = usePathname();
  const { expanded, toggle, setExpanded } = useSidebarStore();

  // ---- Responsive: auto-collapse on mobile ---------------------------------
  const handleResize = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setExpanded(false);
    }
  }, [setExpanded]);

  useEffect(() => {
    // Run once on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // ---- Active route helper -------------------------------------------------
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href || pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // ---- Render --------------------------------------------------------------
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white",
        "transition-[width] duration-300 ease-in-out",
        expanded ? "w-64" : "w-[68px]"
      )}
    >
      {/* ------- Header / Logo area ------- */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            expanded ? "w-full" : "w-0 opacity-0"
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-gradient text-sm font-bold text-white">
            F
          </span>
          <span className="whitespace-nowrap text-lg font-semibold text-gray-900">
            FLYVENTO CRM
          </span>
        </div>

        {/* Compact logo (collapsed mode) */}
        {!expanded && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-gradient text-sm font-bold text-white">
            F
          </span>
        )}

        {/* Toggle button */}
        <button
          onClick={toggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500",
            "transition-colors hover:bg-gray-100 hover:text-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            !expanded && "hidden"
          )}
        >
          {expanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Hamburger button visible only in collapsed state */}
      {!expanded && (
        <div className="flex justify-center py-2">
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-gray-500",
              "transition-colors hover:bg-gray-100 hover:text-gray-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ------- Navigation list ------- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    !expanded && "justify-center px-0"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  {expanded && (
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  )}

                  {/* Active indicator bar */}
                  {active && (
                    <span
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-full bg-blue-600",
                        "transition-opacity duration-150"
                      )}
                    />
                  )}
                </Link>

                {/* Tooltip -- visible only in collapsed mode on hover */}
                {!expanded && (
                  <div
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2",
                      "whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
                      "opacity-0 scale-95 transition-all duration-150",
                      "group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-100"
                    )}
                  >
                    {item.label}
                    {/* Arrow */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ------- Footer / Collapse affordance ------- */}
      <div className="shrink-0 border-t border-gray-200 p-3">
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500",
            "transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            !expanded && "justify-center px-0"
          )}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-300",
              !expanded && "rotate-180"
            )}
          />
          {expanded && <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
