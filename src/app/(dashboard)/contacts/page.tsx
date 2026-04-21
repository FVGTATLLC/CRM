"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import ActivityTimeline from "@/components/timeline/ActivityTimeline";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface AccountOption {
  id: string;
  accountName: string;
  accountType?: string;
}

interface Contact {
  id: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  contactType?: string;
  contactSource?: string;
  contactStatus: string;
  roleTag?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  remarks?: string;
  accountId?: string;
  account?: AccountOption;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  mobile: "",
  company: "",
  jobTitle: "",
  department: "",
  contactType: "",
  contactSource: "",
  contactStatus: "Active",
  roleTag: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  remarks: "",
  accountId: "",
};

function getRoleTagOptions(accountType?: string): { label: string; value: string }[] {
  switch (accountType) {
    case "Corporate":
      return [
        { label: "Admin", value: "Admin" },
        { label: "Travel Manager", value: "Travel Manager" },
        { label: "Finance Contact", value: "Finance Contact" },
        { label: "HR Contact", value: "HR Contact" },
        { label: "Executive", value: "Executive" },
      ];
    case "Hotel":
      return [
        { label: "General Manager", value: "General Manager" },
        { label: "Front Desk Manager", value: "Front Desk Manager" },
        { label: "Revenue Manager", value: "Revenue Manager" },
        { label: "Reservations Manager", value: "Reservations Manager" },
        { label: "Sales Manager", value: "Sales Manager" },
      ];
    default:
      return [
        { label: "Primary Contact", value: "Primary Contact" },
        { label: "Secondary Contact", value: "Secondary Contact" },
        { label: "Decision Maker", value: "Decision Maker" },
        { label: "Influencer", value: "Influencer" },
      ];
  }
}

