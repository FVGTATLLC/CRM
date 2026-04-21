"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import DocumentUpload from "@/components/documents/DocumentUpload";
import EmailLogPanel from "@/components/email/EmailLogPanel";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Account {
  id: string;
  accountName: string;
}

interface Proposal {
  id: string;
  title: string;
}

interface Owner {
  id: string;
  firstName?: string;
  lastName?: string;
}

interface Contract {
  id: string;
  title: string;
  value?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  remarks?: string;
  accountId: string;
  account?: Account;
  proposalId?: string;
  proposal?: Proposal;
  ownerId: string;
  owner?: Owner;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  lastModifiedById?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  title: "",
  accountId: "",
  proposalId: "",
  value: "",
  currency: "USD",
  startDate: "",
  endDate: "",
  status: "Draft",
  remarks: "",
};

export default function ContractsPage() {
  const { fetchApi } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Contract | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit" | "read">("list");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Auto-open create form if navigated from Proposals
  useEffect(() => {
    const fromProposal = searchParams.get("fromProposal");
    if (fromProposal) {
      setForm({
        ...INITIAL_FORM,
        title: searchParams.get("title") || "",
        proposalId: fromProposal,
        accountId: searchParams.get("accountId") || "",
        value: searchParams.get("value") || "",
        currency: searchParams.get("currency") || "",
      });
      setCreateOpen(true);
      // Clean URL
      window.history.replaceState({}, "", "/contracts");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Contract[]; total: number }>(
        `/api/contracts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetchApi<{ data: Account[] }>(
        "/api/accounts?limit=1000"
      );
      setAccounts(res.data ?? []);
    } catch {
      setAccounts([]);
    }
  }, [fetchApi]);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetchApi<{ data: Proposal[] }>(
        "/api/proposals?limit=1000"
      );
      setProposals(res.data ?? []);
    } catch {
      setProposals([]);
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchAccounts();
    fetchProposals();
  }, [fetchAccounts, fetchProposals]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: form.value ? Number(form.value) : undefined,
      };
      await fetchApi("/api/contracts", {
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
        value: form.value ? Number(form.value) : undefined,
      };
      await fetchApi(`/api/contracts/${selectedRow.id}`, {
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

  const handleDelete = async (row: Contract) => {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      await fetchApi(`/api/contracts/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Contract) => {
    setSelectedRow(row);
    setForm({
      title: row.title ?? "",
      accountId: row.accountId ?? "",
      proposalId: row.proposalId ?? "",
      value: row.value != null ? String(row.value) : "",
      currency: row.currency ?? "USD",
      startDate: row.startDate ? row.startDate.slice(0, 10) : "",
      endDate: row.endDate ? row.endDate.slice(0, 10) : "",
      status: row.status ?? "Draft",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Contract) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Signed":
        return "bg-indigo-100 text-indigo-800";
      case "Active":
        return "bg-green-100 text-green-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusReadColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "gray";
      case "Sent":
        return "blue";
      case "Signed":
        return "indigo";
      case "Active":
        return "green";
      case "Expired":
        return "red";
      default:
        return "gray";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  const columns: ColumnDef<Contract>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "accountId",
      label: "Account",
      sortable: false,
      render: (_value: string, row: Contract) =>
        row.account?.accountName ?? "",
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      render: (value: number) =>
        value != null ? value.toLocaleString() : "",
    },
    { key: "currency", label: "Currency", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeColor(value)}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      render: (value: string) => formatDate(value) ?? "",
    },
    {
      key: "endDate",
      label: "End Date",
      sortable: true,
      render: (value: string) => formatDate(value) ?? "",
    },
    {
      key: "ownerId",
      label: "Owner",
      sortable: false,
      render: (_value: string, row: Contract) =>
        row.owner
          ? `${row.owner.firstName ?? ""} ${row.owner.lastName ?? ""}`.trim()
          : "",
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => formatDate(value) ?? "",
    },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Contract Information",
          fields: [
            { label: "Title", value: selectedRow.title },
            {
              label: "Account",
              value: selectedRow.account?.accountName,
            },
            {
              label: "Proposal",
              value: selectedRow.proposal?.title,
            },
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
              badgeColor: getStatusReadColor(selectedRow.status),
            },
            {
              label: "Owner",
              value: selectedRow.owner
                ? `${selectedRow.owner.firstName ?? ""} ${selectedRow.owner.lastName ?? ""}`.trim()
                : null,
            },
          ],
        },
        {
          title: "Financial & Dates",
          fields: [
            {
              label: "Value",
              value:
                selectedRow.value != null
                  ? `${selectedRow.currency ?? ""} ${selectedRow.value.toLocaleString()}`
                  : null,
            },
            { label: "Currency", value: selectedRow.currency },
            {
              label: "Start Date",
              value: formatDate(selectedRow.startDate),
            },
            {
              label: "End Date",
              value: formatDate(selectedRow.endDate),
            },
          ],
        },
        {
          title: "System Information",
          fields: [
            { label: "Remarks", value: selectedRow.remarks },
            { label: "Created By", value: selectedRow.createdByName },
            { label: "Created At", value: formatDate(selectedRow.createdAt) },
            {
              label: "Last Modified By",
              value: selectedRow.lastModifiedByName,
            },
            {
              label: "Last Modified At",
              value: formatDate(selectedRow.lastModifiedAt),
            },
          ],
        },
      ]
    : [];

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Title"
        name="title"
        value={form.title}
        onChange={handleFieldChange}
        required
        placeholder="Enter contract title"
      />
      <FormField
        label="Account"
        name="accountId"
        type="select"
        value={form.accountId}
        onChange={handleFieldChange}
        required
        options={accounts.map((a) => ({
          label: a.accountName,
          value: a.id,
        }))}
      />
      <FormField
        label="Proposal"
        name="proposalId"
        type="select"
        value={form.proposalId}
        onChange={handleFieldChange}
        options={[
          { label: "None", value: "" },
          ...proposals.map((p) => ({
            label: p.title,
            value: p.id,
          })),
        ]}
      />
      <FormField
        label="Value"
        name="value"
        type="number"
        value={form.value}
        onChange={handleFieldChange}
        placeholder="Enter contract value"
      />
      <FormField
        label="Currency"
        name="currency"
        type="select"
        value={form.currency}
        onChange={handleFieldChange}
        options={[
          { label: "USD", value: "USD" },
          { label: "AED", value: "AED" },
          { label: "GBP", value: "GBP" },
          { label: "EUR", value: "EUR" },
          { label: "KES", value: "KES" },
          { label: "INR", value: "INR" },
          { label: "THB", value: "THB" },
        ]}
      />
      <FormField
        label="Start Date"
        name="startDate"
        type="date"
        value={form.startDate}
        onChange={handleFieldChange}
        required
      />
      <FormField
        label="End Date"
        name="endDate"
        type="date"
        value={form.endDate}
        onChange={handleFieldChange}
        required
      />
      <FormField
        label="Status"
        name="status"
        type="select"
        value={form.status}
        onChange={handleFieldChange}
        options={[
          { label: "Draft", value: "Draft" },
          { label: "Sent", value: "Sent" },
          { label: "Signed", value: "Signed" },
          { label: "Active", value: "Active" },
          { label: "Expired", value: "Expired" },
        ]}
      />
      <div className="md:col-span-2">
        <FormField
          label="Remarks"
          name="remarks"
          type="textarea"
          value={form.remarks}
          onChange={handleFieldChange}
          placeholder="Enter remarks"
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Contract>
        moduleName="Contract"
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        isLoading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearch}
        onCreate={() => {
          setForm(INITIAL_FORM);
          setCreateOpen(true);
        }}
        onRowClick={openRead}
        onEdit={openEdit}
        onDelete={handleDelete}
        onExport={() => {}}
      />

      <FormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Contract"
        size="xl"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => setCreateOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </FormModal>

      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Contract"
        size="xl"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => setEditOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </FormModal>

      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Contract Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <>
            {(selectedRow.status === "Active" || selectedRow.status === "Signed") && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => router.push(`/kyb?accountId=${selectedRow.accountId}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Start KYB Compliance &rarr;
                </button>
              </div>
            )}
            <ActivityTimeline relatedToType="Contract" relatedToId={selectedRow.id} />
            <DocumentUpload relatedToType="Contract" relatedToId={selectedRow.id} relatedToName={selectedRow.title} contractId={selectedRow.id} />
            <EmailLogPanel relatedToType="Contract" relatedToId={selectedRow.id} relatedToName={selectedRow.title} contractId={selectedRow.id} />
          </>
        )}
      </ReadView>
    </div>
  );
}
