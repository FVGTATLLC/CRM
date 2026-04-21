"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Lead {
  id: string;
  leadType?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  leadSource?: string;
  leadStatus: string;
  rating?: string;
  estimatedValue?: number;
  currency?: string;
  description?: string;
  city?: string;
  country?: string;
  remarks?: string;
  assignedToId?: string;
  formSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isConverted?: boolean;
  convertedToAccountId?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  // Hotel-specific
  hotelName?: string;
  starRating?: number;
  numberOfRooms?: number;
  hotelAmenities?: string;
  commissionStructure?: string;
  roomTypes?: string;
  rateRange?: string;
  partnershipType?: string;
  currentDistributionChannels?: string;
}

interface UserOption {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Status pipeline
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = [
  { label: "New", value: "New" },
  { label: "Contacted", value: "Contacted" },
  { label: "Inspected", value: "Inspected" },
  { label: "Onboarded", value: "Onboarded" },
  { label: "Lost", value: "Lost" },
];

// ---------------------------------------------------------------------------
// Initial form state
// ---------------------------------------------------------------------------
const INITIAL_FORM: Record<string, string> = {
  hotelName: "",
  starRating: "",
  numberOfRooms: "",
  city: "",
  country: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  hotelAmenities: "",
  commissionStructure: "",
  roomTypes: "",
  rateRange: "",
  partnershipType: "",
  currentDistributionChannels: "",
  leadSource: "",
  leadStatus: "New",
  rating: "",
  estimatedValue: "",
  currency: "USD",
  description: "",
  remarks: "",
  assignedToId: "",
  formSource: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HotelLeadsPage() {
  const { fetchApi } = useApi();
  const router = useRouter();

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
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const [users, setUsers] = useState<UserOption[]>([]);

  // ---- Fetch users for assignment dropdown -----------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi<{ data: UserOption[] }>("/api/users?limit=500");
        setUsers(res.data ?? []);
      } catch {
        setUsers([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id,
        value: u.id,
      })),
    [users]
  );

  // ---- Fetch leads -----------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/leads?leadType=Hotel&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await fetchApi<{ data: Lead[]; total: number }>(url);
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

