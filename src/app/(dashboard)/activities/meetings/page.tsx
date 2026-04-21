"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { downloadICSFile } from "@/lib/calendar";
import { Calendar, Copy, Download, ExternalLink, Link2, Unlink } from "lucide-react";
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
  meetingPlatform?: string;
  meetingLink?: string;
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
  meetingPlatform: "",
  meetingLink: "",
  status: "Planned",
  priority: "Normal",
  attendees: "",
  outcome: "",
  nextSteps: "",
  remarks: "",
};

export default function MeetingsPage() {
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
  const [googleConnected, setGoogleConnected] = useState(false);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [zohoConnected, setZohoConnected] = useState(false);
  const [creatingZoho, setCreatingZoho] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Activity[]; total: number }>(
        `/api/activities?activityType=Meeting&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  useEffect(() => {
    fetchApi<{ success: boolean; connected: boolean }>("/api/calendar?action=status")
      .then((res) => { if (res.success) setGoogleConnected(res.connected); })
      .catch(() => {});
    fetchApi<{ success: boolean; connected: boolean }>("/api/meetings/zoho?action=status")
      .then((res) => { if (res.success) setZohoConnected(res.connected); })
      .catch(() => {});
  }, []);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: String(value) }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        activityType: "Meeting",
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
        activityType: "Meeting",
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
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await fetchApi(`/api/activities/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetchApi<{ success: boolean; authUrl: string }>("/api/auth/google");
      if (res.success && res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (e) {
      console.error("Error connecting Google:", e);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm("Disconnect Google Calendar?")) return;
    try {
      await fetchApi("/api/auth/google/disconnect", { method: "POST" });
      setGoogleConnected(false);
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
  };

  const handleCreateWithMeet = async () => {
    if (!form.subject) { alert("Please enter a subject first"); return; }
    setCreatingMeet(true);
    try {
      const startDate = form.activityDate || new Date().toISOString().split("T")[0];
      const startTime = form.startTime || "10:00";
      const endTime = form.endTime || "11:00";
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${startDate}T${endTime}:00`).toISOString();

      const res = await fetchApi<{ success: boolean; data: { meetLink?: string; htmlLink: string } }>("/api/calendar", {
        method: "POST",
        body: JSON.stringify({
          subject: form.subject,
          description: form.description,
          location: form.location,
          startDateTime,
          endDateTime,
          attendees: form.attendees,
          withMeetLink: true,
        }),
      });

      if (res.success && res.data) {
        const meetLink = res.data.meetLink || res.data.htmlLink;
        setForm((prev: any) => ({
          ...prev,
          meetingPlatform: "Google Meet",
          meetingLink: meetLink,
        }));
        alert("Google Meet link created and added!");
      }
    } catch (e: any) {
      alert(e.message || "Failed to create Google Meet. Make sure Google Calendar is connected.");
    } finally {
      setCreatingMeet(false);
    }
  };

  const handleConnectZoho = async () => {
    try {
      const res = await fetchApi<{ success: boolean; authUrl: string }>("/api/auth/zoho");
      if (res.success && res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (e) {
      console.error("Error connecting Zoho:", e);
    }
  };

  const handleDisconnectZoho = async () => {
    if (!confirm("Disconnect Zoho Meeting?")) return;
    try {
      await fetchApi("/api/auth/zoho/disconnect", { method: "POST" });
      setZohoConnected(false);
    } catch (e) {
      console.error("Error disconnecting Zoho:", e);
    }
  };

  const handleCreateZohoMeeting = async () => {
    if (!form.subject) { alert("Please enter a subject first"); return; }
    setCreatingZoho(true);
    try {
      const startDate = form.activityDate || new Date().toISOString().split("T")[0];
      const startTime = form.startTime || "10:00";
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();

      const endTime = form.endTime || "11:00";
      const startH = parseInt(startTime.split(":")[0]);
      const startM = parseInt(startTime.split(":")[1]);
      const endH = parseInt(endTime.split(":")[0]);
      const endM = parseInt(endTime.split(":")[1]);
      const duration = (endH * 60 + endM) - (startH * 60 + startM) || 60;

      const res = await fetchApi<{ success: boolean; data: { meetingLink: string } }>("/api/meetings/zoho", {
        method: "POST",
        body: JSON.stringify({
          topic: form.subject,
          agenda: form.description,
          startTime: startDateTime,
          duration,
          attendees: form.attendees,
        }),
      });

      if (res.success && res.data) {
        setForm((prev: any) => ({
          ...prev,
          meetingPlatform: "Zoho Meeting",
          meetingLink: res.data.meetingLink,
        }));
        alert("Zoho Meeting link created and added!");
      }
    } catch (e: any) {
      alert(e.message || "Failed to create Zoho Meeting. Make sure Zoho is connected.");
    } finally {
      setCreatingZoho(false);
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
      meetingPlatform: row.meetingPlatform ?? "",
      meetingLink: row.meetingLink ?? "",
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
          title: "Meeting Information",
          fields: [
            { label: "Subject", value: selectedRow.subject },
            { label: "Description", value: selectedRow.description },
            { label: "Date", value: selectedRow.activityDate },
            { label: "Start Time", value: selectedRow.startTime },
            { label: "End Time", value: selectedRow.endTime },
            { label: "Duration (min)", value: selectedRow.duration },
            { label: "Location", value: selectedRow.location },
            { label: "Meeting Platform", value: selectedRow.meetingPlatform },
            {
              label: "Meeting Link",
              value: selectedRow.meetingLink,
              isLink: !!selectedRow.meetingLink,
              onLinkClick: () => {
                if (selectedRow.meetingLink) {
                  window.open(selectedRow.meetingLink, "_blank", "noopener,noreferrer");
                }
              },
            },
          ],
        },
        {
          title: "Status & Priority",
          fields: [
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
            },
            {
              label: "Priority",
              value: selectedRow.priority,
              isBadge: true,
            },
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
          placeholder="Enter meeting subject"
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
        placeholder="e.g. 60"
      />
      <FormField
        label="Location"
        name="location"
        value={form.location}
        onChange={handleFieldChange}
        placeholder="Enter location"
      />
      <FormField
        label="Meeting Platform"
        name="meetingPlatform"
        type="select"
        value={form.meetingPlatform}
        onChange={handleFieldChange}
        options={[
          { value: "", label: "Select Platform" },
          { value: "In-Person", label: "In-Person" },
          { value: "Google Meet", label: "Google Meet" },
          { value: "Zoom", label: "Zoom" },
          { value: "Microsoft Teams", label: "Microsoft Teams" },
          { value: "Zoho Meeting", label: "Zoho Meeting" },
          { value: "Other", label: "Other" },
        ]}
      />
      {form.meetingPlatform && form.meetingPlatform !== "In-Person" && (
        <FormField
          label="Meeting Link"
          name="meetingLink"
          type="text"
          value={form.meetingLink}
          onChange={handleFieldChange}
          placeholder="https://meet.google.com/..."
        />
      )}
      {googleConnected && (
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleCreateWithMeet}
            disabled={creatingMeet || !form.subject}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Calendar size={14} />
            {creatingMeet ? "Creating Google Meet..." : "Auto-Create Google Meet Link"}
          </button>
          <p className="text-xs text-gray-400 mt-1">Creates a Google Calendar event with an auto-generated Meet link</p>
        </div>
      )}
      {zohoConnected && (
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleCreateZohoMeeting}
            disabled={creatingZoho || !form.subject}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            <Calendar size={14} />
            {creatingZoho ? "Creating Zoho Meeting..." : "Auto-Create Zoho Meeting Link"}
          </button>
          <p className="text-xs text-gray-400 mt-1">Creates a Zoho Meeting with an auto-generated join link</p>
        </div>
      )}
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
      {/* Google Calendar Connection */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className={googleConnected ? "text-green-600" : "text-gray-400"} />
          <span className="text-sm text-gray-700">
            Google Calendar: {googleConnected ? (
              <span className="text-green-600 font-medium">Connected</span>
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </span>
        </div>
        {googleConnected ? (
          <button onClick={handleDisconnectGoogle} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
            <Unlink size={12} /> Disconnect
          </button>
        ) : (
          <button onClick={handleConnectGoogle} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
            <Link2 size={12} /> Connect Google Calendar
          </button>
        )}
      </div>

      {/* Zoho Meeting Connection */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className={zohoConnected ? "text-green-600" : "text-gray-400"} />
          <span className="text-sm text-gray-700">
            Zoho Meeting: {zohoConnected ? (
              <span className="text-green-600 font-medium">Connected</span>
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </span>
        </div>
        {zohoConnected ? (
          <button onClick={handleDisconnectZoho} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
            <Unlink size={12} /> Disconnect
          </button>
        ) : (
          <button onClick={handleConnectZoho} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100">
            <Link2 size={12} /> Connect Zoho Meeting
          </button>
        )}
      </div>

      <DataTable<Activity>
        moduleName="Meeting"
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
        title="Create Meeting"
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
        title="Edit Meeting"
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
        title="Meeting Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      >
        {selectedRow && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {selectedRow.meetingLink && (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedRow.meetingLink || "");
                    alert("Meeting link copied!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Copy size={14} /> Copy Link
                </button>
                <a
                  href={selectedRow.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  <ExternalLink size={14} /> Join Meeting
                </a>
              </>
            )}
            <button
              onClick={() => {
                if (!selectedRow) return;
                const startDate = new Date(selectedRow.activityDate || new Date());
                if (selectedRow.startTime) {
                  const [h, m] = selectedRow.startTime.split(":");
                  startDate.setHours(parseInt(h), parseInt(m));
                }
                const endDate = new Date(startDate);
                if (selectedRow.endTime) {
                  const [h, m] = selectedRow.endTime.split(":");
                  endDate.setHours(parseInt(h), parseInt(m));
                } else {
                  endDate.setHours(endDate.getHours() + 1);
                }
                downloadICSFile({
                  subject: selectedRow.subject,
                  description: selectedRow.description,
                  location: selectedRow.location,
                  startDate,
                  endDate,
                  meetingLink: selectedRow.meetingLink,
                  attendees: selectedRow.attendees,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <Download size={14} /> Download .ics
            </button>
          </div>
        )}
      </ReadView>
    </div>
  );
}
