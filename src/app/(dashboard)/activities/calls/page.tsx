"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";

interface Activity {
  id: string;
  activityType: string;
  subject: string;
  description?: string;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  location?: string;
  status: string;
  priority?: string;
  attendees?: string;
  outcome?: string;
  nextSteps?: string;
  remarks?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

const INITIAL_FORM: Record<string, string> = {
  subject: "",
  description: "",
  activityDate: "",
  startTime: "",
  endTime: "",
  duration: "",
  location: "",
  status: "Planned",
  priority: "Normal",
  attendees: "",
  outcome: "",
  nextSteps: "",
  remarks: "",
};

export default function CallLogsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Activity | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Activity[]; total: number }>(
        `/api/activities?activityType=Call&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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
        activityType: "Call",
        duration: form.duration ? Number(form.duration) : undefined,
      };
      await fetchApi("/api/activities", {
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
        activityType: "Call",
        duration: form.duration ? Number(form.duration) : undefined,
      };
      await fetchApi(`/api/activities/${selectedRow.id}`, {
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

  const handleDelete = async (row: Activity) => {
    if (!confirm("Are you sure you want to delete this call log?")) return;
    try {
      await fetchApi(`/api/activities/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Activity) => {
    setSelectedRow(row);
    setForm({
      subject: row.subject ?? "",
      description: row.description ?? "",
      activityDate: row.activityDate ? row.activityDate.split("T")[0] : "",
      startTime: row.startTime ?? "",
      endTime: row.endTime ?? "",
      duration: row.duration != null ? String(row.duration) : "",
      location: row.location ?? "",
      status: row.status ?? "Planned",
      priority: row.priority ?? "Normal",
      attendees: row.attendees ?? "",
      outcome: row.outcome ?? "",
      nextSteps: row.nextSteps ?? "",
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: Activity) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Planned":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Normal":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<Activity>[] = [
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "activityDate",
      label: "Date",
      sortable: true,
      render: (value: string) => (value ? formatDate(value) : "-"),
    },
    { key: "startTime", label: "Start Time", sortable: false },
    { key: "endTime", label: "End Time", sortable: false },
    { key: "location", label: "Location", sortable: false },
    {
      key: "status",
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
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor(value)}`}
        >
          {value}
        </span>
      ),
    },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Call Information",
          fields: [
            { label: "Subject", value: selectedRow.subject },
            { label: "Description", value: selectedRow.description },
            { label: "Date", value: selectedRow.activityDate },
            { label: "Start Time", value: selectedRow.startTime },
            { label: "End Time", value: selectedRow.endTime },
            { label: "Duration (min)", value: selectedRow.duration },
            { label: "Location", value: selectedRow.location },
          ],
        },
        {
          title: "Status & Priority",
          fields: [
            { label: "Status", value: selectedRow.status, isBadge: true },
            { label: "Priority", value: selectedRow.priority, isBadge: true },
          ],
        },
        {
          title: "Additional Details",
          fields: [
            { label: "Attendees", value: selectedRow.attendees },
            { label: "Outcome", value: selectedRow.outcome },
            { label: "Next Steps", value: selectedRow.nextSteps },
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
      <div className="md:col-span-2">
        <FormField
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={handleFieldChange}
          required
          placeholder="Enter call subject"
        />
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
      <FormField
        label="Date"
        name="activityDate"
        type="date"
        value={form.activityDate}
        onChange={handleFieldChange}
        required
      />
      <FormField
        label="Start Time"
        name="startTime"
        value={form.startTime}
        onChange={handleFieldChange}
        placeholder="e.g. 09:00 AM"
      />
      <FormField
        label="End Time"
        name="endTime"
        value={form.endTime}
        onChange={handleFieldChange}
        placeholder="e.g. 10:00 AM"
      />
      <FormField
        label="Duration (minutes)"
        name="duration"
        type="number"
        value={form.duration}
        onChange={handleFieldChange}
        placeholder="e.g. 30"
      />
      <FormField
        label="Location"
        name="location"
        value={form.location}
        onChange={handleFieldChange}
        placeholder="Enter location"
      />
      <FormField
        label="Status"
        name="status"
        type="select"
        value={form.status}
        onChange={handleFieldChange}
        options={[
          { label: "Planned", value: "Planned" },
          { label: "Completed", value: "Completed" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />
      <FormField
        label="Priority"
        name="priority"
        type="select"
        value={form.priority}
        onChange={handleFieldChange}
        options={[
          { label: "Low", value: "Low" },
          { label: "Normal", value: "Normal" },
          { label: "High", value: "High" },
          { label: "Urgent", value: "Urgent" },
        ]}
      />
      <div className="md:col-span-2">
        <FormField
          label="Attendees"
          name="attendees"
          type="textarea"
          value={form.attendees}
          onChange={handleFieldChange}
          placeholder="Enter attendee names (comma separated)"
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Outcome"
          name="outcome"
          type="textarea"
          value={form.outcome}
          onChange={handleFieldChange}
          placeholder="Enter outcome"
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Next Steps"
          name="nextSteps"
          type="textarea"
          value={form.nextSteps}
          onChange={handleFieldChange}
          placeholder="Enter next steps"
        />
      </div>
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
      <DataTable<Activity>
        moduleName="Call Log"
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
        title="Create Call Log"
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
        title="Edit Call Log"
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
        title="Call Log Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
