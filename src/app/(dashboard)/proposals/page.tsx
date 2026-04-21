"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import DocumentUpload from "@/components/documents/DocumentUpload";
import EmailLogPanel from "@/components/email/EmailLogPanel";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface Account {
  id: string;
  name: string;
}

interface LeadOption {
  id: string;
  leadNumber?: string | null;
  leadType: string;
  leadStatus: string;
  productDetails?: Record<string, string> | null;
  firstName?: string;
  lastName?: string;
}

interface Proposal {
  id: string;
  title: string;
  linkedToType?: string;
  linkedToId?: string;
  linkedToName?: string;
  leadId?: string;
  lead?: LeadOption;
  value?: number;
  currency?: string;
  description?: string;
  validUntil?: string;
  status: string;
  remarks?: string;
  accountId?: string;
  account?: Account;
  ownerId?: string;
  owner?: { firstName?: string; lastName?: string };
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  title: "",
  leadId: "",
  value: "",
  currency: "USD",
  description: "",
  validUntil: "",
  status: "Draft",
  remarks: "",
};

function formatLeadOptionLabel(l: LeadOption): string {
  const productName = l.productDetails?.productName ?? "";
  const id = l.leadNumber ?? l.id.slice(0, 8);
  return productName ? `${id} - ${productName}` : `${id} - ${(l.firstName ?? "")} ${(l.lastName ?? "")}`.trim();
}

