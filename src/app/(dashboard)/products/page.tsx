"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  status: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

const INITIAL_FORM: Record<string, string> = {
  category: "",
  name: "",
  price: "",
  imageUrl: "",
  description: "",
  status: "Active",
};

export default function ProductsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Product | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Load categories from Product Configuration
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchApi<{ data: CategoryOption[] }>(
          `/api/product-categories?activeOnly=true`
        );
        setCategories(res.data ?? []);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, [fetchApi]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Product[]; total: number }>(
        `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
    if (!form.category.trim()) return alert("Category is required");
    if (!form.name.trim()) return alert("Name is required");
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) {
      return alert("Price must be a valid non-negative number");
    }
    setSaving(true);
    try {
      await fetchApi("/api/products", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price: Number(form.price),
          imageUrl: form.imageUrl || undefined,
          description: form.description || undefined,
          status: form.status || "Active",
        }),
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
    if (form.price !== "" && (isNaN(Number(form.price)) || Number(form.price) < 0)) {
      return alert("Price must be a valid non-negative number");
    }
    setSaving(true);
    try {
      await fetchApi(`/api/products/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price: Number(form.price),
          imageUrl: form.imageUrl || undefined,
          description: form.description || undefined,
          status: form.status,
        }),
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

  const handleDelete = async (row: Product) => {
    if (!confirm(`Delete product "${row.name}"? This cannot be undone.`)) return;
    try {
      await fetchApi(`/api/products/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Product) => {
    setSelectedRow(row);
    setForm({
      category: row.category ?? "",
      name: row.name ?? "",
      price: row.price != null ? String(row.price) : "",
      imageUrl: row.imageUrl ?? "",
      description: row.description ?? "",
      status: row.status ?? "Active",
    });
    setEditOpen(true);
  };

  const openRead = (row: Product) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: "imageUrl",
      label: "Image",
      sortable: false,
      render: (value: string | null) =>
        value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="w-10 h-10 object-cover rounded-md border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200" />
        ),
    },
    { key: "name", label: "Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    {
      key: "price",
      label: "Price ($)",
      sortable: true,
      render: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: "status",
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
          title: "Product Details",
          fields: [
            { label: "Name", value: selectedRow.name },
            { label: "Category", value: selectedRow.category },
            {
              label: "Price",
              value:
                selectedRow.price != null
                  ? `$${Number(selectedRow.price).toFixed(2)}`
                  : "",
            },
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
              badgeColor: selectedRow.status === "Active" ? "green" : "gray",
            },
            { label: "Description", value: selectedRow.description ?? "" },
            { label: "Image URL", value: selectedRow.imageUrl ?? "" },
          ],
        },
        {
          title: "Audit",
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
        label="Category"
        name="category"
        type="select"
        value={form.category}
        onChange={handleFieldChange}
        required
        options={categories.map((c) => ({ label: c.name, value: c.name }))}
      />
      <FormField
        label="Name"
        name="name"
        value={form.name}
        onChange={handleFieldChange}
        required
        placeholder="Enter product name"
      />
      <FormField
        label="Price ($)"
        name="price"
        type="number"
        value={form.price}
        onChange={handleFieldChange}
        required
        placeholder="0.00"
      />
      <FormField
        label="Status"
        name="status"
        type="select"
        value={form.status}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />
      <div className="md:col-span-2">
        <FormField
          label="Product Image URL"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleFieldChange}
          placeholder="https://..."
        />
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt="Preview"
            className="mt-2 w-24 h-24 object-cover rounded-md border border-gray-200"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
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
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Product>
        moduleName="Product"
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
        title="Create Product"
        size="lg"
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
        title="Edit Product"
        size="lg"
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
        title="Product Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
