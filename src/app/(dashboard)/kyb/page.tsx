"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Account {
  id: string;
  accountName: string;
}

interface KybItem {
  id: string;
  documentType: string;
  documentName?: string;
  status: string;
  isUploaded: boolean;
  fileUrl?: string;
  fileName?: string;
  remarks?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  accountId: string;
  account?: Account;
  createdByName?: string;
  createdAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  accountId: "",
  documentType: "",
  documentName: "",
  fileUrl: "",
  fileName: "",
  remarks: "",
};

export default function KybPage() {
  const { fetchApi } = useApi();
  const searchParams = useSearchParams();

  const [data, setData] = useState<KybItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<KybItem | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);

  // Handle accountId query param from Contracts page
  useEffect(() => {
    const accountIdParam = searchParams.get("accountId");
    if (accountIdParam) {
      setForm((prev: any) => ({ ...prev, accountId: accountIdParam }));
      // Clean URL
      window.history.replaceState({}, "", "/kyb");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: KybItem[]; total: number }>(
        `/api/kyb?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
      const res = await fetchApi<{ data: Account[] }>("/api/accounts?limit=1000");
      setAccounts(res.data ?? []);
    } catch {
      setAccounts([]);
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchApi("/api/kyb", {
        method: "POST",
        body: JSON.stringify(form),
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
      await fetchApi(`/api/kyb/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
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

  const handleDelete = async (row: KybItem) => {
    if (!confirm("Are you sure you want to delete this KYB item?")) return;
    try {
      await fetchApi(`/api/kyb/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: KybItem) => {
    setSelectedRow(row);
    setForm({
      accountId: row.accountId ?? "",
      documentType: row.documentType ?? "",
      documentName: row.documentName ?? "",
      fileUrl: row.fileUrl ?? "",
      fileName: row.fileName ?? "",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: KybItem) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<KybItem>[] = [
    {
      key: "accountId",
      label: "Account",
      sortable: true,
      render: (_value: string, row: KybItem) => row.account?.accountName ?? "",
    },
    { key: "documentType", label: "Document Type", sortable: true },
    { key: "documentName", label: "Document Name", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          Pending: "bg-yellow-100 text-yellow-800",
          Uploaded: "bg-blue-100 text-blue-800",
          Verified: "bg-green-100 text-green-800",
          Rejected: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
              colorMap[value] || "bg-gray-100 text-gray-800"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "isUploaded",
      label: "Uploaded",
      sortable: false,
      render: (value: boolean) => (value ? "Yes" : "No"),
    },
    { key: "verifiedBy", label: "Verified By", sortable: false },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "",
    },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Document Information",
          fields: [
            {
              label: "Account",
              value: selectedRow.account?.accountName,
            },
            { label: "Document Type", value: selectedRow.documentType },
            { label: "Document Name", value: selectedRow.documentName },
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
              badgeColor:
                selectedRow.status === "Verified"
                  ? "green"
                  : selectedRow.status === "Rejected"
                  ? "red"
                  : selectedRow.status === "Uploaded"
                  ? "blue"
                  : "yellow",
            },
            {
              label: "Uploaded",
              value: selectedRow.isUploaded ? "Yes" : "No",
            },
            { label: "File URL", value: selectedRow.fileUrl },
            { label: "File Name", value: selectedRow.fileName },
            { label: "Remarks", value: selectedRow.remarks },
          ],
        },
        {
          title: "Verification Details",
          fields: [
            { label: "Verified By", value: selectedRow.verifiedBy },
            {
              label: "Verified At",
              value: selectedRow.verifiedAt
                ? new Date(selectedRow.verifiedAt).toLocaleString()
                : undefined,
            },
          ],
        },
        {
          title: "System Information",
          fields: [
            { label: "Created By", value: selectedRow.createdByName },
            {
              label: "Created At",
              value: selectedRow.createdAt
                ? new Date(selectedRow.createdAt).toLocaleString()
                : undefined,
            },
          ],
        },
      ]
    : [];

  const accountOptions = accounts.map((a) => ({
    label: a.accountName,
    value: a.id,
  }));

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Account"
        name="accountId"
        type="select"
        value={form.accountId}
        onChange={handleFieldChange}
        options={accountOptions}
        required
      />
      <FormField
        label="Document Type"
        name="documentType"
        type="select"
        value={form.documentType}
        onChange={handleFieldChange}
        required
        options={[
          { label: "Trade License", value: "Trade License" },
          { label: "Tax Certificate", value: "Tax Certificate" },
          { label: "Bank Reference Letter", value: "Bank Reference Letter" },
          { label: "Company Profile", value: "Company Profile" },
          { label: "ID Proof", value: "ID Proof" },
          { label: "Agreement", value: "Agreement" },
          { label: "Other", value: "Other" },
        ]}
      />
      <FormField
        label="Document Name"
        name="documentName"
        value={form.documentName}
        onChange={handleFieldChange}
        placeholder="Enter document name"
      />
      <FormField
        label="File URL"
        name="fileUrl"
        value={form.fileUrl}
        onChange={handleFieldChange}
        placeholder="Enter file URL"
      />
      <FormField
        label="File Name"
        name="fileName"
        value={form.fileName}
        onChange={handleFieldChange}
        placeholder="Enter file name"
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
      <DataTable<KybItem>
        moduleName="KYB Checklist"
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
        title="Create KYB Item"
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
        title="Edit KYB Item"
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
        title="KYB Item Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <div className="mt-4">
            <button
              onClick={async () => {
                try {
                  const allItems = await fetchApi<any>(`/api/kyb?accountId=${selectedRow.accountId}&limit=100`);
                  const items = allItems.data || [];
                  const allVerified = items.length > 0 && items.every((i: any) => i.status === "Verified");
                  if (allVerified) {
                    await fetchApi(`/api/accounts/${selectedRow.accountId}`, { method: "PUT", body: JSON.stringify({ accountStatus: "Onboarded" }) });
                    alert("Account marked as Onboarded!");
                  } else {
                    alert(`Not all KYB documents are verified yet. ${items.filter((i: any) => i.status !== "Verified").length} pending.`);
                  }
                } catch (e) { console.error(e); }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Mark Account as Onboarded
            </button>
          </div>
        )}
      </ReadView>
    </div>
  );
}
