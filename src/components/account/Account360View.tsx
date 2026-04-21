"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useAuth";
import FormModal from "@/components/forms/FormModal";
import JourneyProgressBar from "@/components/account/JourneyProgressBar";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import DocumentUpload from "@/components/documents/DocumentUpload";
import EmailLogPanel from "@/components/email/EmailLogPanel";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Users, FileText, ScrollText, ShieldCheck, Activity, X, ExternalLink, Plus } from "lucide-react";

interface Account360ViewProps {
  account: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onNavigate?: (module: string, id?: string) => void;
}

const TABS = [
  { key: "details", label: "Details", icon: FileText },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "proposals", label: "Proposals", icon: FileText },
  { key: "contracts", label: "Contracts", icon: ScrollText },
  { key: "kyb", label: "KYB", icon: ShieldCheck },
  { key: "activity", label: "Activity & Docs", icon: Activity },
];

export default function Account360View({ account, isOpen, onClose, onEdit, onNavigate }: Account360ViewProps) {
  const { fetchApi } = useApi();
  const [activeTab, setActiveTab] = useState("details");
  const [relatedData, setRelatedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && account?.id) {
      setLoading(true);
      fetchApi<any>(`/api/accounts/${account.id}/related`)
        .then((data) => {
          if (data.success) setRelatedData(data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, account?.id]);

  if (!isOpen || !account) return null;

  const journey = relatedData?.journeyStatus;
  const contacts = relatedData?.contacts || [];
  const proposals = relatedData?.proposals || [];
  const contracts = relatedData?.contracts || [];
  const kybItems = relatedData?.kybChecklist || [];
  const sourceLead = relatedData?.lead;

  const statusBadge = (status: string, colorMap: Record<string, string>) => {
    const color = colorMap[status] || "bg-gray-100 text-gray-800";
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>{status}</span>;
  };

  const accountStatusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-800", Dormant: "bg-yellow-100 text-yellow-800", Suspended: "bg-red-100 text-red-800",
    Onboarded: "bg-green-100 text-green-800", Pending: "bg-yellow-100 text-yellow-800", Blacklisted: "bg-red-100 text-red-800",
    Inactive: "bg-gray-100 text-gray-800",
  };

  const proposalStatusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Sent: "bg-blue-100 text-blue-800", Accepted: "bg-green-100 text-green-800", Rejected: "bg-red-100 text-red-800" };
  const contractStatusColors: Record<string, string> = { Draft: "bg-gray-100 text-gray-800", Sent: "bg-blue-100 text-blue-800", Signed: "bg-indigo-100 text-indigo-800", Active: "bg-green-100 text-green-800", Expired: "bg-red-100 text-red-800" };
  const kybStatusColors: Record<string, string> = { Pending: "bg-yellow-100 text-yellow-800", Uploaded: "bg-blue-100 text-blue-800", Verified: "bg-green-100 text-green-800", Rejected: "bg-red-100 text-red-800" };

  return (
    <FormModal title={`Account: ${account.accountName}`} isOpen={isOpen} onClose={onClose} size="2xl">
      {/* Journey Progress Bar */}
      {journey && <JourneyProgressBar journeyStatus={journey} />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.key === "contacts" ? contacts.length : tab.key === "proposals" ? proposals.length : tab.key === "contracts" ? contracts.length : tab.key === "kyb" ? kybItems.length : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {count !== null && count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="min-h-[400px]">
          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {sourceLead && (
                <div className="col-span-2 mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-600 font-medium">Converted from Lead</span>
                    <p className="text-sm font-medium text-blue-800">{sourceLead.firstName} {sourceLead.lastName} - {sourceLead.company}</p>
                  </div>
                  {onNavigate && (
                    <button onClick={() => onNavigate("leads", sourceLead.id)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <ExternalLink size={12} /> View Lead
                    </button>
                  )}
                </div>
              )}
              {account.accountType === "Hotel" ? (
                /* ---- Hotel Details ---- */
                <>
                  <div className="col-span-2 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hotel Info</h4>
                  </div>
                  {[
                    { label: "Hotel Name", value: account.hotelName || account.accountName },
                    { label: "Star Rating", value: account.starRating ? `${account.starRating} Star` : null },
                    { label: "Number of Rooms", value: account.numberOfRooms },
                    { label: "City", value: account.city },
                    { label: "Country", value: account.country },
                    { label: "Hotel Chain / Group", value: account.hotelChainGroup },
                    { label: "Status", value: account.accountStatus, badge: true },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      {field.badge ? statusBadge(field.value || "—", accountStatusColors) : <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>}
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hotel Details</h4>
                  </div>
                  {[
                    { label: "Amenities", value: account.hotelAmenities },
                    { label: "Room Types", value: account.roomTypes },
                    { label: "Rate Range", value: account.rateRange },
                    { label: "Commission Structure", value: account.commissionStructure },
                    { label: "Distribution Channels", value: account.distributionChannels },
                    { label: "Partnership Type", value: account.partnershipType },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial</h4>
                  </div>
                  {[
                    { label: "Annual Revenue", value: account.annualRevenue },
                    { label: "Currency", value: account.currency },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h4>
                  </div>
                  {[
                    { label: "Email", value: account.email },
                    { label: "Phone", value: account.phone },
                    { label: "Website", value: account.website },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System</h4>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm font-medium text-gray-800">{account.createdAt ? formatDateTime(account.createdAt) : "—"}</p>
                  </div>
                </>
              ) : (
                /* ---- Corporate / Default Details ---- */
                <>
                  <div className="col-span-2 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Info</h4>
                  </div>
                  {[
                    { label: "Account Name", value: account.accountName },
                    { label: "Account Type", value: account.accountType },
                    { label: "Status", value: account.accountStatus, badge: true },
                    { label: "Industry", value: account.industry },
                    { label: "Company Size", value: account.companySize },
                    { label: "Annual Travel Spend", value: account.annualTravelSpend },
                    { label: "Number of Travelers", value: account.numberOfTravelers },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      {field.badge ? statusBadge(field.value || "—", accountStatusColors) : <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>}
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Details</h4>
                  </div>
                  {[
                    { label: "Travel Policy", value: account.travelPolicy },
                    { label: "Booking Volume", value: account.bookingVolume },
                    { label: "Preferred Airlines", value: account.preferredAirlines },
                    { label: "Preferred Hotels", value: account.preferredHotels },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial</h4>
                  </div>
                  {[
                    { label: "Annual Revenue", value: account.annualRevenue },
                    { label: "Currency", value: account.currency },
                    { label: "Employees", value: account.numberOfEmployees },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact & Address</h4>
                  </div>
                  {[
                    { label: "Website", value: account.website },
                    { label: "Email", value: account.email },
                    { label: "Phone", value: account.phone },
                    { label: "Address", value: account.address },
                    { label: "City", value: account.city },
                    { label: "State", value: account.state },
                    { label: "Country", value: account.country },
                    { label: "Zip Code", value: account.zipCode },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="text-xs text-gray-500">{field.label}</p>
                      <p className="text-sm font-medium text-gray-800">{field.value || "—"}</p>
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System</h4>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm font-medium text-gray-800">{account.createdAt ? formatDateTime(account.createdAt) : "—"}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === "contacts" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-500">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
                {onNavigate && <button onClick={() => onNavigate("contacts", undefined)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Plus size={12} /> Add Contact</button>}
              </div>
              {contacts.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No contacts linked to this account</p> : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr></thead>
                    <tbody className="divide-y">{contacts.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate?.("contacts", c.id)}>
                        <td className="px-4 py-2 text-blue-600 hover:underline">{c.firstName} {c.lastName}</td>
                        <td className="px-4 py-2 text-gray-600">{c.email || "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{c.roleTag || "—"}</td>
                        <td className="px-4 py-2">{statusBadge(c.contactStatus, { Active: "bg-green-100 text-green-800", Inactive: "bg-gray-100 text-gray-800" })}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PROPOSALS TAB */}
          {activeTab === "proposals" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-500">{proposals.length} proposal{proposals.length !== 1 ? "s" : ""}</p>
                {onNavigate && <button onClick={() => onNavigate("proposals", undefined)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Plus size={12} /> Add Proposal</button>}
              </div>
              {proposals.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No proposals for this account</p> : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Valid Until</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Owner</th>
                    </tr></thead>
                    <tbody className="divide-y">{proposals.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate?.("proposals", p.id)}>
                        <td className="px-4 py-2 text-blue-600 hover:underline">{p.title}</td>
                        <td className="px-4 py-2 text-gray-600">{p.value ? `${p.currency || ""} ${p.value.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-2">{statusBadge(p.status, proposalStatusColors)}</td>
                        <td className="px-4 py-2 text-gray-600">{p.validUntil ? formatDate(p.validUntil) : "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTRACTS TAB */}
          {activeTab === "contracts" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-500">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
                {onNavigate && <button onClick={() => onNavigate("contracts", undefined)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Plus size={12} /> Add Contract</button>}
              </div>
              {contracts.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No contracts for this account</p> : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Start Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">End Date</th>
                    </tr></thead>
                    <tbody className="divide-y">{contracts.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate?.("contracts", c.id)}>
                        <td className="px-4 py-2 text-blue-600 hover:underline">{c.title}</td>
                        <td className="px-4 py-2 text-gray-600">{c.value ? `${c.currency || ""} ${c.value.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-2">{statusBadge(c.status, contractStatusColors)}</td>
                        <td className="px-4 py-2 text-gray-600">{c.startDate ? formatDate(c.startDate) : "—"}</td>
                        <td className="px-4 py-2 text-gray-600">{c.endDate ? formatDate(c.endDate) : "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* KYB TAB */}
          {activeTab === "kyb" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-500">{kybItems.length} document{kybItems.length !== 1 ? "s" : ""}</p>
                <div className="flex gap-2">
                  {onNavigate && <button onClick={() => onNavigate("kyb", undefined)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Plus size={12} /> Add Document</button>}
                  {journey?.kybStatus === "Complete" && account.accountStatus !== "Onboarded" && (
                    <button
                      onClick={async () => {
                        try {
                          await fetchApi(`/api/accounts/${account.id}`, { method: "PUT", body: JSON.stringify({ accountStatus: "Onboarded" }) });
                          alert("Account marked as Onboarded!");
                          onClose();
                        } catch (e) { console.error(e); }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >✓ Mark as Onboarded</button>
                  )}
                </div>
              </div>
              {kybItems.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No KYB documents. Start the compliance process.</p> : (
                <div className="space-y-2">
                  {kybItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          item.isVerified ? "bg-green-100 text-green-600" : item.isUploaded ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {item.isVerified ? "✓" : item.isUploaded ? "↑" : "○"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{item.documentType}</p>
                          <p className="text-xs text-gray-400">{item.documentName || "No document name"}</p>
                        </div>
                      </div>
                      {statusBadge(item.status, kybStatusColors)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY & DOCS TAB */}
          {activeTab === "activity" && (
            <div>
              <ActivityTimeline relatedToType="Account" relatedToId={account.id} />
              <DocumentUpload relatedToType="Account" relatedToId={account.id} relatedToName={account.accountName} accountId={account.id} />
              <EmailLogPanel relatedToType="Account" relatedToId={account.id} relatedToName={account.accountName} />
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        {onEdit && <button onClick={onEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Edit Account</button>}
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
      </div>
    </FormModal>
  );
}
