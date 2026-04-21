"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

interface User {
  id: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  userType: string;
  businessLineId?: string;
  departmentId?: string;
  businessLine?: { businessLineName: string };
  department?: { departmentName: string };
  role?: { roleName: string };
  userStatus: string;
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
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  designation: "",
  userType: "Standard",
  businessLineId: "",
  departmentId: "",
  userStatus: "Active",
  remarks: "",
};

export default function UsersPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<User | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Dropdown data
  const [businessLines, setBusinessLines] = useState<DropdownOption[]>([]);
  const [departments, setDepartments] = useState<DropdownOption[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: User[]; total: number }>(
        `/api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
      const [blRes, deptRes] = await Promise.allSettled([
        fetchApi<{ data: DropdownOption[] }>("/api/business-lines?limit=500"),
        fetchApi<{ data: DropdownOption[] }>("/api/departments?limit=500"),
      ]);
      if (blRes.status === "fulfilled") setBusinessLines(blRes.value.data ?? []);
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value.data ?? []);
    } catch {
      // handle error
    }
  }, [fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetchApi("/api/users", {
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
      // Exclude password on update if empty
      const { password, ...rest } = form;
      const payload = password ? form : rest;
      await fetchApi(`/api/users/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      setIsEditMode(false);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: User) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetchApi(`/api/users/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: User) => {
    setSelectedRow(row);
    setIsEditMode(true);
    setForm({
      salutation: row.salutation ?? "",
      firstName: row.firstName ?? "",
      lastName: row.lastName ?? "",
      email: row.email ?? "",
      password: "",
      phone: row.phone ?? "",
      designation: row.designation ?? "",
      userType: row.userType ?? "Standard",
      businessLineId: row.businessLineId ?? "",
      departmentId: row.departmentId ?? "",
      userStatus: row.userStatus ?? "Active",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: User) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<User>[] = [
    {
      key: "firstName",
      label: "Name",
      sortable: true,
      render: (_value: string, row: User) =>
        `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "userType", label: "User Type", sortable: true },
    { key: "role.roleName", label: "Role", sortable: false },
    {
      key: "businessLine.businessLineName",
      label: "Business Line",
      sortable: false,
    },
    {
      key: "userStatus",
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
            { label: "Designation", value: selectedRow.designation },
          ],
        },
        {
          title: "Role & Access",
          fields: [
            { label: "User Type", value: selectedRow.userType },
            { label: "Role", value: selectedRow.role?.roleName },
            {
              label: "Business Line",
              value: selectedRow.businessLine?.businessLineName,
            },
            {
              label: "Department",
              value: selectedRow.department?.departmentName,
            },
            {
              label: "Status",
              value: selectedRow.userStatus,
              isBadge: true,
              badgeColor:
                selectedRow.userStatus === "Active" ? "green" : "gray",
            },
          ],
        },
        {
          title: "System Information",
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

  const blOptions = businessLines.map((bl) => ({
    label: bl.businessLineName,
    value: bl.id,
  }));
  const deptOptions = departments.map((d) => ({
    label: d.departmentName,
    value: d.id,
  }));

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        required
        placeholder="Enter email (used as username)"
      />
      <FormField
        label={isEditMode ? "Password (leave blank to keep current)" : "Password"}
        name="password"
        type="password"
        value={form.password}
        onChange={handleFieldChange}
        required={!isEditMode}
        placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
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
        label="Designation"
        name="designation"
        value={form.designation}
        onChange={handleFieldChange}
        placeholder="Enter designation"
      />
      <FormField
        label="User Type"
        name="userType"
        type="select"
        value={form.userType}
        onChange={handleFieldChange}
        required
        options={[
          { label: "Super Admin", value: "SuperAdmin" },
          { label: "Admin", value: "Admin" },
          { label: "Standard", value: "Standard" },
        ]}
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
        label="Department"
        name="departmentId"
        type="select"
        value={form.departmentId}
        onChange={handleFieldChange}
        options={deptOptions}
      />
      <FormField
        label="Status"
        name="userStatus"
        type="select"
        value={form.userStatus}
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
      <DataTable<User>
        moduleName="User"
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
          setIsEditMode(false);
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
        title="Create User"
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
        onClose={() => {
          setEditOpen(false);
          setIsEditMode(false);
        }}
        title="Edit User"
        size="xl"
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => {
              setEditOpen(false);
              setIsEditMode(false);
            }}
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
        title="User Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
