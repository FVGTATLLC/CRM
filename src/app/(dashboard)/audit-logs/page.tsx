"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useAuth";
import DataTable, { ColumnDef } from "@/components/table/DataTable";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  moduleName: string;
  recordId?: string;
  recordName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { fetchApi } = useApi();
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const columns: ColumnDef<AuditLog>[] = [
    { key: "userName", label: "User", sortable: true },
    { key: "action", label: "Action", sortable: true },
    { key: "moduleName", label: "Module", sortable: true },
    { key: "recordName", label: "Record", sortable: true },
    {
      key: "details",
      label: "Details",
      sortable: false,
      render: (_val: any, row: AuditLog) => (
        <span className="truncate block max-w-[250px]" title={row.details ?? ""}>
          {row.details ?? "-"}
        </span>
      ),
    },
    { key: "ipAddress", label: "IP Address", sortable: false },
    {
      key: "createdAt",
      label: "Date & Time",
      sortable: true,
      render: (_val: any, row: AuditLog) => formatDateTime(row.createdAt),
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      const result = await fetchApi<{ success: boolean; data: AuditLog[]; total: number }>(
        `/api/audit-logs?${params}`
      );
      if (result.data) {
        setData(result.data);
        setTotal(result.total ?? 0);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, fetchApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={limit}
        isLoading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearch={handleSearch}
        onSort={handleSort}
        searchPlaceholder="Search audit logs..."
        moduleName="Audit Log"
      />
    </div>
  );
}
