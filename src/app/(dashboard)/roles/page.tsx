"use client";
import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";

interface RoleData {
  id: string;
  roleName: string;
  roleDisplayName: string;
  userType: string;
  roleStatus: string;
  remarks: string;
  businessLineId: string;
  departmentId: string;
  businessLine?: { businessLineName: string };
  department?: { departmentName: string };
  createdAt: string;
  lastModifiedAt: string;
}

interface DropdownOption {
  label: string;
  value: string;
}

const columns = [
  { key: "roleName", label: "Role Name", sortable: true, isLink: true },
  { key: "roleDisplayName", label: "Display Name", sortable: true },
  { key: "userType", label: "User Type", sortable: true },
  {
    key: "businessLine",
    label: "Business Line",
    render: (v: unknown) => {
      const bl = v as { businessLineName: string } | null;
      return bl?.businessLineName || "—";
    },
  },
  {
    key: "department",
    label: "Department",
    render: (v: unknown) => {
      const d = v as { departmentName: string } | null;
      return d?.departmentName || "—";
    },
  },
  {
    key: "roleStatus",
    label: "Status",
    render: (v: unknown) => {
      const status = v as string;
      return (
        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {status}
        </span>
      );
    },
  },
];

const emptyForm = {
  roleName: "",
  roleDisplayName: "",
  userType: "Standard",
  roleStatus: "Active",
  remarks: "",
  businessLineId: "",
  departmentId: "",
};

