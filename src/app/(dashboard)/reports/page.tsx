"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useAuth";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { formatDate, generateExportFilename } from "@/lib/utils";

const MODULE_CONFIG: Record<string, { endpoint: string; columns: { key: string; label: string }[] }> = {
  Leads: {
    endpoint: "/api/leads",
    columns: [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "company", label: "Company" },
      { key: "leadType", label: "Lead Type" },
      { key: "leadStatus", label: "Status" },
      { key: "leadSource", label: "Source" },
      { key: "estimatedValue", label: "Value" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  Accounts: {
    endpoint: "/api/accounts",
    columns: [
      { key: "accountName", label: "Account Name" },
      { key: "accountType", label: "Type" },
      { key: "segment", label: "Segment" },
      { key: "industry", label: "Industry" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "annualRevenue", label: "Revenue" },
      { key: "accountStatus", label: "Status" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  Contacts: {
    endpoint: "/api/contacts",
    columns: [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "company", label: "Company" },
      { key: "jobTitle", label: "Job Title" },
      { key: "contactStatus", label: "Status" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  Proposals: {
    endpoint: "/api/proposals",
    columns: [
      { key: "title", label: "Title" },
      { key: "linkedToName", label: "Client" },
      { key: "value", label: "Value" },
      { key: "currency", label: "Currency" },
      { key: "status", label: "Status" },
      { key: "validUntil", label: "Valid Until" },
      { key: "createdAt", label: "Created At" },
    ],
  },
  Contracts: {
    endpoint: "/api/contracts",
    columns: [
      { key: "title", label: "Title" },
      { key: "value", label: "Value" },
      { key: "currency", label: "Currency" },
      { key: "status", label: "Status" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "createdAt", label: "Created At" },
    ],
  },
};

export default function ReportsPage() {
  const { fetchApi } = useApi();
  const [selectedModule, setSelectedModule] = useState("Leads");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    MODULE_CONFIG["Leads"].columns.map((c) => c.key)
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const config = MODULE_CONFIG[selectedModule];

  const handleModuleChange = (mod: string) => {
    setSelectedModule(mod);
    setSelectedColumns(MODULE_CONFIG[mod].columns.map((c) => c.key));
    setData([]);
    setGenerated(false);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const result = await fetchApi<{ success: boolean; data: any[] }>(
        `${config.endpoint}?limit=1000`
      );
      if (result.data) {
        let filtered = result.data;
        if (startDate)
          filtered = filtered.filter(
            (r: any) => new Date(r.createdAt) >= new Date(startDate)
          );
        if (endDate)
          filtered = filtered.filter(
            (r: any) => new Date(r.createdAt) <= new Date(endDate + "T23:59:59")
          );
        setData(filtered);
        setGenerated(true);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const cols = config.columns.filter((c) => selectedColumns.includes(c.key));
    const header = cols.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      cols
        .map((c) => {
          const val = row[c.key];
          if (val === null || val === undefined) return "";
          if (
            typeof val === "string" &&
            (val.includes(",") || val.includes('"'))
          )
            return `"${val.replace(/"/g, '""')}"`;
          if (
            c.key === "createdAt" ||
            c.key === "validUntil" ||
            c.key === "startDate" ||
            c.key === "endDate"
          )
            return formatDate(val);
          return val;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateExportFilename(selectedModule, "report") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const cols = config.columns.filter((c) => selectedColumns.includes(c.key));
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHTML = `
      <html>
      <head>
        <title>${selectedModule} Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; color: #333; margin-bottom: 5px; }
          p { font-size: 12px; color: #666; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f3f4f6; padding: 8px 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; }
          td { padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563; }
          tr:nth-child(even) { background: #f9fafb; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${selectedModule} Report</h1>
        <p>Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} &bull; ${data.length} records</p>
        <table>
          <thead><tr>${cols.map(c => `<th>${c.label}</th>`).join("")}</tr></thead>
          <tbody>
            ${data.map(row => `<tr>${cols.map(c => {
              const val = row[c.key];
              if (c.key.includes("Date") || c.key === "createdAt" || c.key === "validUntil") return `<td>${val ? formatDate(val) : "\u2014"}</td>`;
              return `<td>${val ?? "\u2014"}</td>`;
            }).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const exportXLSX = async () => {
    try {
      const XLSX = await import("xlsx");
      const cols = config.columns.filter((c) =>
        selectedColumns.includes(c.key)
      );
      const wsData = [
        cols.map((c) => c.label),
        ...data.map((row) =>
          cols.map((c) => {
            const val = row[c.key];
            if (
              c.key === "createdAt" ||
              c.key === "validUntil" ||
              c.key === "startDate" ||
              c.key === "endDate"
            )
              return val ? formatDate(val) : "";
            return val ?? "";
          })
        ),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedModule);
      XLSX.writeFile(
        wb,
        generateExportFilename(selectedModule, "report") + ".xlsx"
      );
    } catch (error) {
      console.error("XLSX export error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Object.keys(MODULE_CONFIG).map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading || selectedColumns.length === 0}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Columns
          </label>
          <div className="flex flex-wrap gap-2">
            {config.columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded"
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>

        {generated && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {data.length} records found
              </p>
              <div className="flex gap-2">
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={exportXLSX}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> XLSX
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {config.columns
                      .filter((c) => selectedColumns.includes(c.key))
                      .map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {col.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {config.columns
                        .filter((c) => selectedColumns.includes(c.key))
                        .map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-gray-700 whitespace-nowrap"
                          >
                            {col.key.includes("Date") ||
                            col.key === "createdAt" ||
                            col.key === "validUntil"
                              ? row[col.key]
                                ? formatDate(row[col.key])
                                : "\u2014"
                              : (row[col.key] ?? "\u2014")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 50 && (
                <p className="text-center text-sm text-gray-400 py-2">
                  Showing first 50 of {data.length} records. Export for full
                  data.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
