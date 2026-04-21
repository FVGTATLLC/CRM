"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Branch {
  id: string;
  branchCode: string;
  branchFullName: string;
  city?: string;
  businessLineId?: string;
  regionId?: string;
  countryId?: string;
  businessLine?: { businessLineName: string };
  region?: { regionName: string };
  country?: { countryName: string };
  branchStatus: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface DropdownOption {
  id: string;
  [key: string]: string;
}

const INITIAL_FORM: Record<string, string> = {
  branchCode: "",
  branchFullName: "",
  city: "",
  businessLineId: "",
  regionId: "",
  countryId: "",
  branchStatus: "Active",
  remarks: "",
};

export default function BranchesPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Branch | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [businessLines, setBusinessLines] = useState<DropdownOption[]>([]);
  const [regions, setRegions] = useState<DropdownOption[]>([]);
  const [countries, setCountries] = useState<DropdownOption[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Branch[]; total: number }>(
        `/api/branches?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const fetchDropdowns = useCallback(async () => {
    try {
      const [blRes, countryRes] = await Promise.allSettled([
        fetchApi<{ data: DropdownOption[] }>("/api/business-lines?limit=500"),
        fetchApi<{ data: DropdownOption[] }>("/api/countries?limit=500"),
      ]);
      if (blRes.status === "fulfilled") setBusinessLines(blRes.value.data ?? []);
      if (countryRes.status === "fulfilled") setCountries(countryRes.value.data ?? []);
    } catch {
      // handle error
    }
  }, [fetchApi]);

  // Cascading: fetch regions when businessLineId changes
  const fetchRegions = useCallback(
    async (businessLineId: string) => {
      if (!businessLineId) {
        setRegions([]);
        return;
      }
      try {
        const res = await fetchApi<{ data: DropdownOption[] }>(
          `/api/regions?businessLineId=${businessLineId}&limit=500`
        );
        setRegions(res.data ?? []);
      } catch {
        setRegions([]);
      }
    },
    [fetchApi]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchRegions(form.businessLineId);
  }, [form.businessLineId, fetchRegions]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [name]: String(value) };
      // Reset region when business line changes
      if (name === "businessLineId") {
        updated.regionId = "";
      }
      return updated;
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchApi("/api/branches", {
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
      await fetchApi(`/api/branches/${selectedRow.id}`, {
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

  const handleDelete = async (row: Branch) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await fetchApi(`/api/branches/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Branch) => {
    setSelectedRow(row);
    setForm({
      branchCode: row.branchCode ?? "",
      branchFullName: row.branchFullName ?? "",
      city: row.city ?? "",
      businessLineId: row.businessLineId ?? "",
      regionId: row.regionId ?? "",
      countryId: row.countryId ?? "",
      branchStatus: row.branchStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Branch) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Branch>[] = [
    { key: "branchCode", label: "Branch Code", sortable: true },
    { key: "branchFullName", label: "Branch Name", sortable: true },
    { key: "city", label: "City", sortable: true },
    { key: "businessLine.businessLineName", label: "Business Line", sortable: false },
    { key: "region.regionName", label: "Region", sortable: false },
    { key: "country.countryName", label: "Country", sortable: false },
    {
      key: "branchStatus",
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
            { label: "Branch Code", value: selectedRow.branchCode },
            { label: "Branch Name", value: selectedRow.branchFullName },
            { label: "City", value: selectedRow.city },
            {
              label: "Business Line",
              value: selectedRow.businessLine?.businessLineName,
            },
            { label: "Region", value: selectedRow.region?.regionName },
            { label: "Country", value: selectedRow.country?.countryName },
            {
              label: "Status",
              value: selectedRow.branchStatus,
              isBadge: true,
              badgeColor:
                selectedRow.branchStatus === "Active" ? "green" : "gray",
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
  const regionOptions = regions.map((r) => ({
    label: r.regionName,
    value: r.id,
  }));
  const countryOptions = countries.map((c) => ({
    label: c.countryName,
    value: c.id,
  }));

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Branch Code"
        name="branchCode"
        value={form.branchCode}
        onChange={handleFieldChange}
        required
        placeholder="Enter branch code"
      />
      <FormField
        label="Branch Full Name"
        name="branchFullName"
        value={form.branchFullName}
        onChange={handleFieldChange}
        required
        placeholder="Enter branch full name"
      />
      <FormField
        label="City"
        name="city"
        value={form.city}
        onChange={handleFieldChange}
        placeholder="Enter city"
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
        label="Region"
        name="regionId"
        type="select"
        value={form.regionId}
        onChange={handleFieldChange}
        options={regionOptions}
        disabled={!form.businessLineId}
      />
      <FormField
        label="Country"
        name="countryId"
        type="select"
        value={form.countryId}
        onChange={handleFieldChange}
        options={countryOptions}
      />
      <FormField
        label="Status"
        name="branchStatus"
        type="select"
        value={form.branchStatus}
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
      <DataTable<Branch>
        moduleName="Branch"
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
        title="Create Branch"
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
        title="Edit Branch"
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
        title="Branch Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
