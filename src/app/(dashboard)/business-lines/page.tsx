"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface BusinessLine {
  id: string;
  businessLineName: string;
  businessLineStatus: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  businessLineName: "",
  businessLineStatus: "Active",
  remarks: "",
};

export default function BusinessLinesPage() {
  const { fetchApi } = useApi();

  // Data state
  const [data, setData] = useState<BusinessLine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BusinessLine | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: BusinessLine[]; total: number }>(
        `/api/business-lines?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  // Form helpers
  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  // CRUD operations
  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchApi("/api/business-lines", {
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
      await fetchApi(`/api/business-lines/${selectedRow.id}`, {
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

  const handleDelete = async (row: BusinessLine) => {
    if (!confirm("Are you sure you want to delete this business line?")) return;
    try {
      await fetchApi(`/api/business-lines/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: BusinessLine) => {
    setSelectedRow(row);
    setForm({
      businessLineName: row.businessLineName ?? "",
      businessLineStatus: row.businessLineStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: BusinessLine) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  // Columns
  const columns: ColumnDef<BusinessLine>[] = [
    { key: "businessLineName", label: "Business Line Name", sortable: true },
    {
      key: "businessLineStatus",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            value === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
  ];

  // ReadView sections
  const readSections = selectedRow
    ? [
        {
          title: "Basic Information",
          fields: [
            { label: "Business Line Name", value: selectedRow.businessLineName },
            {
              label: "Status",
              value: selectedRow.businessLineStatus,
              isBadge: true,
              badgeColor:
                selectedRow.businessLineStatus === "Active" ? "green" : "gray",
            },
            { label: "Remarks", value: selectedRow.remarks },
          ],
        },
        {
          title: "System Information",
          fields: [
            { label: "Created By", value: selectedRow.createdBy },
            { label: "Created At", value: selectedRow.createdAt },
            { label: "Last Modified By", value: selectedRow.lastModifiedBy },
            { label: "Last Modified At", value: selectedRow.lastModifiedAt },
          ],
        },
      ]
    : [];

  // Form fields renderer
  const renderFormFields = () => (
    <div className="space-y-4">
      <FormField
        label="Business Line Name"
        name="businessLineName"
        value={form.businessLineName}
        onChange={handleFieldChange}
        required
        placeholder="Enter business line name"
      />
      <FormField
        label="Status"
        name="businessLineStatus"
        type="select"
        value={form.businessLineStatus}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />
      <FormField
        label="Remarks"
        name="remarks"
        type="textarea"
        value={form.remarks}
        onChange={handleFieldChange}
        placeholder="Enter remarks"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<BusinessLine>
        moduleName="Business Line"
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

      {/* Create Modal */}
      <FormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Business Line"
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

      {/* Edit Modal */}
      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Business Line"
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

      {/* Read Modal */}
      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Business Line Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
