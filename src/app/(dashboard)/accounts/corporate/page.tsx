"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import PhoneInput from "@/components/forms/PhoneInput";
import Account360View from "@/components/account/Account360View";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface Account {
  id: string;
  accountName: string;
  accountType?: string;
  segment?: string;
  subSegment?: string;
  industry?: string;
  companySize?: string;
  annualTravelSpend?: number;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  annualRevenue?: number;
  currency?: string;
  numberOfEmployees?: number;
  accountStatus: string;
  remarks?: string;
  createdAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  accountName: "",
  industry: "",
  companySize: "",
  annualTravelSpend: "",
  annualRevenue: "",
  currency: "USD",
  numberOfEmployees: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  segment: "",
  subSegment: "",
  accountStatus: "Active",
  remarks: "",
};

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "Active":
      return "green";
    case "Dormant":
      return "yellow";
    case "Suspended":
      return "red";
    default:
      return "gray";
  }
}

export default function CorporateAccountsPage() {
  const { fetchApi } = useApi();
  const router = useRouter();

  const [data, setData] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Account | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Account[]; total: number }>(
        `/api/accounts?accountType=Corporate&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      );
      setData(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        accountType: "Corporate",
        accountStatus: form.accountStatus || "Active",
        annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : undefined,
        numberOfEmployees: form.numberOfEmployees ? Number(form.numberOfEmployees) : undefined,
        annualTravelSpend: form.annualTravelSpend ? Number(form.annualTravelSpend) : undefined,
      };
      await fetchApi("/api/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        accountType: "Corporate",
        annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : undefined,
        numberOfEmployees: form.numberOfEmployees ? Number(form.numberOfEmployees) : undefined,
        annualTravelSpend: form.annualTravelSpend ? Number(form.annualTravelSpend) : undefined,
      };
      await fetchApi(`/api/accounts/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row: Account) => {
    setSelectedRow(row);
    setForm({
      accountName: row.accountName ?? "",
      industry: row.industry ?? "",
      companySize: (row as any).companySize ?? "",
      annualTravelSpend: row.annualTravelSpend != null ? String(row.annualTravelSpend) : "",
      annualRevenue: row.annualRevenue != null ? String(row.annualRevenue) : "",
      currency: row.currency ?? "USD",
      numberOfEmployees: row.numberOfEmployees != null ? String(row.numberOfEmployees) : "",
      website: row.website ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "",
      zipCode: row.zipCode ?? "",
      segment: row.segment ?? "",
      subSegment: row.subSegment ?? "",
      accountStatus: row.accountStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Account) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Account>[] = [
    { key: "accountName", label: "Account Name", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    {
      key: "companySize" as keyof Account,
      label: "Company Size",
      sortable: false,
    },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: false },
    {
      key: "accountStatus",
      label: "Status",
      sortable: true,
      render: (value: string) => {
        const color = getStatusBadgeColor(value);
        return (
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
  ];

  const renderFormFields = () => (
    <div className="space-y-6">
      {/* Company Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Company Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Account Name" name="accountName" value={form.accountName} onChange={handleFieldChange} required placeholder="Enter account name" />
          <FormField label="Industry" name="industry" type="select" value={form.industry} onChange={handleFieldChange} required options={[
            { label: "Travel & Tourism", value: "Travel & Tourism" },
            { label: "Technology", value: "Technology" },
            { label: "Finance", value: "Finance" },
            { label: "Healthcare", value: "Healthcare" },
            { label: "Manufacturing", value: "Manufacturing" },
            { label: "Retail", value: "Retail" },
            { label: "Hospitality", value: "Hospitality" },
            { label: "Education", value: "Education" },
            { label: "Government", value: "Government" },
            { label: "Other", value: "Other" },
          ]} />
          <FormField label="Company Size" name="companySize" type="select" value={form.companySize} onChange={handleFieldChange} options={[
            { label: "1-50", value: "1-50" },
            { label: "51-200", value: "51-200" },
            { label: "201-500", value: "201-500" },
            { label: "501-1000", value: "501-1000" },
            { label: "1000+", value: "1000+" },
          ]} />
          <FormField label="Annual Travel Spend" name="annualTravelSpend" type="number" value={form.annualTravelSpend} onChange={handleFieldChange} placeholder="Enter annual travel spend" />
        </div>
      </div>

      {/* Financial */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Annual Revenue" name="annualRevenue" type="number" value={form.annualRevenue} onChange={handleFieldChange} placeholder="Enter annual revenue" />
          <FormField label="Currency" name="currency" type="select" value={form.currency} onChange={handleFieldChange} options={[
            { label: "USD", value: "USD" },
            { label: "AED", value: "AED" },
            { label: "GBP", value: "GBP" },
            { label: "EUR", value: "EUR" },
            { label: "KES", value: "KES" },
            { label: "INR", value: "INR" },
            { label: "THB", value: "THB" },
          ]} />
          <FormField label="Number of Employees" name="numberOfEmployees" type="number" value={form.numberOfEmployees} onChange={handleFieldChange} placeholder="Enter number of employees" />
        </div>
      </div>

      {/* Contact & Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact & Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Website" name="website" value={form.website} onChange={handleFieldChange} placeholder="Enter website URL" />
          <PhoneInput label="Phone" name="phone" value={form.phone} onChange={(n, v) => handleFieldChange(n, v)} country={form.country} />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleFieldChange} placeholder="Enter email" />
          <div className="md:col-span-2">
            <FormField label="Address" name="address" type="textarea" value={form.address} onChange={handleFieldChange} placeholder="Enter address" rows={2} />
          </div>
          <FormField label="City" name="city" value={form.city} onChange={handleFieldChange} placeholder="Enter city" />
          <FormField label="State" name="state" value={form.state} onChange={handleFieldChange} placeholder="Enter state" />
          <FormField label="Country" name="country" value={form.country} onChange={handleFieldChange} placeholder="Enter country" />
          <FormField label="Zip Code" name="zipCode" value={form.zipCode} onChange={handleFieldChange} placeholder="Enter zip code" />
        </div>
      </div>

      {/* Classification */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Segment" name="segment" value={form.segment} onChange={handleFieldChange} placeholder="Enter segment" />
          <FormField label="Sub Segment" name="subSegment" value={form.subSegment} onChange={handleFieldChange} placeholder="Enter sub segment" />
          <FormField label="Status" name="accountStatus" type="select" value={form.accountStatus} onChange={handleFieldChange} options={[
            { label: "Active", value: "Active" },
            { label: "Dormant", value: "Dormant" },
            { label: "Suspended", value: "Suspended" },
          ]} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Remarks" name="remarks" type="textarea" value={form.remarks} onChange={handleFieldChange} placeholder="Enter remarks" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Account>
        moduleName="Corporate Account"
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        isLoading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearch}
        onRowClick={openRead}
        onEdit={openEdit}
        onExport={() => {}}
      />

      <FormModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Corporate Account" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Create"}</button>
        </div>
      </FormModal>

      <FormModal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Corporate Account" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Update"}</button>
        </div>
      </FormModal>

      <Account360View
        account={selectedRow}
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
        onNavigate={(module: string, id?: string) => {
          if (id) {
            router.push(`/${module}?viewId=${id}`);
          } else {
            router.push(`/${module}?accountId=${selectedRow?.id}`);
          }
        }}
      />
    </div>
  );
}