  // ---- Field change handler --------------------------------------------------
  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  // ---- CRUD handlers ---------------------------------------------------------
  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        leadType: "Hotel",
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        starRating: form.starRating ? Number(form.starRating) : undefined,
        numberOfRooms: form.numberOfRooms ? Number(form.numberOfRooms) : undefined,
        assignedToId: form.assignedToId || undefined,
        formSource: form.formSource || undefined,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
      };
      await fetchApi("/api/leads", {
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
        leadType: "Hotel",
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        starRating: form.starRating ? Number(form.starRating) : undefined,
        numberOfRooms: form.numberOfRooms ? Number(form.numberOfRooms) : undefined,
        assignedToId: form.assignedToId || undefined,
        formSource: form.formSource || undefined,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
      };
      await fetchApi(`/api/leads/${selectedRow.id}`, {
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

  const handleDelete = async (row: Lead) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await fetchApi(`/api/leads/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const handleConvert = async () => {
    if (!selectedRow) return;
    if (!confirm("Convert this lead to an account? This action cannot be undone.")) return;
    setConverting(true);
    try {
      await fetchApi(`/api/leads/convert`, {
        method: "POST",
        body: JSON.stringify({ leadId: selectedRow.id }),
      });
      setReadOpen(false);
      setSelectedRow(null);
      fetchData();
      router.push("/accounts/hotel");
    } catch {
      // handle error
    } finally {
      setConverting(false);
    }
  };

  // ---- Open modals -----------------------------------------------------------
  const openEdit = (row: Lead) => {
    setSelectedRow(row);
    setForm({
      hotelName: row.hotelName ?? "",
      starRating: row.starRating != null ? String(row.starRating) : "",
      numberOfRooms: row.numberOfRooms != null ? String(row.numberOfRooms) : "",
      city: row.city ?? "",
      country: row.country ?? "",
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      jobTitle: row.jobTitle ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      hotelAmenities: row.hotelAmenities ?? "",
      commissionStructure: row.commissionStructure ?? "",
      roomTypes: row.roomTypes ?? "",
      rateRange: row.rateRange ?? "",
      partnershipType: row.partnershipType ?? "",
      currentDistributionChannels: row.currentDistributionChannels ?? "",
      leadSource: row.leadSource ?? "",
      leadStatus: row.leadStatus ?? "New",
      rating: row.rating ?? "",
      estimatedValue: row.estimatedValue != null ? String(row.estimatedValue) : "",
      currency: row.currency ?? "USD",
      description: row.description ?? "",
      remarks: row.remarks ?? "",
      assignedToId: row.assignedToId ?? "",
      formSource: row.formSource ?? "",
      utmSource: row.utmSource ?? "",
      utmMedium: row.utmMedium ?? "",
      utmCampaign: row.utmCampaign ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Lead) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  // ---- Status badge colors ---------------------------------------------------
  const statusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800";
      case "Contacted":
        return "bg-yellow-100 text-yellow-800";
      case "Inspected":
        return "bg-cyan-100 text-cyan-800";
      case "Onboarded":
        return "bg-green-100 text-green-800";
      case "Lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ---- Assigned-to display name helper ----------------------------------------
  const assignedUserName = useMemo(() => {
    if (!selectedRow?.assignedToId) return null;
    const u = users.find((u) => u.id === selectedRow.assignedToId);
    if (!u) return selectedRow.assignedToId;
    return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.id;
  }, [selectedRow, users]);

  // ---- Column definitions -----------------------------------------------------
  const columns: ColumnDef<Lead>[] = [
    {
      key: "hotelName" as keyof Lead,
      label: "Hotel Name",
      sortable: true,
    },
    {
      key: "starRating" as keyof Lead,
      label: "Star Rating",
      sortable: true,
      render: (value: number) => (value != null ? `${value} Star` : "-"),
    },
    {
      key: "numberOfRooms" as keyof Lead,
      label: "Rooms",
      sortable: true,
    },
    { key: "city" as keyof Lead, label: "City", sortable: true },
    { key: "country" as keyof Lead, label: "Country", sortable: true },
    {
      key: "firstName",
      label: "Contact",
      sortable: true,
      render: (_value: string, row: Lead) =>
        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
    },
    {
      key: "leadStatus",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(value)}`}
        >
          {value}
        </span>
      ),
    },
    { key: "leadSource", label: "Source", sortable: true },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
  ];

  // ---- ReadView sections ------------------------------------------------------
  const readSections = selectedRow
    ? [
        {
          title: "Hotel Information",
          fields: [
            { label: "Hotel Name", value: selectedRow.hotelName },
            {
              label: "Star Rating",
              value:
                selectedRow.starRating != null
                  ? `${selectedRow.starRating} Star`
                  : null,
            },
            {
              label: "Number of Rooms",
              value:
                selectedRow.numberOfRooms != null
                  ? String(selectedRow.numberOfRooms)
                  : null,
            },
            { label: "City", value: selectedRow.city },
            { label: "Country", value: selectedRow.country },
          ],
        },
        {
          title: "Primary Contact",
          fields: [
            { label: "First Name", value: selectedRow.firstName },
            { label: "Last Name", value: selectedRow.lastName },
            { label: "Job Title", value: selectedRow.jobTitle },
            { label: "Email", value: selectedRow.email },
            { label: "Phone", value: selectedRow.phone },
          ],
        },
        {
          title: "Hotel Details",
          fields: [
            { label: "Amenities", value: selectedRow.hotelAmenities },
            { label: "Commission Structure", value: selectedRow.commissionStructure },
            { label: "Room Types", value: selectedRow.roomTypes },
            { label: "Rate Range", value: selectedRow.rateRange },
            { label: "Partnership Type", value: selectedRow.partnershipType },
            { label: "Distribution Channels", value: selectedRow.currentDistributionChannels },
          ],
        },
        {
          title: "Lead Details",
          fields: [
            { label: "Lead Source", value: selectedRow.leadSource },
            {
              label: "Lead Status",
              value: selectedRow.leadStatus,
              isBadge: true,
            },
            { label: "Rating", value: selectedRow.rating },
            {
              label: "Estimated Value",
              value:
                selectedRow.estimatedValue != null
                  ? `${selectedRow.currency ?? ""} ${selectedRow.estimatedValue}`
                  : null,
            },
            { label: "Assigned To", value: assignedUserName },
          ],
        },
        {
          title: "UTM Tracking",
          fields: [
            { label: "UTM Source", value: selectedRow.utmSource },
            { label: "UTM Medium", value: selectedRow.utmMedium },
            { label: "UTM Campaign", value: selectedRow.utmCampaign },
            { label: "Form Source", value: selectedRow.formSource },
          ],
        },
        {
          title: "Conversion Status",
          fields: [
            {
              label: "Converted to Account",
              value: selectedRow.isConverted ? "Yes" : "No",
              isBadge: true,
            },
            {
              label: "Converted Account",
              value: selectedRow.convertedToAccountId ? "View Account \u2192" : "\u2014",
            },
          ],
        },
        {
          title: "System Information",
          fields: [
            { label: "Description", value: selectedRow.description },
            { label: "Remarks", value: selectedRow.remarks },
            { label: "Created By", value: selectedRow.createdBy },
            { label: "Created At", value: selectedRow.createdAt },
            { label: "Last Modified By", value: selectedRow.lastModifiedBy },
            { label: "Last Modified At", value: selectedRow.lastModifiedAt },
          ],
        },
      ]
    : [];

  // ---- Form fields renderer ---------------------------------------------------
  const renderFormFields = () => (
    <div className="space-y-6">
      {/* Hotel Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Hotel Name"
            name="hotelName"
            value={form.hotelName}
            onChange={handleFieldChange}
            required
            placeholder="Enter hotel name"
          />
          <FormField
            label="Star Rating"
            name="starRating"
            type="select"
            value={form.starRating}
            onChange={handleFieldChange}
            required
            options={[
              { label: "1", value: "1" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
              { label: "4", value: "4" },
              { label: "5", value: "5" },
            ]}
          />
          <FormField
            label="Number of Rooms"
            name="numberOfRooms"
            type="number"
            value={form.numberOfRooms}
            onChange={handleFieldChange}
            required
            placeholder="Enter number of rooms"
          />
          <FormField
            label="City"
            name="city"
            value={form.city}
            onChange={handleFieldChange}
            required
            placeholder="Enter city"
          />
          <FormField
            label="Country"
            name="country"
            value={form.country}
            onChange={handleFieldChange}
            required
            placeholder="Enter country"
          />
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleFieldChange}
            required
            placeholder="Enter first name"
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleFieldChange}
            required
            placeholder="Enter last name"
          />
          <FormField
            label="Job Title"
            name="jobTitle"
            value={form.jobTitle}
            onChange={handleFieldChange}
            required
            placeholder="Enter job title"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleFieldChange}
            required
            placeholder="Enter email"
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleFieldChange}
            required
            placeholder="Enter phone"
          />
        </div>
      </div>

      {/* Hotel Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              label="Hotel Amenities"
              name="hotelAmenities"
              type="textarea"
              value={form.hotelAmenities}
              onChange={handleFieldChange}
              placeholder="e.g. Pool, Spa, Gym, Restaurant"
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Commission Structure"
              name="commissionStructure"
              type="textarea"
              value={form.commissionStructure}
              onChange={handleFieldChange}
              placeholder="Describe commission structure"
            />
          </div>
          <FormField
            label="Room Types"
            name="roomTypes"
            value={form.roomTypes}
            onChange={handleFieldChange}
            placeholder="e.g. Standard, Deluxe, Suite"
          />
          <FormField
            label="Rate Range"
            name="rateRange"
            value={form.rateRange}
            onChange={handleFieldChange}
            placeholder="e.g. $100-$500"
          />
          <FormField
            label="Partnership Type"
            name="partnershipType"
            type="select"
            value={form.partnershipType}
            onChange={handleFieldChange}
            options={[
              { label: "Preferred", value: "Preferred" },
              { label: "Standard", value: "Standard" },
              { label: "Premium", value: "Premium" },
              { label: "Exclusive", value: "Exclusive" },
            ]}
          />
          <FormField
            label="Distribution Channels"
            name="currentDistributionChannels"
            value={form.currentDistributionChannels}
            onChange={handleFieldChange}
            placeholder="e.g. OTA, Direct, GDS"
          />
        </div>
      </div>

      {/* Lead Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Lead Source"
            name="leadSource"
            type="select"
            value={form.leadSource}
            onChange={handleFieldChange}
            required
            options={[
              { label: "Facebook Ads", value: "Facebook Ads" },
              { label: "LinkedIn Ads", value: "LinkedIn Ads" },
              { label: "Google Ads", value: "Google Ads" },
              { label: "Website", value: "Website" },
              { label: "Referral", value: "Referral" },
              { label: "Direct", value: "Direct" },
              { label: "Trade Show", value: "Trade Show" },
              { label: "Email Campaign", value: "Email Campaign" },
              { label: "Partner", value: "Partner" },
              { label: "Other", value: "Other" },
            ]}
          />
          <FormField
            label="Lead Status"
            name="leadStatus"
            type="select"
            value={form.leadStatus}
            onChange={handleFieldChange}
            options={STATUS_OPTIONS}
          />
          <FormField
            label="Rating"
            name="rating"
            type="select"
            value={form.rating}
            onChange={handleFieldChange}
            options={[
              { label: "Hot", value: "Hot" },
              { label: "Warm", value: "Warm" },
              { label: "Cold", value: "Cold" },
            ]}
          />
          <FormField
            label="Estimated Value"
            name="estimatedValue"
            type="number"
            value={form.estimatedValue}
            onChange={handleFieldChange}
            placeholder="Enter estimated value"
          />
          <FormField
            label="Currency"
            name="currency"
            type="select"
            value={form.currency}
            onChange={handleFieldChange}
            options={[
              { label: "USD", value: "USD" },
              { label: "AED", value: "AED" },
              { label: "GBP", value: "GBP" },
              { label: "EUR", value: "EUR" },
              { label: "KES", value: "KES" },
              { label: "INR", value: "INR" },
              { label: "THB", value: "THB" },
            ]}
          />
          <FormField
            label="Assigned To"
            name="assignedToId"
            type="select"
            value={form.assignedToId}
            onChange={handleFieldChange}
            options={userOptions}
          />
        </div>
      </div>

      {/* UTM */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">UTM Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="UTM Source"
            name="utmSource"
            value={form.utmSource}
            onChange={handleFieldChange}
            placeholder="e.g. google, facebook"
          />
          <FormField
            label="UTM Medium"
            name="utmMedium"
            value={form.utmMedium}
            onChange={handleFieldChange}
            placeholder="e.g. cpc, email"
          />
          <FormField
            label="UTM Campaign"
            name="utmCampaign"
            value={form.utmCampaign}
            onChange={handleFieldChange}
            placeholder="e.g. spring_promo"
          />
          <FormField
            label="Form Source"
            name="formSource"
            value={form.formSource}
            onChange={handleFieldChange}
            placeholder="e.g. Contact Us, Landing Page"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleFieldChange}
            placeholder="Enter description"
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
      </div>
    </div>
  );

  // ---- Render -----------------------------------------------------------------
  return (
    <div className="h-full flex flex-col">
      <DataTable<Lead>
        moduleName="Hotel Lead"
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
        title="Create Hotel Lead"
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

      {/* Edit Modal */}
      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Hotel Lead"
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

      {/* Read View */}
      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Hotel Lead Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <ActivityTimeline relatedToType="Lead" relatedToId={selectedRow.id} />
        )}
        {/* Convert to Account button */}
        {selectedRow && !selectedRow.isConverted && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleConvert}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {converting ? "Converting..." : "Convert to Account"}
            </button>
          </div>
        )}
      </ReadView>
    </div>
  );
}
