"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import Account360View from "@/components/account/Account360View";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface Account {
  id: string;
  accountName: string;
  accountType?: string;
  hotelName?: string;
  starRating?: number;
  numberOfRooms?: number;
  hotelChainGroup?: string;
  hotelAmenities?: string;
  roomTypes?: string;
  rateRange?: string;
  commissionStructure?: string;
  distributionChannels?: string;
  partnershipType?: string;
  segment?: string;
  subSegment?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  annualRevenue?: number;
  currency?: string;
  accountStatus: string;
  remarks?: string;
  createdAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  hotelName: "",
  starRating: "",
  numberOfRooms: "",
  city: "",
  country: "",
  hotelChainGroup: "",
  hotelAmenities: "",
  roomTypes: "",
  rateRange: "",
  commissionStructure: "",
  distributionChannels: "",
  partnershipType: "",
  annualRevenue: "",
  currency: "USD",
  phone: "",
  email: "",
  website: "",
  address: "",
  state: "",
  zipCode: "",
  segment: "",
  subSegment: "",
  accountStatus: "Pending",
  remarks: "",
};

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "Onboarded":
      return "green";
    case "Pending":
      return "yellow";
    case "Blacklisted":
      return "red";
    default:
      return "gray";
  }
}

export default function HotelAccountsPage() {
  const { fetchApi } = useApi();
  const router = useRouter();

  const [data, setData] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Account | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Account[]; total: number }>(
        `/api/accounts?accountType=Hotel&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
      const payload = {
        ...form,
        accountName: form.hotelName,
        accountType: "Hotel",
        accountStatus: form.accountStatus || "Pending",
        annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : undefined,
        starRating: form.starRating ? Number(form.starRating) : undefined,
        numberOfRooms: form.numberOfRooms ? Number(form.numberOfRooms) : undefined,
      };
      await fetchApi("/api/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
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
      const payload = {
        ...form,
        accountName: form.hotelName,
        accountType: "Hotel",
        annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : undefined,
        starRating: form.starRating ? Number(form.starRating) : undefined,
        numberOfRooms: form.numberOfRooms ? Number(form.numberOfRooms) : undefined,
      };
      await fetchApi(`/api/accounts/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
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

  const handleDelete = async (row: Account) => {
    if (!confirm("Are you sure you want to delete this hotel account?")) return;
    try {
      await fetchApi(`/api/accounts/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Account) => {
    setSelectedRow(row);
    setForm({
      hotelName: (row as any).hotelName ?? row.accountName ?? "",
      starRating: row.starRating != null ? String(row.starRating) : "",
      numberOfRooms: row.numberOfRooms != null ? String(row.numberOfRooms) : "",
      city: row.city ?? "",
      country: row.country ?? "",
      hotelChainGroup: (row as any).hotelChainGroup ?? "",
      hotelAmenities: (row as any).hotelAmenities ?? "",
      roomTypes: (row as any).roomTypes ?? "",
      rateRange: (row as any).rateRange ?? "",
      commissionStructure: (row as any).commissionStructure ?? "",
      distributionChannels: (row as any).distributionChannels ?? "",
      partnershipType: (row as any).partnershipType ?? "",
      annualRevenue: row.annualRevenue != null ? String(row.annualRevenue) : "",
      currency: row.currency ?? "USD",
      phone: row.phone ?? "",
      email: row.email ?? "",
      website: row.website ?? "",
      address: row.address ?? "",
      state: row.state ?? "",
      zipCode: row.zipCode ?? "",
      segment: row.segment ?? "",
      subSegment: row.subSegment ?? "",
      accountStatus: row.accountStatus ?? "Pending",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Account) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Account>[] = [
    {
      key: "hotelName" as keyof Account,
      label: "Hotel Name",
      sortable: true,
      render: (value: string, row: Account) => (row as any).hotelName || row.accountName || "-",
    },
    {
      key: "starRating" as keyof Account,
      label: "Star Rating",
      sortable: true,
      render: (value: number) => value ? `${"*".repeat(value)} (${value})` : "-",
    },
    {
      key: "numberOfRooms" as keyof Account,
      label: "Rooms",
      sortable: true,
    },
    { key: "city", label: "City", sortable: true },
    { key: "country", label: "Country", sortable: true },
    {
      key: "partnershipType" as keyof Account,
      label: "Partnership Type",
      sortable: false,
    },
    {
      key: "accountStatus",
      label: "Status",
      sortable: true,
      render: (value: string) => {
        const color = getStatusBadgeColor(value);
        return (
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
  ];

  const renderFormFields = () => (
    <div className="space-y-6">
      {/* Hotel Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Hotel Name" name="hotelName" value={form.hotelName} onChange={handleFieldChange} required placeholder="Enter hotel name" />
          <FormField label="Star Rating" name="starRating" type="select" value={form.starRating} onChange={handleFieldChange} required options={[
            { label: "1", value: "1" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
            { label: "5", value: "5" },
          ]} />
          <FormField label="Number of Rooms" name="numberOfRooms" type="number" value={form.numberOfRooms} onChange={handleFieldChange} required placeholder="Enter number of rooms" />
          <FormField label="City" name="city" value={form.city} onChange={handleFieldChange} required placeholder="Enter city" />
          <FormField label="Country" name="country" value={form.country} onChange={handleFieldChange} required placeholder="Enter country" />
        </div>
      </div>

      {/* Hotel Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Hotel Chain / Group" name="hotelChainGroup" value={form.hotelChainGroup} onChange={handleFieldChange} placeholder="Enter hotel chain or group" />
          <div className="md:col-span-2">
            <FormField label="Amenities" name="hotelAmenities" type="textarea" value={form.hotelAmenities} onChange={handleFieldChange} placeholder="Enter amenities" rows={2} />
          </div>
          <FormField label="Room Types" name="roomTypes" value={form.roomTypes} onChange={handleFieldChange} placeholder="Enter room types" />
          <FormField label="Rate Range" name="rateRange" value={form.rateRange} onChange={handleFieldChange} placeholder="Enter rate range" />
          <div className="md:col-span-2">
            <FormField label="Commission Structure" name="commissionStructure" type="textarea" value={form.commissionStructure} onChange={handleFieldChange} placeholder="Enter commission structure" rows={2} />
          </div>
          <FormField label="Distribution Channels" name="distributionChannels" value={form.distributionChannels} onChange={handleFieldChange} placeholder="Enter distribution channels" />
          <FormField label="Partnership Type" name="partnershipType" type="select" value={form.partnershipType} onChange={handleFieldChange} options={[
            { label: "Preferred", value: "Preferred" },
            { label: "Standard", value: "Standard" },
            { label: "Premium", value: "Premium" },
            { label: "Exclusive", value: "Exclusive" },
          ]} />
        </div>
      </div>

      {/* Financial */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Annual Revenue" name="annualRevenue" type="number" value={form.annualRevenue} onChange={handleFieldChange} placeholder="Enter annual revenue" />
          <FormField label="Currency" name="currency" type="select" value={form.currency} onChange={handleFieldChange} options={[
            { label: "USD", value: "USD" },
            { label: "AED", value: "AED" },
            { label: "GBP", value: "GBP" },
            { label: "EUR", value: "EUR" },
            { label: "KES", value: "KES" },
            { label: "INR", value: "INR" },
            { label: "THB", value: "THB" },
          ]} />
        </div>
      </div>

      {/* Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleFieldChange} placeholder="Enter phone" />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={handleFieldChange} placeholder="Enter email" />
          <FormField label="Website" name="website" value={form.website} onChange={handleFieldChange} placeholder="Enter website URL" />
          <div className="md:col-span-2">
            <FormField label="Address" name="address" type="textarea" value={form.address} onChange={handleFieldChange} placeholder="Enter address" rows={2} />
          </div>
          <FormField label="State" name="state" value={form.state} onChange={handleFieldChange} placeholder="Enter state" />
          <FormField label="Zip Code" name="zipCode" value={form.zipCode} onChange={handleFieldChange} placeholder="Enter zip code" />
        </div>
      </div>

      {/* Classification */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Segment" name="segment" value={form.segment} onChange={handleFieldChange} placeholder="Enter segment" />
          <FormField label="Sub Segment" name="subSegment" value={form.subSegment} onChange={handleFieldChange} placeholder="Enter sub segment" />
          <FormField label="Status" name="accountStatus" type="select" value={form.accountStatus} onChange={handleFieldChange} options={[
            { label: "Onboarded", value: "Onboarded" },
            { label: "Pending", value: "Pending" },
            { label: "Blacklisted", value: "Blacklisted" },
          ]} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Remarks" name="remarks" type="textarea" value={form.remarks} onChange={handleFieldChange} placeholder="Enter remarks" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Account>
        moduleName="Hotel Account"
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

      <FormModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Hotel Account" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Create"}</button>
        </div>
      </FormModal>

      <FormModal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Hotel Account" size="xl">
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Update"}</button>
        </div>
      </FormModal>

      <Account360View
        account={selectedRow}
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
        onNavigate={(module: string, id?: string) => {
          if (id) {
            router.push(`/${module}?viewId=${id}`);
          } else {
            router.push(`/${module}?accountId=${selectedRow?.id}`);
          }
        }}
      />
    </div>
  );
}
