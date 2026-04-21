"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useAuth";

interface FunnelData {
  totalLeads: number;
  convertedToAccounts: number;
  totalAccounts: number;
  accountsWithContacts: number;
  accountsWithProposals: number;
  accountsWithContracts: number;
  accountsKybVerified: number;
}

export default function ConversionFunnel() {
  const { fetchApi } = useApi();
  const [data, setData] = useState<FunnelData | null>(null);

  useEffect(() => {
    fetchApi<{ success: boolean; data: FunnelData }>("/api/dashboard/funnel")
      .then((res) => { if (res.success) setData(res.data); })
      .catch(console.error);
  }, []);

  if (!data) return null;

  const stages = [
    { label: "Total Leads", value: data.totalLeads, color: "bg-blue-500" },
    { label: "Converted to Accounts", value: data.convertedToAccounts, color: "bg-cyan-500" },
    { label: "With Proposals", value: data.accountsWithProposals, color: "bg-indigo-500" },
    { label: "With Contracts", value: data.accountsWithContracts, color: "bg-purple-500" },
    { label: "KYB Verified", value: data.accountsKybVerified, color: "bg-green-500" },
  ];

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Client Journey Funnel</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = (stage.value / maxValue) * 100;
          const conversionRate = i > 0 && stages[i - 1].value > 0 ? Math.round((stage.value / stages[i - 1].value) * 100) : null;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-40 text-right truncate">{stage.label}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                <div className={`h-full rounded-full ${stage.color} transition-all duration-700 flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 8)}%` }}>
                  <span className="text-xs font-bold text-white">{stage.value}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-12 text-right">
                {conversionRate !== null ? `${conversionRate}%` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">Conversion rates shown between stages</p>
    </div>
  );
}
