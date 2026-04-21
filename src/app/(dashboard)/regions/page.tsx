"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface Region {
  id: string;
  regionName: string;
  regionCode?: string;
  regionalManager?: string;
  businessLineId?: string;
  businessLine?: { businessLineName: string };
  regionStatus: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface BusinessLineOption {
  id: string;
  businessLineName: string;
}

const INITIAL_FORM: Record<string, string> = {
  regionName: "",
  regionCode: "",
  regionalManager: "",
  businessLineId: "",
  regionStatus: "Active",
  remarks: "",
};

export default function RegionsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Region[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Region | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [businessLines, setBusinessLines] = useState<BusinessLineOption[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Region[]; total: number }>(
        `/api/regions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const fetchBusinessLines = useCallback(async () => {
    try {
      const res = await fetchApi<{ data: BusinessLineOption[] }>(
        "/api/business-lines?limit=500"
      );
      setBusinessLines(res.data ?? []);
    } catch {
      setBusinessLines([]);
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchBusinessLines();
  }, [fetchBusinessLines]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchApi("/api/regions", {
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
      await fetchApi(`/api/regions/${selectedRow.id}`, {
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

  const handleDelete = async (row: Region) => {
    if (!confirm("Are you sure you want to delete this region?")) return;
    try {
      await fetchApi(`/api/regions/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Region) => {
    setSelectedRow(row);
    setForm({
      regionName: row.regionName ?? "",
      regionCode: row.regionCode ?? "",
      regionalManager: row.regionalManager ?? "",
      businessLineId: row.businessLineId ?? "",
      regionStatus: row.regionStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Region) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Region>[] = [
    { key: "regionName", label: "Region Name", sortable: true },
    { key: "regionCode", label: "Region Code", sortable: true },
    { key: "regionalManager", label: "Regional Manager", sortable: true },
    {
      key: "businessLine.businessLineName",
      label: "Business Line",
      sortable: false,
    },
    {
      key: "regionStatus",
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

  const readSections = selectedRow
    ? [
        {
          title: "Basic Information",
          fields: [
            { label: "Region Name", value: selectedRow.regionName },
            { label: "Region Code", value: selectedRow.regionCode },
            { label: "Regional Manager", value: selectedRow.regionalManager },
            {
              label: "Business Line",
              value: selectedRow.businessLine?.businessLineName,
            },
            {
              label: "Status",
              value: selectedRow.regionStatus,
              isBadge: true,
              badgeColor:
                selectedRow.regionStatus === "Active" ? "green" : "gray",
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

  const businessLineOptions = businessLines.map((bl) => ({
    label: bl.businessLineName,
    value: bl.id,
  }));

  const renderFormFields = () => (
    <div className="space-y-4">
      <FormField
        label="Region Name"
        name="regionName"
        value={form.regionName}
        onChange={handleFieldChange}
        required
        placeholder="Enter region name"
      />
      <FormField
        label="Region Code"
        name="regionCode"
        value={form.regionCode}
        onChange={handleFieldChange}
        placeholder="Enter region code"
      />
      <FormField
        label="Regional Manager"
        name="regionalManager"
        value={form.regionalManager}
        onChange={handleFieldChange}
        placeholder="Enter regional manager name"
      />
      <FormField
        label="Business Line"
        name="businessLineId"
        type="select"
        value={form.businessLineId}
        onChange={handleFieldChange}
        options={businessLineOptions}
      />
      <FormField
        label="Status"
        name="regionStatus"
        type="select"
        value={form.regionStatus}
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
      <DataTable<Region>
        moduleName="Region"
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
        title="Create Region"
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
        title="Edit Region"
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
        title="Region Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