export default function ContactsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Contact | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountType, setSelectedAccountType] = useState<string | undefined>(undefined);

  // Fetch accounts list for the dropdown
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetchApi<{ data: AccountOption[] }>(
          `/api/accounts?page=1&limit=500&search=`
        );
        setAccounts(res.data ?? []);
      } catch {
        setAccounts([]);
      }
    };
    loadAccounts();
  }, [fetchApi]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Contact[]; total: number }>(
        `/api/contacts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
    setForm((prev) => {
      const updated = { ...prev, [name]: String(value) };
      // When account changes, update the selected account type for roleTag options
      if (name === "accountId") {
        const account = accounts.find((a) => a.id === String(value));
        const newType = account?.accountType;
        setSelectedAccountType(newType);
        // Reset roleTag if current value is not valid for new account type
        const validOptions = getRoleTagOptions(newType);
        if (!validOptions.some((o) => o.value === prev.roleTag)) {
          updated.roleTag = "";
        }
      }
      return updated;
    });
  };

  const handleCreate = async () => {
    if (!form.accountId) {
      alert("Account is required");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/api/contacts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      setSelectedAccountType(undefined);
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
      await fetchApi(`/api/contacts/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      setSelectedAccountType(undefined);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Contact) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await fetchApi(`/api/contacts/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Contact) => {
    setSelectedRow(row);
    const acctType = row.account?.accountType || accounts.find((a) => a.id === row.accountId)?.accountType;
    setSelectedAccountType(acctType);
    setForm({
      salutation: row.salutation ?? "",
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      mobile: row.mobile ?? "",
      company: row.company ?? "",
      jobTitle: row.jobTitle ?? "",
      department: row.department ?? "",
      contactType: row.contactType ?? "",
      contactSource: row.contactSource ?? "",
      contactStatus: row.contactStatus ?? "Active",
      roleTag: row.roleTag ?? "",
      address: row.address ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      country: row.country ?? "",
      zipCode: row.zipCode ?? "",
      remarks: row.remarks ?? "",
      accountId: row.accountId ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Contact) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Contact>[] = [
    {
      key: "firstName",
      label: "Name",
      sortable: true,
      render: (_value: string, row: Contact) =>
        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone", sortable: false },
    { key: "company", label: "Company", sortable: true },
    { key: "contactType", label: "Type", sortable: true },
    { key: "roleTag", label: "Role Tag", sortable: true },
    {
      key: "contactStatus",
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
          title: "Personal Information",
          fields: [
            { label: "Salutation", value: selectedRow.salutation },
            { label: "First Name", value: selectedRow.firstName },
            { label: "Last Name", value: selectedRow.lastName },
            { label: "Email", value: selectedRow.email },
            { label: "Phone", value: selectedRow.phone },
            { label: "Mobile", value: selectedRow.mobile },
          ],
        },
        {
          title: "Professional Information",
          fields: [
            { label: "Company", value: selectedRow.company },
            { label: "Job Title", value: selectedRow.jobTitle },
            { label: "Department", value: selectedRow.department },
            { label: "Contact Type", value: selectedRow.contactType },
            { label: "Contact Source", value: selectedRow.contactSource },
            { label: "Role Tag", value: selectedRow.roleTag },
            {
              label: "Account",
              value: selectedRow.account?.accountName ?? "—",
            },
            {
              label: "Status",
              value: selectedRow.contactStatus,
              isBadge: true,
              badgeColor:
                selectedRow.contactStatus === "Active" ? "green" : "gray",
            },
          ],
        },
        {
          title: "Address",
          fields: [
            { label: "Address", value: selectedRow.address },
            { label: "City", value: selectedRow.city },
            { label: "State", value: selectedRow.state },
            { label: "Country", value: selectedRow.country },
            { label: "Zip Code", value: selectedRow.zipCode },
          ],
        },
        {
          title: "Other",
          fields: [
            { label: "Remarks", value: selectedRow.remarks },
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
        label="Account"
        name="accountId"
        type="select"
        value={form.accountId}
        onChange={handleFieldChange}
        required
        options={accounts.map((a) => ({
          label: a.accountName,
          value: a.id,
        }))}
      />
      <FormField
        label="Salutation"
        name="salutation"
        type="select"
        value={form.salutation}
        onChange={handleFieldChange}
        options={[
          { label: "Mr", value: "Mr" },
          { label: "Mrs", value: "Mrs" },
          { label: "Ms", value: "Ms" },
          { label: "Dr", value: "Dr" },
        ]}
      />
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
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleFieldChange}
        placeholder="Enter email"
      />
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={handleFieldChange}
        placeholder="Enter phone"
      />
      <FormField
        label="Mobile"
        name="mobile"
        type="tel"
        value={form.mobile}
        onChange={handleFieldChange}
        placeholder="Enter mobile"
      />
      <FormField
        label="Company"
        name="company"
        value={form.company}
        onChange={handleFieldChange}
        placeholder="Enter company name"
      />
      <FormField
        label="Job Title"
        name="jobTitle"
        value={form.jobTitle}
        onChange={handleFieldChange}
        placeholder="Enter job title"
      />
      <FormField
        label="Department"
        name="department"
        value={form.department}
        onChange={handleFieldChange}
        placeholder="Enter department"
      />
      <FormField
        label="Contact Type"
        name="contactType"
        type="select"
        value={form.contactType}
        onChange={handleFieldChange}
        options={[
          { label: "Customer", value: "Customer" },
          { label: "Vendor", value: "Vendor" },
          { label: "Partner", value: "Partner" },
          { label: "Prospect", value: "Prospect" },
          { label: "Other", value: "Other" },
        ]}
      />
      <FormField
        label="Contact Source"
        name="contactSource"
        type="select"
        value={form.contactSource}
        onChange={handleFieldChange}
        options={[
          { label: "Website", value: "Website" },
          { label: "Referral", value: "Referral" },
          { label: "Social Media", value: "SocialMedia" },
          { label: "Trade Show", value: "TradeShow" },
          { label: "Cold Call", value: "ColdCall" },
          { label: "Other", value: "Other" },
        ]}
      />
      <FormField
        label="Role Tag"
        name="roleTag"
        type="select"
        value={form.roleTag}
        onChange={handleFieldChange}
        options={getRoleTagOptions(selectedAccountType)}
      />
      <FormField
        label="Status"
        name="contactStatus"
        type="select"
        value={form.contactStatus}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />
      <div className="md:col-span-2">
        <FormField
          label="Address"
          name="address"
          type="textarea"
          value={form.address}
          onChange={handleFieldChange}
          placeholder="Enter address"
          rows={2}
        />
      </div>
      <FormField
        label="City"
        name="city"
        value={form.city}
        onChange={handleFieldChange}
        placeholder="Enter city"
      />
      <FormField
        label="State"
        name="state"
        value={form.state}
        onChange={handleFieldChange}
        placeholder="Enter state"
      />
      <FormField
        label="Country"
        name="country"
        value={form.country}
        onChange={handleFieldChange}
        placeholder="Enter country"
      />
      <FormField
        label="Zip Code"
        name="zipCode"
        value={form.zipCode}
        onChange={handleFieldChange}
        placeholder="Enter zip code"
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
      <DataTable<Contact>
        moduleName="Contact"
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
          setSelectedAccountType(undefined);
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
        title="Create Contact"
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

      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Contact"
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

      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Contact Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <ActivityTimeline
            relatedToType="Contact"
            relatedToId={selectedRow.id}
          />
        )}
      </ReadView>
    </div>
  );
}