export default function ProposalsPage() {
  const { fetchApi } = useApi();
  const router = useRouter();

  const [data, setData] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Proposal | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [newLeads, setNewLeads] = useState<LeadOption[]>([]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetchApi<{ data: LeadOption[] }>(
        `/api/leads?page=1&limit=500`
      );
      // Only show leads still in "New" status — these are awaiting a quote
      const onlyNew = (res.data ?? []).filter((l) => l.leadStatus === "New");
      setNewLeads(onlyNew);
    } catch {
      setNewLeads([]);
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Proposal[]; total: number }>(
        `/api/proposals?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
    if (!form.title.trim()) return alert("Title is required");
    if (!form.leadId) return alert("Lead is required");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        leadId: form.leadId,
        value: form.value ? Number(form.value) : undefined,
        currency: form.currency,
        description: form.description || undefined,
        validUntil: form.validUntil || undefined,
        status: form.status,
        remarks: form.remarks || undefined,
      };
      await fetchApi("/api/proposals", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      fetchData();
      fetchLeads();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;
    if (!form.title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        leadId: form.leadId || undefined,
        value: form.value ? Number(form.value) : undefined,
        currency: form.currency,
        description: form.description || undefined,
        validUntil: form.validUntil || undefined,
        status: form.status,
        remarks: form.remarks || undefined,
      };
      await fetchApi(`/api/proposals/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      fetchData();
      fetchLeads();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Proposal) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    try {
      await fetchApi(`/api/proposals/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Proposal) => {
    setSelectedRow(row);
    setForm({
      title: row.title ?? "",
      leadId: row.leadId ?? "",
      value: row.value != null ? String(row.value) : "",
      currency: row.currency ?? "USD",
      description: row.description ?? "",
      validUntil: row.validUntil ? row.validUntil.substring(0, 10) : "",
      status: row.status ?? "Draft",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Proposal) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<Proposal>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "linkedToName",
      label: "Lead",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      render: (value: number) => (value != null ? value.toLocaleString() : "-"),
    },
    {
      key: "currency",
      label: "Currency",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(value)}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "validUntil",
      label: "Valid Until",
      sortable: true,
      render: (value: string) => {
        if (!value) return "-";
        const date = new Date(value);
        const now = new Date();
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / 86400000);
        const isPastDue = daysUntil < 0;
        const isExpiringSoon = daysUntil >= 0 && daysUntil <= 7;
        return (
          <span className={isPastDue ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : ""}>
            {formatDate(value)}
            {isPastDue && <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Expired</span>}
            {isExpiringSoon && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{daysUntil}d left</span>}
          </span>
        );
      },
    },
    {
      key: "owner",
      label: "Owner",
      sortable: false,
      render: (_value: unknown, row: Proposal) =>
        row.owner
          ? `${row.owner.firstName ?? ""} ${row.owner.lastName ?? ""}`.trim()
          : "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Proposal Information",
          fields: [
            { label: "Title", value: selectedRow.title },
            { label: "Lead", value: selectedRow.linkedToName },
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
            },
            { label: "Description", value: selectedRow.description },
          ],
        },
        {
          title: "Financial Details",
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
              label: "Valid Until",
              value: selectedRow.validUntil
                ? `${formatDate(selectedRow.validUntil)}${new Date(selectedRow.validUntil) < new Date() ? "  EXPIRED" : ""}`
                : null,
              isBadge: !!(selectedRow.validUntil && new Date(selectedRow.validUntil) < new Date()),
              badgeColor: selectedRow.validUntil && new Date(selectedRow.validUntil) < new Date() ? "red" : undefined,
            },
          ],
        },
        {
          title: "System Information",
          fields: [
            { label: "Remarks", value: selectedRow.remarks },
            { label: "Created By", value: selectedRow.createdByName },
            {
              label: "Created At",
              value: selectedRow.createdAt
                ? formatDate(selectedRow.createdAt)
                : null,
            },
            {
              label: "Updated At",
              value: selectedRow.updatedAt
                ? formatDate(selectedRow.updatedAt)
                : null,
            },
            {
              label: "Owner",
              value: selectedRow.owner
                ? `${selectedRow.owner.firstName ?? ""} ${selectedRow.owner.lastName ?? ""}`.trim()
                : null,
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
        placeholder="Enter proposal title"
      />
      <FormField
        label="Lead"
        name="leadId"
        type="select"
        value={form.leadId}
        onChange={handleFieldChange}
        required
        options={(() => {
          const opts = newLeads.map((l) => ({
            label: formatLeadOptionLabel(l),
            value: l.id,
          }));
          // When editing an existing proposal whose lead is no longer "New",
          // include it in the dropdown so the value is preserved.
          if (
            selectedRow?.lead &&
            selectedRow.leadId &&
            !opts.some((o) => o.value === selectedRow.leadId)
          ) {
            opts.unshift({
              label: formatLeadOptionLabel(selectedRow.lead),
              value: selectedRow.leadId,
            });
          }
          return opts;
        })()}
      />
      <FormField
        label="Value"
        name="value"
        type="number"
        value={form.value}
        onChange={handleFieldChange}
        placeholder="Enter value"
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
        label="Valid Until"
        name="validUntil"
        type="date"
        value={form.validUntil}
        onChange={handleFieldChange}
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
          { label: "Accepted", value: "Accepted" },
          { label: "Rejected", value: "Rejected" },
        ]}
      />
      <div className="md:col-span-2">
        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={handleFieldChange}
          placeholder="Enter description"
        />
      </div>
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
      <DataTable<Proposal>
        moduleName="Proposal"
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
        title="Create Proposal"
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
        title="Edit Proposal"
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
        title="Proposal Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <>
            {selectedRow.status === "Accepted" && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => router.push(`/contracts?fromProposal=${selectedRow.id}&accountId=${selectedRow.accountId}&title=${encodeURIComponent(selectedRow.title)}&value=${selectedRow.value || ""}&currency=${selectedRow.currency || ""}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Create Contract from Proposal &rarr;
                </button>
              </div>
            )}
            <ActivityTimeline relatedToType="Proposal" relatedToId={selectedRow.id} />
            <DocumentUpload relatedToType="Proposal" relatedToId={selectedRow.id} relatedToName={selectedRow.title} proposalId={selectedRow.id} />
            <EmailLogPanel relatedToType="Proposal" relatedToId={selectedRow.id} relatedToName={selectedRow.title} proposalId={selectedRow.id} />
          </>
        )}
      </ReadView>
    </div>
  );
}
