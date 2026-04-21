"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi, useAuthStore } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdByName?: string;
  createdAt?: string;
  lastModifiedByName?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  name: "",
  description: "",
  isActive: "true",
};

export default function ProductConfigurationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchApi } = useApi();

  const [data, setData] = useState<ProductCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Guard: SuperAdmin only
  useEffect(() => {
    if (user && user.userType !== "SuperAdmin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: ProductCategory[]; total: number }>(
        `/api/product-categories`
      );
      // Client-side search/paging since list is expected small
      const all = res.data ?? [];
      const filtered = search
        ? all.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.description ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : all;
      const start = (page - 1) * limit;
      setData(filtered.slice(start, start + limit));
      setTotal(filtered.length);
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
    if (!form.name.trim()) return alert("Category name is required");
    setSaving(true);
    try {
      await fetchApi("/api/product-categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive === "true",
        }),
      });
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      fetchData();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;
    if (!form.name.trim()) return alert("Category name is required");
    setSaving(true);
    try {
      await fetchApi(`/api/product-categories/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          isActive: form.isActive === "true",
        }),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      fetchData();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ProductCategory) => {
    if (
      !confirm(
        `Delete category "${row.name}"? Products already using this category will keep the text value but no new products can be created under it.`
      )
    )
      return;
    try {
      await fetchApi(`/api/product-categories/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    }
  };

  const openEdit = (row: ProductCategory) => {
    setSelectedRow(row);
    setForm({
      name: row.name ?? "",
      description: row.description ?? "",
      isActive: row.isActive ? "true" : "false",
    });
    setEditOpen(true);
  };

  const openRead = (row: ProductCategory) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<ProductCategory>[] = [
    { key: "name", label: "Category Name", sortable: true },
    { key: "description", label: "Description", sortable: false },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value: boolean) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "createdByName", label: "Created By", sortable: true },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Category Details",
          fields: [
            { label: "Name", value: selectedRow.name },
            { label: "Description", value: selectedRow.description ?? "" },
            {
              label: "Status",
              value: selectedRow.isActive ? "Active" : "Inactive",
              isBadge: true,
              badgeColor: selectedRow.isActive ? "green" : "gray",
            },
          ],
        },
        {
          title: "Audit",
          fields: [
            { label: "Created By", value: selectedRow.createdByName },
            { label: "Created At", value: selectedRow.createdAt },
            { label: "Last Modified By", value: selectedRow.lastModifiedByName },
            { label: "Last Modified At", value: selectedRow.lastModifiedAt },
          ],
        },
      ]
    : [];

  const renderFormFields = () => (
    <div className="grid grid-cols-1 gap-4">
      <FormField
        label="Category Name"
        name="name"
        value={form.name}
        onChange={handleFieldChange}
        required
        placeholder="e.g. Flights, Hotels, Packages"
      />
      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={form.description}
        onChange={handleFieldChange}
        placeholder="Optional description"
        rows={2}
      />
      <FormField
        label="Status"
        name="isActive"
        type="select"
        value={form.isActive}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" },
        ]}
      />
    </div>
  );

  // Don't render anything while the guard redirects
  if (user && user.userType !== "SuperAdmin") {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Product Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage the categories available in the Product module. Only Super Admins can edit.
        </p>
      </div>

      <DataTable<ProductCategory>
        moduleName="Product Category"
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
        title="Add New Category"
        size="md"
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
            {saving ? "Saving..." : "Add Category"}
          </button>
        </div>
      </FormModal>

      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Category"
        size="md"
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
        title="Category Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
