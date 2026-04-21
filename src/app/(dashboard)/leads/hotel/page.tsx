"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CategoryKind = "hotels" | "carRentals" | "excursions" | "packages" | "other";

interface CategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface AccountOption {
  id: string;
  accountName: string;
  accountType?: string;
}

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Lead {
  id: string;
  leadType: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  leadStatus: string;
  productDetails?: Record<string, string> | null;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectCategoryKind(categoryName: string): CategoryKind {
  const c = (categoryName || "").toLowerCase();
  if (c.includes("hotel")) return "hotels";
  if (c.includes("car")) return "carRentals";
  if (c.includes("excursion")) return "excursions";
  if (c.includes("package")) return "packages";
  return "other";
}

function hasClientType(kind: CategoryKind): boolean {
  return kind === "hotels" || kind === "excursions" || kind === "packages";
}

const INITIAL_FORM: Record<string, string> = {
  category: "",
  productId: "",
  clientType: "",
  corporateAccountId: "",
  contactId: "",

  // Hotels
  checkInDate: "",
  checkOutDate: "",
  adults: "",
  children: "",
  rooms: "",

  // Car Rentals
  pickupDate: "",
  pickupTime: "",
  numberOfHours: "",
  pickupLocation: "",
  dropoffLocation: "",

  // Excursions
  excursionDate: "",
  preferredTimings: "",
  infants: "",

  // Packages
  travelStartDate: "",

  notes: "",
  leadStatus: "New",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LeadsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Lead | null>(null);
  const [form, setForm] = useState<Record<string, string>>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [catRes, prodRes, acctRes, contactRes] = await Promise.all([
          fetchApi<{ data: CategoryOption[] }>(`/api/product-categories?activeOnly=true`),
          fetchApi<{ data: ProductOption[] }>(`/api/products?page=1&limit=500`),
          fetchApi<{ data: AccountOption[] }>(`/api/accounts?accountType=Corporate&page=1&limit=500`),
          fetchApi<{ data: ContactOption[] }>(`/api/contacts?page=1&limit=500`),
        ]);
        setCategories(catRes.data ?? []);
        setProducts(prodRes.data ?? []);
        setAccounts(acctRes.data ?? []);
        setContacts(contactRes.data ?? []);
      } catch {
        // ignore
      }
    };
    loadAll();
  }, [fetchApi]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Lead[]; total: number }>(
        `/api/leads?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const kind = detectCategoryKind(form.category);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === form.category),
    [products, form.category]
  );

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [name]: String(value) };
      if (name === "category") {
        next.productId = "";
        next.clientType = "";
        next.corporateAccountId = "";
        next.contactId = "";
      }
      if (name === "clientType") {
        next.corporateAccountId = "";
        next.contactId = "";
      }
      return next;
    });
  };

  function buildPayload(): Record<string, unknown> {
    let firstName = "";
    let lastName = "";
    let email: string | undefined;
    let phone: string | undefined;
    let company: string | undefined;

    if (form.clientType === "Corporate" && form.corporateAccountId) {
      const acct = accounts.find((a) => a.id === form.corporateAccountId);
      if (acct) {
        company = acct.accountName;
        firstName = acct.accountName;
        lastName = "";
      }
    } else if (form.clientType === "Retail" && form.contactId) {
      const c = contacts.find((x) => x.id === form.contactId);
      if (c) {
        firstName = c.firstName;
        lastName = c.lastName;
        email = c.email;
        phone = c.phone;
      }
    }
    if (!firstName) {
      const p = products.find((x) => x.id === form.productId);
      firstName = p?.name ?? "Booking";
      lastName = "";
    }

    const productDetails: Record<string, string> = {};
    const keep = (k: string) => {
      if (form[k]) productDetails[k] = form[k];
    };
    keep("category");
    keep("productId");
    keep("clientType");
    keep("corporateAccountId");
    keep("contactId");
    keep("notes");
    const productName = products.find((p) => p.id === form.productId)?.name;
    if (productName) productDetails.productName = productName;

    if (kind === "hotels") {
      ["checkInDate", "checkOutDate", "adults", "children", "rooms"].forEach(keep);
    } else if (kind === "carRentals") {
      ["pickupDate", "pickupTime", "numberOfHours", "pickupLocation", "dropoffLocation"].forEach(keep);
    } else if (kind === "excursions") {
      ["excursionDate", "preferredTimings", "adults", "children", "infants"].forEach(keep);
    } else if (kind === "packages") {
      ["travelStartDate", "adults", "children", "infants"].forEach(keep);
    }

    return {
      leadType: form.category || "Other",
      firstName,
      lastName,
      email,
      phone,
      company,
      leadStatus: form.leadStatus || "New",
      productDetails,
    };
  }

  const validate = (): string | null => {
    if (!form.category) return "Category is required";
    if (!form.productId) return "Product is required";
    if (hasClientType(kind)) {
      if (!form.clientType) return "Client Type is required";
      if (form.clientType === "Corporate" && !form.corporateAccountId) {
        return "Corporate Account is required";
      }
      if (form.clientType === "Retail" && !form.contactId) {
        return "Retail Contact is required";
      }
    }
    if (kind === "hotels") {
      if (!form.checkInDate || !form.checkOutDate) return "Check-in and Check-out dates are required";
    }
    if (kind === "carRentals") {
      if (!form.pickupDate || !form.pickupTime || !form.pickupLocation) {
        return "Pick-up Date, Time, and Location are required";
      }
    }
    if (kind === "excursions" && !form.excursionDate) {
      return "Excursion Date is required";
    }
    if (kind === "packages" && !form.travelStartDate) {
      return "Travel Start Date is required";
    }
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) return alert(err);
    setSaving(true);
    try {
      await fetchApi("/api/leads", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
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
    const err = validate();
    if (err) return alert(err);
    setSaving(true);
    try {
      await fetchApi(`/api/leads/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
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

  const handleDelete = async (row: Lead) => {
    if (!confirm(`Delete this lead? This cannot be undone.`)) return;
    try {
      await fetchApi(`/api/leads/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // ignore
    }
  };

  const openEdit = (row: Lead) => {
    setSelectedRow(row);
    const d = (row.productDetails as Record<string, string>) || {};
    setForm({
      ...INITIAL_FORM,
      category: d.category ?? "",
      productId: d.productId ?? "",
      clientType: d.clientType ?? "",
      corporateAccountId: d.corporateAccountId ?? "",
      contactId: d.contactId ?? "",
      checkInDate: d.checkInDate ?? "",
      checkOutDate: d.checkOutDate ?? "",
      adults: d.adults ?? "",
      children: d.children ?? "",
      rooms: d.rooms ?? "",
      pickupDate: d.pickupDate ?? "",
      pickupTime: d.pickupTime ?? "",
      numberOfHours: d.numberOfHours ?? "",
      pickupLocation: d.pickupLocation ?? "",
      dropoffLocation: d.dropoffLocation ?? "",
      excursionDate: d.excursionDate ?? "",
      preferredTimings: d.preferredTimings ?? "",
      infants: d.infants ?? "",
      travelStartDate: d.travelStartDate ?? "",
      notes: d.notes ?? "",
      leadStatus: row.leadStatus ?? "New",
    });
    setEditOpen(true);
  };

  const openRead = (row: Lead) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Lead>[] = [
    { key: "leadType", label: "Category", sortable: true },
    {
      key: "productDetails",
      label: "Product",
      sortable: false,
      render: (value: Record<string, string> | null) => value?.productName ?? "—",
    },
    {
      key: "firstName",
      label: "Client",
      sortable: true,
      render: (_v, row) => {
        if (row.company) return row.company;
        return `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "—";
      },
    },
    {
      key: "leadStatus",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
  ];

  const readSections = selectedRow
    ? (() => {
        const d = (selectedRow.productDetails as Record<string, string>) || {};
        const rowKind = detectCategoryKind(selectedRow.leadType);

        const baseFields: { label: string; value: string }[] = [
          { label: "Category", value: selectedRow.leadType },
          { label: "Product", value: d.productName ?? "—" },
        ];
        if (d.clientType) {
          baseFields.push({ label: "Client Type", value: d.clientType });
        }
        baseFields.push({
          label: "Client",
          value: selectedRow.company
            ? selectedRow.company
            : `${selectedRow.firstName ?? ""} ${selectedRow.lastName ?? ""}`.trim() || "—",
        });

        const detailFields: { label: string; value: string }[] = [];
        if (rowKind === "hotels") {
          detailFields.push(
            { label: "Check-in Date", value: d.checkInDate ?? "" },
            { label: "Check-out Date", value: d.checkOutDate ?? "" },
            { label: "Adults", value: d.adults ?? "" },
            { label: "Children", value: d.children ?? "" },
            { label: "Rooms", value: d.rooms ?? "" }
          );
        } else if (rowKind === "carRentals") {
          detailFields.push(
            { label: "Pick-up Date", value: d.pickupDate ?? "" },
            { label: "Pick-up Time", value: d.pickupTime ?? "" },
            { label: "Number of Hours", value: d.numberOfHours ?? "" },
            { label: "Pick-up Location", value: d.pickupLocation ?? "" },
            { label: "Drop-off Location", value: d.dropoffLocation ?? "" }
          );
        } else if (rowKind === "excursions") {
          detailFields.push(
            { label: "Excursion Date", value: d.excursionDate ?? "" },
            { label: "Preferred Timings", value: d.preferredTimings ?? "" },
            { label: "Adults", value: d.adults ?? "" },
            { label: "Children", value: d.children ?? "" },
            { label: "Infants", value: d.infants ?? "" }
          );
        } else if (rowKind === "packages") {
          detailFields.push(
            { label: "Travel Start Date", value: d.travelStartDate ?? "" },
            { label: "Adults", value: d.adults ?? "" },
            { label: "Children", value: d.children ?? "" },
            { label: "Infants", value: d.infants ?? "" }
          );
        }

        return [
          { title: "Lead Info", fields: baseFields },
          ...(detailFields.length ? [{ title: "Booking Details", fields: detailFields }] : []),
          { title: "Notes", fields: [{ label: "Notes", value: d.notes ?? "" }] },
        ];
      })()
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

      {form.category && (
        <FormField
          label="Product"
          name="productId"
          type="select"
          value={form.productId}
          onChange={handleFieldChange}
          required
          options={filteredProducts.map((p) => ({ label: p.name, value: p.id }))}
        />
      )}

      {form.category && hasClientType(kind) && (
        <>
          <FormField
            label="Client Type"
            name="clientType"
            type="select"
            value={form.clientType}
            onChange={handleFieldChange}
            required
            options={[
              { label: "Corporate Client", value: "Corporate" },
              { label: "Retail Client", value: "Retail" },
            ]}
          />
          {form.clientType === "Corporate" && (
            <FormField
              label="Corporate Account"
              name="corporateAccountId"
              type="select"
              value={form.corporateAccountId}
              onChange={handleFieldChange}
              required
              options={accounts.map((a) => ({ label: a.accountName, value: a.id }))}
            />
          )}
          {form.clientType === "Retail" && (
            <FormField
              label="Retail Contact"
              name="contactId"
              type="select"
              value={form.contactId}
              onChange={handleFieldChange}
              required
              options={contacts.map((c) => ({
                label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ""}`,
                value: c.id,
              }))}
            />
          )}
        </>
      )}

      {kind === "hotels" && form.productId && (
        <>
          <FormField label="Check-in Date" name="checkInDate" type="date" value={form.checkInDate} onChange={handleFieldChange} required />
          <FormField label="Check-out Date" name="checkOutDate" type="date" value={form.checkOutDate} onChange={handleFieldChange} required />
          <FormField label="Adults" name="adults" type="number" value={form.adults} onChange={handleFieldChange} />
          <FormField label="Children" name="children" type="number" value={form.children} onChange={handleFieldChange} />
          <FormField label="Rooms" name="rooms" type="number" value={form.rooms} onChange={handleFieldChange} />
        </>
      )}

      {kind === "carRentals" && form.productId && (
        <>
          <FormField label="Pick-up Date" name="pickupDate" type="date" value={form.pickupDate} onChange={handleFieldChange} required />
          <FormField label="Pick-up Time" name="pickupTime" value={form.pickupTime} onChange={handleFieldChange} required placeholder="e.g. 14:30" />
          <FormField label="Number of Hours" name="numberOfHours" type="number" value={form.numberOfHours} onChange={handleFieldChange} />
          <FormField label="Pick-up Location" name="pickupLocation" value={form.pickupLocation} onChange={handleFieldChange} required />
          <FormField label="Drop-off Location" name="dropoffLocation" value={form.dropoffLocation} onChange={handleFieldChange} />
        </>
      )}

      {kind === "excursions" && form.productId && (
        <>
          <FormField label="Excursion Date" name="excursionDate" type="date" value={form.excursionDate} onChange={handleFieldChange} required />
          <FormField label="Preferred Timings" name="preferredTimings" value={form.preferredTimings} onChange={handleFieldChange} placeholder="e.g. Morning, Afternoon" />
          <FormField label="Adults" name="adults" type="number" value={form.adults} onChange={handleFieldChange} />
          <FormField label="Children" name="children" type="number" value={form.children} onChange={handleFieldChange} />
          <FormField label="Infants" name="infants" type="number" value={form.infants} onChange={handleFieldChange} />
        </>
      )}

      {kind === "packages" && form.productId && (
        <>
          <FormField label="Travel Start Date" name="travelStartDate" type="date" value={form.travelStartDate} onChange={handleFieldChange} required />
          <FormField label="Adults" name="adults" type="number" value={form.adults} onChange={handleFieldChange} />
          <FormField label="Children" name="children" type="number" value={form.children} onChange={handleFieldChange} />
          <FormField label="Infants" name="infants" type="number" value={form.infants} onChange={handleFieldChange} />
        </>
      )}

      <FormField
        label="Status"
        name="leadStatus"
        type="select"
        value={form.leadStatus}
        onChange={handleFieldChange}
        options={[
          { label: "New", value: "New" },
          { label: "Quotation Sent", value: "Quotation Sent" },
          { label: "Closed", value: "Closed" },
          { label: "Lost", value: "Lost" },
        ]}
      />

      <div className="md:col-span-2">
        <FormField
          label="Notes"
          name="notes"
          type="textarea"
          value={form.notes}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Lead>
        moduleName="Lead"
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

      <FormModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Lead" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Create"}</button>
        </div>
      </FormModal>

      <FormModal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Lead" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Update"}</button>
        </div>
      </FormModal>

      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Lead Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
