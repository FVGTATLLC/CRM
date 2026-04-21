"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Country {
  id: string;
  countryName: string;
  continent?: string;
  subContinent?: string;
  countryCodeISO2?: string;
  countryCodeISO3?: string;
  countryDialingCode?: string;
  countryPresenceStatus?: string;
  countryStatus: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  countryName: "",
  continent: "",
  subContinent: "",
  countryCodeISO2: "",
  countryCodeISO3: "",
  countryDialingCode: "",
  countryPresenceStatus: "No",
  countryStatus: "Active",
  remarks: "",
};

export default function CountriesPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Country[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Country | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Country[]; total: number }>(
        `/api/countries?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
      await fetchApi("/api/countries", {
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
      await fetchApi(`/api/countries/${selectedRow.id}`, {
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

  const handleDelete = async (row: Country) => {
    if (!confirm("Are you sure you want to delete this country?")) return;
    try {
      await fetchApi(`/api/countries/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Country) => {
    setSelectedRow(row);
    setForm({
      countryName: row.countryName ?? "",
      continent: row.continent ?? "",
      subContinent: row.subContinent ?? "",
      countryCodeISO2: row.countryCodeISO2 ?? "",
      countryCodeISO3: row.countryCodeISO3 ?? "",
      countryDialingCode: row.countryDialingCode ?? "",
      countryPresenceStatus: row.countryPresenceStatus ?? "No",
      countryStatus: row.countryStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Country) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Country>[] = [
    { key: "countryName", label: "Country Name", sortable: true },
    { key: "continent", label: "Continent", sortable: true },
    { key: "countryCodeISO2", label: "ISO2", sortable: true },
    { key: "countryCodeISO3", label: "ISO3", sortable: true },
    { key: "countryDialingCode", label: "Dialing Code", sortable: true },
    {
      key: "countryPresenceStatus",
      label: "Presence",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            value === "Yes"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "countryStatus",
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
            { label: "Country Name", value: selectedRow.countryName },
            { label: "Continent", value: selectedRow.continent },
            { label: "Sub-Continent", value: selectedRow.subContinent },
            { label: "ISO2 Code", value: selectedRow.countryCodeISO2 },
            { label: "ISO3 Code", value: selectedRow.countryCodeISO3 },
            { label: "Dialing Code", value: selectedRow.countryDialingCode },
            {
              label: "Presence",
              value: selectedRow.countryPresenceStatus,
              isBadge: true,
              badgeColor:
                selectedRow.countryPresenceStatus === "Yes" ? "green" : "red",
            },
            {
              label: "Status",
              value: selectedRow.countryStatus,
              isBadge: true,
              badgeColor:
                selectedRow.countryStatus === "Active" ? "green" : "gray",
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

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Country Name"
        name="countryName"
        value={form.countryName}
        onChange={handleFieldChange}
        required
        placeholder="Enter country name"
      />
      <FormField
        label="Continent"
        name="continent"
        value={form.continent}
        onChange={handleFieldChange}
        placeholder="e.g. Asia, Europe"
      />
      <FormField
        label="Sub-Continent"
        name="subContinent"
        value={form.subContinent}
        onChange={handleFieldChange}
        placeholder="e.g. South Asia"
      />
      <FormField
        label="ISO2 Code"
        name="countryCodeISO2"
        value={form.countryCodeISO2}
        onChange={handleFieldChange}
        placeholder="e.g. IN, US"
      />
      <FormField
        label="ISO3 Code"
        name="countryCodeISO3"
        value={form.countryCodeISO3}
        onChange={handleFieldChange}
        placeholder="e.g. IND, USA"
      />
      <FormField
        label="Dialing Code"
        name="countryDialingCode"
        value={form.countryDialingCode}
        onChange={handleFieldChange}
        placeholder="e.g. +91, +1"
      />
      <FormField
        label="Presence Status"
        name="countryPresenceStatus"
        type="select"
        value={form.countryPresenceStatus}
        onChange={handleFieldChange}
        options={[
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ]}
      />
      <FormField
        label="Status"
        name="countryStatus"
        type="select"
        value={form.countryStatus}
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
      <DataTable<Country>
        moduleName="Country"
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
        title="Create Country"
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
        title="Edit Country"
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
        title="Country Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
