"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Department {
  id: string;
  departmentName: string;
  departmentCode?: string;
  businessLineId?: string;
  businessLine?: { businessLineName: string };
  departmentStatus: string;
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
  departmentName: "",
  departmentCode: "",
  businessLineId: "",
  departmentStatus: "Active",
  remarks: "",
};

export default function DepartmentsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Department | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [businessLines, setBusinessLines] = useState<BusinessLineOption[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Department[]; total: number }>(
        `/api/departments?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
      await fetchApi("/api/departments", {
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
      await fetchApi(`/api/departments/${selectedRow.id}`, {
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

  const handleDelete = async (row: Department) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await fetchApi(`/api/departments/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Department) => {
    setSelectedRow(row);
    setForm({
      departmentName: row.departmentName ?? "",
      departmentCode: row.departmentCode ?? "",
      businessLineId: row.businessLineId ?? "",
      departmentStatus: row.departmentStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Department) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Department>[] = [
    { key: "departmentName", label: "Department Name", sortable: true },
    { key: "departmentCode", label: "Department Code", sortable: true },
    {
      key: "businessLine.businessLineName",
      label: "Business Line",
      sortable: false,
    },
    {
      key: "departmentStatus",
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
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Basic Information",
          fields: [
            { label: "Department Name", value: selectedRow.departmentName },
            { label: "Department Code", value: selectedRow.departmentCode },
            {
              label: "Business Line",
              value: selectedRow.businessLine?.businessLineName,
            },
            {
              label: "Status",
              value: selectedRow.departmentStatus,
              isBadge: true,
              badgeColor:
                selectedRow.departmentStatus === "Active" ? "green" : "gray",
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

  const blOptions = businessLines.map((bl) => ({
    label: bl.businessLineName,
    value: bl.id,
  }));

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Department Name"
        name="departmentName"
        value={form.departmentName}
        onChange={handleFieldChange}
        required
        placeholder="Enter department name"
      />
      <FormField
        label="Department Code"
        name="departmentCode"
        value={form.departmentCode}
        onChange={handleFieldChange}
        placeholder="Enter department code"
      />
      <FormField
        label="Business Line"
        name="businessLineId"
        type="select"
        value={form.businessLineId}
        onChange={handleFieldChange}
        options={blOptions}
      />
      <FormField
        label="Status"
        name="departmentStatus"
        type="select"
        value={form.departmentStatus}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
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
      <DataTable<Department>
        moduleName="Department"
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
        title="Create Department"
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
        title="Edit Department"
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
        title="Department Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
