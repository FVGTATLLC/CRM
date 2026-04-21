"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserPlus,
  Briefcase,
  Contact,
  Calendar,
  Users,
  MapPin,
  FileText,
  FileSignature,
  Loader2,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useApi, useAuthStore } from "@/hooks/useAuth";
import ConversionFunnel from "@/components/dashboard/ConversionFunnel";

interface StatCard {
  title: string;
  value: number;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

interface Lead {
  id: string;
  leadType?: string;
  leadStatus?: string;
  lastModifiedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

const PIPELINE_STAGES = [
  { key: "New", color: "bg-blue-500" },
  { key: "Contacted", color: "bg-cyan-500" },
  { key: "Qualified", color: "bg-indigo-500" },
  { key: "Proposal Sent", color: "bg-purple-500" },
  { key: "Negotiation", color: "bg-amber-500" },
  { key: "Won", color: "bg-green-500" },
  { key: "Lost", color: "bg-red-400" },
];

function getLastModified(lead: Lead): Date {
  const raw = lead.lastModifiedAt || lead.updatedAt || lead.createdAt;
  return raw ? new Date(raw) : new Date(0);
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { fetchApi } = useApi();

  const [stats, setStats] = useState({
    leads: 0,
    accounts: 0,
    contacts: 0,
    activities: 0,
    users: 0,
    checkInsToday: 0,
    proposals: 0,
    contracts: 0,
  });
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [renewals, setRenewals] = useState({ expiringCount: 0, expiredCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [
          leadsRes,
          accountsRes,
          contactsRes,
          activitiesRes,
          usersRes,
          checkInsRes,
          proposalsRes,
          contractsRes,
          allLeadsRes,
          recentRes,
          renewalsRes,
        ] = await Promise.allSettled([
          fetchApi<{ total?: number }>("/api/leads?limit=1"),
          fetchApi<{ total?: number }>("/api/accounts?limit=1"),
          fetchApi<{ total?: number }>("/api/contacts?limit=1"),
          fetchApi<{ total?: number }>("/api/activities?activityType=Meeting&limit=1"),
          fetchApi<{ total?: number }>("/api/users?limit=1"),
          fetchApi<{ total?: number }>("/api/check-ins?limit=1&status=CheckedIn"),
          fetchApi<{ total?: number }>("/api/proposals?limit=1"),
          fetchApi<{ total?: number }>("/api/contracts?limit=1"),
          fetchApi<{ data?: Lead[] }>("/api/leads?limit=1000"),
          fetchApi<{ data?: any[] }>("/api/activities?limit=10&sortBy=createdAt&sortOrder=desc"),
          fetchApi<{ data?: { summary?: { expiringCount?: number; expiredCount?: number } } }>("/api/contracts/renewals?daysAhead=30"),
        ]);

        setStats({
          leads: leadsRes.status === "fulfilled" ? leadsRes.value.total ?? 0 : 0,
          accounts: accountsRes.status === "fulfilled" ? accountsRes.value.total ?? 0 : 0,
          contacts: contactsRes.status === "fulfilled" ? contactsRes.value.total ?? 0 : 0,
          activities: activitiesRes.status === "fulfilled" ? activitiesRes.value.total ?? 0 : 0,
          users: usersRes.status === "fulfilled" ? usersRes.value.total ?? 0 : 0,
          checkInsToday: checkInsRes.status === "fulfilled" ? checkInsRes.value.total ?? 0 : 0,
          proposals: proposalsRes.status === "fulfilled" ? proposalsRes.value.total ?? 0 : 0,
          contracts: contractsRes.status === "fulfilled" ? contractsRes.value.total ?? 0 : 0,
        });

        if (allLeadsRes.status === "fulfilled" && allLeadsRes.value.data) {
          setAllLeads(allLeadsRes.value.data);
        }

        if (recentRes.status === "fulfilled" && recentRes.value.data) {
          setRecentActivities(recentRes.value.data);
        }

        if (renewalsRes.status === "fulfilled" && renewalsRes.value.data?.summary) {
          setRenewals({
            expiringCount: renewalsRes.value.data.summary.expiringCount ?? 0,
            expiredCount: renewalsRes.value.data.summary.expiredCount ?? 0,
          });
        }
      } catch {
        // stats remain at 0
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Pipeline data ----------
  const corporateLeads = useMemo(
    () => allLeads.filter((l) => l.leadType === "Corporate"),
    [allLeads]
  );
  const hotelLeads = useMemo(
    () => allLeads.filter((l) => l.leadType === "Hotel"),
    [allLeads]
  );

  function buildPipelineCounts(leads: Lead[]) {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach((s) => (counts[s.key] = 0));
    leads.forEach((l) => {
      const status = l.leadStatus ?? "New";
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }

  const corporateCounts = useMemo(() => buildPipelineCounts(corporateLeads), [corporateLeads]);
  const hotelCounts = useMemo(() => buildPipelineCounts(hotelLeads), [hotelLeads]);

  // ---------- SLA Alerts ----------
  const slaAlertCount = useMemo(() => {
    const threshold = Date.now() - 48 * 60 * 60 * 1000;
    return allLeads.filter((lead) => {
      const lastMod = getLastModified(lead);
      return lastMod.getTime() < threshold;
    }).length;
  }, [allLeads]);

  // ---------- Stat cards ----------
  const cards: StatCard[] = [
    {
      title: "Leads",
      value: stats.leads,
      icon: UserPlus,
      href: "/leads",
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    },
    {
      title: "Accounts",
      value: stats.accounts,
      icon: Briefcase,
      href: "/accounts",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200",
    },
    {
      title: "Contacts",
      value: stats.contacts,
      icon: Contact,
      href: "/contacts",
      color: "text-purple-600",
      bgColor: "bg-purple-50 border-purple-200",
    },
    {
      title: "Meetings Today",
      value: stats.activities,
      icon: Calendar,
      href: "/activities/meetings",
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200",
    },
    {
      title: "Users",
      value: stats.users,
      icon: Users,
      href: "/users",
      color: "text-rose-600",
      bgColor: "bg-rose-50 border-rose-200",
    },
    {
      title: "Active Check-Ins",
      value: stats.checkInsToday,
      icon: MapPin,
      href: "/activities/check-ins",
      color: "text-teal-600",
      bgColor: "bg-teal-50 border-teal-200",
    },
    {
      title: "Proposals",
      value: stats.proposals,
      icon: FileText,
      href: "/proposals",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-200",
    },
    {
      title: "Contracts",
      value: stats.contracts,
      icon: FileSignature,
      href: "/contracts",
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200",
    },
  ];

  // ---------- Pipeline bar renderer ----------
  function PipelineFunnel({
    title,
    counts,
    total,
  }: {
    title: string;
    counts: Record<string, number>;
    total: number;
  }) {
    const maxCount = Math.max(...Object.values(counts), 1);
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {title}{" "}
          <span className="text-gray-400 font-normal">({total} total)</span>
        </h3>
        <div className="space-y-2.5">
          {PIPELINE_STAGES.map((stage) => {
            const count = counts[stage.key] ?? 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 text-right truncate">
                  {stage.key}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${pct}%`, minWidth: count > 0 ? "24px" : "0px" }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Welcome Banner */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName ?? "User"}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here is an overview of your CRM activity.
        </p>
      </div>

      {/* Row 2: 8 Stat Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${card.bgColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {card.title}
                      </p>
                      <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full bg-white/60 ${card.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Row 3: Pipeline Funnels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PipelineFunnel
              title="Corporate Pipeline"
              counts={corporateCounts}
              total={corporateLeads.length}
            />
            <PipelineFunnel
              title="Hotel Pipeline"
              counts={hotelCounts}
              total={hotelLeads.length}
            />
          </div>

          {/* Client Journey Funnel */}
          <ConversionFunnel />

          {/* Row 3.5: Recent Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      activity.status === "Completed" ? "bg-green-500" : activity.status === "Planned" ? "bg-blue-500" : "bg-gray-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{activity.subject}</p>
                      <p className="text-xs text-gray-500">
                        {activity.activityType} &middot; {activity.status}
                        {activity.owner && ` \u00b7 ${activity.owner.firstName} ${activity.owner.lastName}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(activity.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: SLA Alert Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  slaAlertCount > 0
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">SLA Alerts</h3>
                <p className="text-sm text-gray-500">
                  {slaAlertCount > 0 ? (
                    <>
                      <span className="font-bold text-red-600">
                        {slaAlertCount}
                      </span>{" "}
                      lead{slaAlertCount !== 1 ? "s" : ""} with no activity in
                      the last 48 hours
                    </>
                  ) : (
                    <span className="text-green-600">
                      All leads have recent activity. No SLA breaches detected.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Contract Renewals */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                renewals.expiredCount > 0 ? "bg-red-100 text-red-600" : renewals.expiringCount > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
              }`}>
                <FileSignature className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700">Contract Renewals</h3>
                <p className="text-sm text-gray-500">
                  {renewals.expiredCount > 0 && (
                    <><span className="font-bold text-red-600">{renewals.expiredCount}</span> expired &middot; </>
                  )}
                  {renewals.expiringCount > 0 ? (
                    <><span className="font-bold text-amber-600">{renewals.expiringCount}</span> expiring in 30 days</>
                  ) : renewals.expiredCount === 0 ? (
                    <span className="text-green-600">All contracts are current</span>
                  ) : null}
                </p>
              </div>
              <Link href="/contracts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View &rarr;</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
