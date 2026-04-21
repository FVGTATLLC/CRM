"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  isLink?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearch: (search: string) => void;
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onExport?: (
    mode: "selection" | "default" | "myview" | "all",
    format: "csv" | "excel",
  ) => void;
  onCreate?: () => void;
  createLabel?: string;
  searchPlaceholder?: string;
  moduleName: string;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROWS_PER_PAGE_OPTIONS = [25, 50, 75, 100] as const;

const EXPORT_MODES: { label: string; value: DataTableProps<any>["onExport"] extends undefined ? never : "selection" | "default" | "myview" | "all" }[] = [
  { label: "Current Selections", value: "selection" },
  { label: "Default View", value: "default" },
  { label: "My View", value: "myview" },
  { label: "All", value: "all" },
];

const EXPORT_FORMATS: { label: string; value: "csv" | "excel" }[] = [
  { label: "CSV", value: "csv" },
  { label: "Excel", value: "excel" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRowId<T>(row: T): string {
  const r = row as any;
  return String(r.id ?? r._id ?? r.key ?? "");
}

function getCellValue<T>(row: T, key: string): any {
  const parts = key.split(".");
  let value: any = row;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

// ---------------------------------------------------------------------------
// useClickOutside hook
// ---------------------------------------------------------------------------

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow({ colSpan }: { colSpan: number }) {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="px-3 py-3">
        <div className="h-4 w-4 rounded bg-gray-200" />
      </td>
      {Array.from({ length: colSpan }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full max-w-[120px] rounded bg-gray-200" />
        </td>
      ))}
      <td className="px-3 py-3">
        <div className="flex gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// DataTable Component
// ---------------------------------------------------------------------------

export default function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit,
  isLoading = false,
  onPageChange,
  onLimitChange,
  onSearch,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  onExport,
  onCreate,
  createLabel,
  searchPlaceholder,
  moduleName,
  selectedRows = [],
  onSelectionChange,
}: DataTableProps<T>) {
  // ---- Local state ----------------------------------------------------------
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    columns.forEach((col) => {
      map[col.key] = col.visible !== false;
    });
    return map;
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMode, setExportMode] = useState<"selection" | "default" | "myview" | "all" | null>(null);
  const [manualPageInput, setManualPageInput] = useState("");

  // ---- Refs -----------------------------------------------------------------
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // ---- Click outside handlers -----------------------------------------------
  useClickOutside(columnMenuRef, () => setShowColumnMenu(false));
  useClickOutside(exportMenuRef, () => {
    setShowExportMenu(false);
    setExportMode(null);
  });

  // ---- Derived state --------------------------------------------------------
  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.key] !== false),
    [columns, columnVisibility],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const allRowIds = useMemo(() => data.map((row) => getRowId(row)), [data]);
  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedRows.includes(id));
  const someSelected = !allSelected && allRowIds.some((id) => selectedRows.includes(id));

  // ---- Search with debounce -------------------------------------------------
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        onSearch(value);
      }, 400);
    },
    [onSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchValue("");
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    onSearch("");
  }, [onSearch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // ---- Sorting --------------------------------------------------------------
  const handleSort = useCallback(
    (key: string) => {
      let newOrder: "asc" | "desc" = "asc";
      if (sortBy === key) {
        newOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      setSortBy(key);
      setSortOrder(newOrder);
      onSort?.(key, newOrder);
    },
    [sortBy, sortOrder, onSort],
  );

  // ---- Selection ------------------------------------------------------------
  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      // Deselect all on current page
      onSelectionChange(selectedRows.filter((id) => !allRowIds.includes(id)));
    } else {
      // Select all on current page (merge with existing)
      const merged = Array.from(new Set([...selectedRows, ...allRowIds]));
      onSelectionChange(merged);
    }
  }, [onSelectionChange, allSelected, selectedRows, allRowIds]);

  const toggleRowSelection = useCallback(
    (rowId: string) => {
      if (!onSelectionChange) return;
      if (selectedRows.includes(rowId)) {
        onSelectionChange(selectedRows.filter((id) => id !== rowId));
      } else {
        onSelectionChange([...selectedRows, rowId]);
      }
    },
    [onSelectionChange, selectedRows],
  );

  // ---- Column visibility ----------------------------------------------------
  const toggleColumn = useCallback((key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---- Export ---------------------------------------------------------------
  const handleExportModeSelect = useCallback(
    (mode: "selection" | "default" | "myview" | "all") => {
      setExportMode(mode);
    },
    [],
  );

  const handleExportFormatSelect = useCallback(
    (format: "csv" | "excel") => {
      if (exportMode && onExport) {
        onExport(exportMode, format);
      }
      setShowExportMenu(false);
      setExportMode(null);
    },
    [exportMode, onExport],
  );

  // ---- Pagination -----------------------------------------------------------
  const handleManualPageSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const p = parseInt(manualPageInput, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          onPageChange(p);
        }
        setManualPageInput("");
      }
    },
    [manualPageInput, totalPages, onPageChange],
  );

  const paginationPages = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (page > 3) pages.push("ellipsis");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("ellipsis");

      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  // ---- Keyboard nav for rows ------------------------------------------------
  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, row: T) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick?.(row);
      }
    },
    [onRowClick],
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* ------------------------------------------------------------------ */}
      {/* TOOLBAR                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-200">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? `Search ${moduleName}...`}
            className={cn(
              "w-full pl-9 pr-9 py-2 text-sm rounded-md border border-gray-300",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "transition-colors",
            )}
            aria-label={`Search ${moduleName}`}
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Column visibility toggle */}
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                showColumnMenu
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
              )}
              aria-label="Toggle column visibility"
              aria-expanded={showColumnMenu}
              type="button"
            >
              <Columns className="h-4 w-4" />
              <span className="hidden md:inline">Columns</span>
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Toggle Columns
                </div>
                {columns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    type="button"
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center h-4 w-4 rounded border mr-2.5 transition-colors",
                        columnVisibility[col.key]
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 bg-white",
                      )}
                    >
                      {columnVisibility[col.key] && <Check className="h-3 w-3" />}
                    </span>
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export button */}
          {onExport && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => {
                  setShowExportMenu((v) => !v);
                  setExportMode(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border transition-colors",
                  showExportMenu
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                )}
                aria-label="Export data"
                aria-expanded={showExportMenu}
                type="button"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {exportMode === null ? (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Export Mode
                      </div>
                      {EXPORT_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => handleExportModeSelect(mode.value)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          type="button"
                        >
                          {mode.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Select Format
                      </div>
                      {EXPORT_FORMATS.map((fmt) => (
                        <button
                          key={fmt.value}
                          onClick={() => handleExportFormatSelect(fmt.value)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          type="button"
                        >
                          {fmt.label}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => setExportMode(null)}
                          className="flex items-center w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                          type="button"
                        >
                          <ChevronLeft className="h-3 w-3 mr-1" /> Back
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create button */}
          {onCreate && (
            <button
              onClick={onCreate}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              )}
              type="button"
            >
              <Plus className="h-4 w-4" />
              {createLabel ?? `Create New ${moduleName}`}
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABLE                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full min-w-[800px] text-sm" role="grid">
          {/* Head */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Checkbox column */}
              {onSelectionChange && (
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Data columns */}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-gray-900 transition-colors",
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(col.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                  role={col.sortable ? "columnheader button" : "columnheader"}
                  aria-sort={
                    sortBy === col.key
                      ? sortOrder === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={cn(
                            "h-3 w-3 -mb-0.5",
                            sortBy === col.key && sortOrder === "asc"
                              ? "text-blue-600"
                              : "text-gray-300",
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 -mt-0.5",
                            sortBy === col.key && sortOrder === "desc"
                              ? "text-blue-600"
                              : "text-gray-300",
                          )}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}

              {/* Actions column */}
              {(onRowClick || onEdit || onDelete) && (
                <th className="w-28 px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {/* Loading skeleton */}
            {isLoading && (
              <>
                {Array.from({ length: Math.min(limit, 10) }).map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} colSpan={visibleColumns.length} />
                ))}
              </>
            )}

            {/* Empty state */}
            {!isLoading && data.length === 0 && (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length +
                    (onSelectionChange ? 1 : 0) +
                    (onRowClick || onEdit || onDelete ? 1 : 0)
                  }
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No records found</p>
                    <p className="text-xs text-gray-400">
                      Try adjusting your search or filters to find what you are looking for.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              data.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isRowSelected = selectedRows.includes(rowId);
                const isFirstVisibleLink = visibleColumns.findIndex((c) => c.isLink !== false) === 0;

                return (
                  <tr
                    key={rowId || rowIndex}
                    className={cn(
                      "transition-colors",
                      isRowSelected ? "bg-blue-50" : "hover:bg-gray-50",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => handleRowKeyDown(e, row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "row button" : "row"}
                    aria-selected={isRowSelected || undefined}
                  >
                    {/* Checkbox */}
                    {onSelectionChange && (
                      <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleRowSelection(rowId)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {visibleColumns.map((col, colIndex) => {
                      const value = getCellValue(row, col.key);
                      const isLinkColumn =
                        col.isLink === true || (col.isLink !== false && colIndex === 0);

                      return (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                          style={col.width ? { width: col.width, maxWidth: col.width } : undefined}
                        >
                          {col.render ? (
                            col.render(value, row)
                          ) : isLinkColumn ? (
                            <span className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer">
                              {value != null ? String(value) : "-"}
                            </span>
                          ) : (
                            <span className="truncate block max-w-[250px]" title={value != null ? String(value) : ""}>
                              {value != null ? String(value) : "-"}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    {(onRowClick || onEdit || onDelete) && (
                      <td className="w-28 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {onRowClick && (
                            <button
                              onClick={() => onRowClick(row)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              aria-label={`View row ${rowIndex + 1}`}
                              title="View"
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              aria-label={`Edit row ${rowIndex + 1}`}
                              title="Edit"
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label={`Delete row ${rowIndex + 1}`}
                              title="Delete"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
        {/* Left: record info */}
        <div className="text-sm text-gray-600 whitespace-nowrap order-2 md:order-1">
          {total > 0 ? (
            <>
              Showing{" "}
              <span className="font-medium text-gray-900">{startRecord}</span> to{" "}
              <span className="font-medium text-gray-900">{endRecord}</span> of{" "}
              <span className="font-medium text-gray-900">{total.toLocaleString()}</span> entries
              {selectedRows.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({selectedRows.length} selected)
                </span>
              )}
            </>
          ) : (
            "No entries to display"
          )}
        </div>

        {/* Center-left: rows per page */}
        <div className="flex items-center gap-2 order-1 md:order-2">
          <label
            htmlFor="rows-per-page"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            Rows per page:
          </label>
          <select
            id="rows-per-page"
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            className={cn(
              "px-2 py-1.5 text-sm rounded-md border border-gray-300 bg-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "cursor-pointer",
            )}
          >
            {ROWS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Right: pagination */}
        <div className="flex items-center gap-1 order-3">
          {/* Previous */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors",
              page <= 1
                ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
            )}
            aria-label="Previous page"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {paginationPages.map((p, idx) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1.5 text-sm text-gray-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "min-w-[36px] px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors",
                    page === p
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
                  )}
                  aria-label={`Go to page ${p}`}
                  aria-current={page === p ? "page" : undefined}
                  type="button"
                >
                  {p}
                </button>
              ),
            )}
          </div>

          {/* Mobile page indicator */}
          <span className="sm:hidden text-sm text-gray-600 px-2">
            {page}/{totalPages}
          </span>

          {/* Manual page input */}
          <div className="hidden lg:flex items-center gap-1.5 ml-1">
            <span className="text-sm text-gray-500">Go to</span>
            <input
              type="text"
              value={manualPageInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setManualPageInput(val);
              }}
              onKeyDown={handleManualPageSubmit}
              placeholder="#"
              className={cn(
                "w-12 px-2 py-1.5 text-sm text-center rounded-md border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              )}
              aria-label="Go to page number"
            />
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors",
              page >= totalPages
                ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
            )}
            aria-label="Next page"
            type="button"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
