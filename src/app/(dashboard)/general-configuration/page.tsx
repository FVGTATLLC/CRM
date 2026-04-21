"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Flag,
  GitBranch,
  FolderTree,
  Users,
  Shield,
  Settings,
  UserCog,
  Search,
  type LucideIcon,
} from "lucide-react";

interface ConfigLink {
  label: string;
  href: string;
}

interface ConfigCard {
  title: string;
  icon: LucideIcon;
  accent: string; // tailwind color classes for the icon pill
  links: ConfigLink[];
}

const CARDS: ConfigCard[] = [
  {
    title: "Organization",
    icon: Building2,
    accent: "bg-blue-600 text-white",
    links: [
      { label: "Business Lines", href: "/business-lines" },
      { label: "Regions", href: "/regions" },
      { label: "Countries", href: "/countries" },
      { label: "Branches", href: "/branches" },
      { label: "Departments", href: "/departments" },
    ],
  },
  {
    title: "Users and Permissions",
    icon: UserCog,
    accent: "bg-indigo-600 text-white",
    links: [
      { label: "User Management", href: "/users" },
      { label: "Role Management", href: "/roles" },
    ],
  },
  {
    title: "General Settings",
    icon: Settings,
    accent: "bg-slate-600 text-white",
    links: [
      { label: "Audit Logs", href: "/audit-logs" },
      { label: "Profile", href: "/profile" },
    ],
  },
];

// Small icon map for individual links, shown on hover
const LINK_ICONS: Record<string, LucideIcon> = {
  "/business-lines": Building2,
  "/regions": Globe,
  "/countries": Flag,
  "/branches": GitBranch,
  "/departments": FolderTree,
  "/users": Users,
  "/roles": Shield,
};

export default function GeneralConfigurationPage() {
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;
    return CARDS.map((card) => ({
      ...card,
      links: card.links.filter((l) => l.label.toLowerCase().includes(q)),
    })).filter((card) => card.links.length > 0 || card.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Configurations</h1>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search configurations..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.accent}`}>
                    <CardIcon className="h-5 w-5" />
                  </span>
                  <h2 className="text-base font-semibold text-gray-900">{card.title}</h2>
                </div>

                <ul className="space-y-1">
                  {card.links.map((link) => {
                    const LinkIcon = LINK_ICONS[link.href];
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {LinkIcon && <LinkIcon className="h-4 w-4 text-gray-400" />}
                            <span className="truncate">{link.label}</span>
                          </span>
                          <span className="text-gray-300 group-hover:text-gray-500">›</span>
                        </Link>
                      </li>
                    );
                  })}
                  {card.links.length === 0 && (
                    <li className="text-xs text-gray-400 px-2 py-2">No matches</li>
                  )}
                </ul>
              </div>
            );
          })}

          {filteredCards.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-gray-500">
              No configurations match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