export default function RolesPage() {
  const { fetchApi } = useApi();
  const [data, setData] = useState<RoleData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RoleData | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [businessLines, setBusinessLines] = useState<DropdownOption[]>([]);
  const [departments, setDepartments] = useState<DropdownOption[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi<{ data: RoleData[]; total: number }>(
        `/api/roles?page=${page}&limit=${limit}&search=${search}`
      );
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
    setIsLoading(false);
  }, [page, limit, search, fetchApi]);

  const loadDropdowns = useCallback(async () => {
    try {
      const [blRes, deptRes] = await Promise.all([
        fetchApi<{ data: { id: string; businessLineName: string }[] }>("/api/business-lines?limit=100"),
        fetchApi<{ data: { id: string; departmentName: string }[] }>("/api/departments?limit=100"),
      ]);
      setBusinessLines(blRes.data.map((bl) => ({ label: bl.businessLineName, value: bl.id })));
      setDepartments(deptRes.data.map((d) => ({ label: d.departmentName, value: d.id })));
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  }, [fetchApi]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadDropdowns(); }, [loadDropdowns]);

  const handleFieldChange = (name: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate roleDisplayName
      if (name === "roleName" || name === "userType") {
        const bl = businessLines.find((b) => b.value === updated.businessLineId)?.label || "";
        const dept = departments.find((d) => d.value === updated.departmentId)?.label || "";
        updated.roleDisplayName = `${bl}_${dept}_${updated.userType}_${updated.roleName}`.replace(/\s+/g, "");
      }
      return updated;
    });
  };

  const handleCreate = () => {
    setFormData(emptyForm);
    setShowCreate(true);
  };

  const handleSave = async () => {
    try {
      const bl = businessLines.find((b) => b.value === formData.businessLineId)?.label || "";
      const dept = departments.find((d) => d.value === formData.departmentId)?.label || "";
      const roleDisplayName = `${bl}_${dept}_${formData.userType}_${formData.roleName}`.replace(/\s+/g, "");

      await fetchApi("/api/roles", {
        method: "POST",
        body: JSON.stringify({ ...formData, roleDisplayName }),
      });
      setShowCreate(false);
      loadData();
    } catch (err) {
      console.error("Failed to save role:", err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;
    try {
      const bl = businessLines.find((b) => b.value === formData.businessLineId)?.label || "";
      const dept = departments.find((d) => d.value === formData.departmentId)?.label || "";
      const roleDisplayName = `${bl}_${dept}_${formData.userType}_${formData.roleName}`.replace(/\s+/g, "");

      await fetchApi(`/api/roles/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...formData, roleDisplayName }),
      });
      setShowEdit(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleRowClick = (row: RoleData) => {
    setSelectedRecord(row);
    setShowRead(true);
  };

  const handleEdit = (row: RoleData) => {
    setSelectedRecord(row);
    setFormData({
      roleName: row.roleName,
      roleDisplayName: row.roleDisplayName || "",
      userType: row.userType,
      roleStatus: row.roleStatus,
      remarks: row.remarks || "",
      businessLineId: row.businessLineId,
      departmentId: row.departmentId,
    });
    setShowEdit(true);
  };

  const handleDelete = async (row: RoleData) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await fetchApi(`/api/roles/${row.id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error("Failed to delete role:", err);
    }
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearch}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        createLabel="Create New Role"
        searchPlaceholder="Search roles..."
        moduleName="Roles"
      />

      {/* Create Modal */}
      <FormModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Role">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Role Name" name="roleName" value={formData.roleName} onChange={handleFieldChange} required />
            <FormField label="User Type" name="userType" type="select" value={formData.userType} onChange={handleFieldChange} required
              options={[{ label: "Super Admin", value: "SuperAdmin" }, { label: "Admin", value: "Admin" }, { label: "Standard", value: "Standard" }]}
            />
            <FormField label="Business Line" name="businessLineId" type="select" value={formData.businessLineId} onChange={handleFieldChange} required options={businessLines} />
            <FormField label="Department" name="departmentId" type="select" value={formData.departmentId} onChange={handleFieldChange} required options={departments} />
            <FormField label="Status" name="roleStatus" type="select" value={formData.roleStatus} onChange={handleFieldChange}
              options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }]}
            />
          </div>
          <FormField label="Remarks" name="remarks" type="textarea" value={formData.remarks} onChange={handleFieldChange} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal isOpen={showEdit} onClose={() => setShowEdit(false)} title={`Edit Role: ${selectedRecord?.roleName || ""}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Role Name" name="roleName" value={formData.roleName} onChange={handleFieldChange} required />
            <FormField label="User Type" name="userType" type="select" value={formData.userType} onChange={handleFieldChange} required
              options={[{ label: "Super Admin", value: "SuperAdmin" }, { label: "Admin", value: "Admin" }, { label: "Standard", value: "Standard" }]}
            />
            <FormField label="Business Line" name="businessLineId" type="select" value={formData.businessLineId} onChange={handleFieldChange} required options={businessLines} />
            <FormField label="Department" name="departmentId" type="select" value={formData.departmentId} onChange={handleFieldChange} required options={departments} />
            <FormField label="Status" name="roleStatus" type="select" value={formData.roleStatus} onChange={handleFieldChange}
              options={[{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }]}
            />
          </div>
          <FormField label="Remarks" name="remarks" type="textarea" value={formData.remarks} onChange={handleFieldChange} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setShowEdit(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update</button>
          </div>
        </div>
      </FormModal>

      {/* Read View */}
      {selectedRecord && (
        <ReadView
          isOpen={showRead}
          onClose={() => { setShowRead(false); setSelectedRecord(null); }}
          title={`Role Details: ${selectedRecord.roleName}`}
          onEdit={() => { setShowRead(false); handleEdit(selectedRecord); }}
          sections={[
            {
              title: "Basic Information",
              fields: [
                { label: "Role Name", value: selectedRecord.roleName },
                { label: "Display Name", value: selectedRecord.roleDisplayName },
                { label: "User Type", value: selectedRecord.userType },
                { label: "Business Line", value: selectedRecord.businessLine?.businessLineName },
                { label: "Department", value: selectedRecord.department?.departmentName },
                { label: "Status", value: selectedRecord.roleStatus, isBadge: true },
                { label: "Remarks", value: selectedRecord.remarks },
              ],
            },
            {
              title: "System Information",
              fields: [
                { label: "Created At", value: selectedRecord.createdAt },
                { label: "Last Modified At", value: selectedRecord.lastModifiedAt },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
