"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import type { ColumnDef } from "@/components/table/DataTable";
import { MapPin, Plus } from "lucide-react";

interface CheckIn {
  id: string;
  checkInTime: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAddress?: string;
  checkOutTime?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  durationMinutes?: number;
  relatedToType?: string;
  relatedToId?: string;
  relatedToName?: string;
  purpose?: string;
  remarks?: string;
  status: string;
  owner?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

const INITIAL_EDIT_FORM: Record<string, string> = {
  remarks: "",
};

export default function CheckInsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<CheckIn[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CheckIn | null>(null);
  const [form, setForm] = useState(INITIAL_EDIT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: CheckIn[]; total: number }>(
        `/api/check-ins?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const handleUpdate = async () => {
    if (!selectedRow) return;
    setSaving(true);
    try {
      await fetchApi(`/api/check-ins/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify({ remarks: form.remarks }),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_EDIT_FORM);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: CheckIn) => {
    if (!confirm("Are you sure you want to delete this check-in?")) return;
    try {
      await fetchApi(`/api/check-ins/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: CheckIn) => {
    setSelectedRow(row);
    setForm({
      remarks: row.remarks ?? "",
    });
    setEditOpen(true);
  };

  const openRead = (row: CheckIn) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const formatDuration = (minutes?: number) => {
    if (minutes == null) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "CheckedOut":
        return "bg-green-100 text-green-800";
      case "CheckedIn":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns: ColumnDef<CheckIn>[] = [
    {
      key: "owner",
      label: "Executive",
      sortable: false,
      render: (_value: unknown, row: CheckIn) =>
        row.owner
          ? `${row.owner.firstName} ${row.owner.lastName}`
          : "-",
    },
    {
      key: "checkInTime",
      label: "Check-In Time",
      sortable: true,
      render: (value: string) => (value ? formatDateTime(value) : "-"),
    },
    {
      key: "checkInAddress",
      label: "Location",
      sortable: false,
      render: (value: string) =>
        value
          ? value.length > 40
            ? `${value.substring(0, 40)}...`
            : value
          : "-",
    },
    {
      key: "checkOutTime",
      label: "Check-Out Time",
      sortable: true,
      render: (value: string) => (value ? formatDateTime(value) : "-"),
    },
    {
      key: "durationMinutes",
      label: "Duration",
      sortable: true,
      render: (value: number) => formatDuration(value),
    },
    {
      key: "relatedToName",
      label: "Client",
      sortable: false,
      render: (value: string) => value || "-",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(value)}`}
        >
          {value === "CheckedOut" ? "Checked Out" : value === "CheckedIn" ? "Checked In" : value}
        </span>
      ),
    },
  ];

  const readSections = selectedRow
    ? [
        {
          title: "Check-In Details",
          fields: [
            { label: "Check-In Time", value: selectedRow.checkInTime },
            { label: "Latitude", value: selectedRow.checkInLatitude },
            { label: "Longitude", value: selectedRow.checkInLongitude },
            { label: "Address", value: selectedRow.checkInAddress },
          ],
        },
        {
          title: "Check-Out Details",
          fields: [
            { label: "Check-Out Time", value: selectedRow.checkOutTime },
            { label: "Latitude", value: selectedRow.checkOutLatitude },
            { label: "Longitude", value: selectedRow.checkOutLongitude },
            { label: "Address", value: selectedRow.checkOutAddress },
            { label: "Duration", value: formatDuration(selectedRow.durationMinutes) },
          ],
        },
        {
          title: "Client Info",
          fields: [
            { label: "Client Type", value: selectedRow.relatedToType },
            { label: "Client Name", value: selectedRow.relatedToName },
          ],
        },
        {
          title: "Notes",
          fields: [
            { label: "Purpose", value: selectedRow.purpose },
            { label: "Remarks", value: selectedRow.remarks },
          ],
        },
        {
          title: "Status & System Info",
          fields: [
            {
              label: "Status",
              value: selectedRow.status === "CheckedOut"
                ? "Checked Out"
                : selectedRow.status === "CheckedIn"
                ? "Checked In"
                : selectedRow.status,
              isBadge: true,
            },
            {
              label: "Executive",
              value: selectedRow.owner
                ? `${selectedRow.owner.firstName} ${selectedRow.owner.lastName}`
                : undefined,
            },
            { label: "Created At", value: selectedRow.createdAt },
          ],
        },
      ]
    : [];

  return (
    <div className="h-full flex flex-col">
      {/* Top bar with New Check-In navigation link */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Location Check-Ins</h1>
        </div>
        <Link
          href="/activities/check-ins/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Check-In
        </Link>
      </div>

      <DataTable<CheckIn>
        moduleName="Check-In"
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        isLoading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={setSearch}
        onRowClick={openRead}
        onEdit={openEdit}
        onDelete={handleDelete}
        onExport={() => {}}
      />

      {/* Edit Modal - managers can only update remarks */}
      <FormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Check-In Remarks"
        size="md"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Remarks"
            name="remarks"
            type="textarea"
            value={form.remarks}
            onChange={handleFieldChange}
            placeholder="Enter remarks"
            rows={4}
          />
        </div>
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

      {/* ReadView with detailed sections */}
      <ReadView
        isOpen={readOpen}
        onClose={() => setReadOpen(false)}
        title="Check-In Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
