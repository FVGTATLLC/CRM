"use client";

import React, { useState, useEffect, useCallback } from "react";
import DataTable from "@/components/table/DataTable";
import FormModal from "@/components/forms/FormModal";
import FormField from "@/components/forms/FormField";
import ReadView from "@/components/forms/ReadView";
import { useApi } from "@/hooks/useAuth";
import type { ColumnDef } from "@/components/table/DataTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductCategoryKind =
  | "hotels"
  | "carRentals"
  | "excursions"
  | "packages"
  | "visa"
  | "generic";

interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  status: string;
  details?: Record<string, string> | null;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectCategoryKind(categoryName: string): ProductCategoryKind {
  const c = (categoryName || "").toLowerCase();
  if (c.includes("hotel")) return "hotels";
  if (c.includes("car")) return "carRentals";
  if (c.includes("excursion")) return "excursions";
  if (c.includes("package")) return "packages";
  if (c.includes("visa")) return "visa";
  return "generic";
}

const COMMON_FORM_KEYS = [
  "category",
  "name",
  "price",
  "imageUrl",
  "description",
  "status",
];

const HOTEL_FIELDS = [
  "unit",
  "destination",
  "address",
  "starRating",
  "heroTag",
  "overview",
  "propertyHighlights",
  "amenities",
  "roomTypes",
  "checkInOut",
  "propertyRules",
  "nearbyAttractions",
];

const CAR_FIELDS = [
  "city",
  "serviceType",
  "fixedTimeDuration",
  "heroTag",
  "overview",
  "vehicleHighlights",
  "features",
  "inclusions",
  "policies",
];

const EXCURSION_FIELDS = [
  "unit",
  "destination",
  "duration",
  "heroTag",
  "overview",
  "highlights",
  "inclusions",
  "exclusions",
  "importantNotes",
  "timingOptions",
];

const PACKAGE_FIELDS = [
  "unit",
  "destination",
  "duration",
  "heroTag",
  "overview",
  "highlights",
  "inclusions",
  "exclusions",
  "suggestedHotels",
  "itinerary",
];

const VISA_FIELDS = [
  "visaCountry",
  "visaType",
  "processingTime",
  "documentsRequired",
  "heroTag",
  "overview",
  "notes",
];

function buildEmptyDetails(kind: ProductCategoryKind): Record<string, string> {
  const keys =
    kind === "hotels"
      ? HOTEL_FIELDS
      : kind === "carRentals"
      ? CAR_FIELDS
      : kind === "excursions"
      ? EXCURSION_FIELDS
      : kind === "packages"
      ? PACKAGE_FIELDS
      : kind === "visa"
      ? VISA_FIELDS
      : [];
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = "";
  // Hotels have a fixed unit display value
  if (kind === "hotels") out.unit = "Per Room Per Night";
  return out;
}

const INITIAL_FORM: Record<string, string> = {
  category: "",
  name: "",
  price: "",
  imageUrl: "",
  description: "",
  status: "Active",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProductsPage() {
  const { fetchApi } = useApi();

  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Product | null>(null);
  const [form, setForm] = useState<Record<string, string>>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchApi<{ data: CategoryOption[] }>(
          `/api/product-categories?activeOnly=true`
        );
        setCategories(res.data ?? []);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, [fetchApi]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<{ data: Product[]; total: number }>(
        `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
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

  const kind = detectCategoryKind(form.category);

  const handleFieldChange = (name: string, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [name]: String(value) };
      if (name === "category") {
        // Reset all detail fields when switching category
        const newKind = detectCategoryKind(String(value));
        // Drop any prior detail keys
        const cleaned: Record<string, string> = {};
        for (const k of Object.keys(next)) {
          if (COMMON_FORM_KEYS.includes(k)) cleaned[k] = next[k];
        }
        return { ...cleaned, ...buildEmptyDetails(newKind) };
      }
      // If serviceType changed away from "With Driver Fixed Time", clear duration
      if (name === "serviceType" && String(value) !== "With Driver Fixed Time") {
        next.fixedTimeDuration = "";
      }
      return next;
    });
  };

  // Pull the details object out of form state
  function extractDetails(state: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const k of Object.keys(state)) {
      if (!COMMON_FORM_KEYS.includes(k) && state[k] !== "") {
        out[k] = state[k];
      }
    }
    return out;
  }

  const handleCreate = async () => {
    if (!form.category) return alert("Category is required");
    if (!form.name.trim()) return alert("Name is required");
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) {
      return alert("Price must be a valid non-negative number");
    }
    setSaving(true);
    try {
      await fetchApi("/api/products", {
        method: "POST",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price: Number(form.price),
          imageUrl: form.imageUrl || undefined,
          description: form.description || undefined,
          status: form.status || "Active",
          details: extractDetails(form),
        }),
      });
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      fetchData();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRow) return;
    if (form.price !== "" && (isNaN(Number(form.price)) || Number(form.price) < 0)) {
      return alert("Price must be a valid non-negative number");
    }
    setSaving(true);
    try {
      await fetchApi(`/api/products/${selectedRow.id}`, {
        method: "PUT",
        body: JSON.stringify({
          category: form.category,
          name: form.name,
          price: Number(form.price),
          imageUrl: form.imageUrl || undefined,
          description: form.description || undefined,
          status: form.status,
          details: extractDetails(form),
        }),
      });
      setEditOpen(false);
      setSelectedRow(null);
      setForm(INITIAL_FORM);
      fetchData();
    } catch (e) {
      if (e instanceof Error) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Product) => {
    if (!confirm(`Delete product "${row.name}"? This cannot be undone.`)) return;
    try {
      await fetchApi(`/api/products/${row.id}`, { method: "DELETE" });
      fetchData();
    } catch {
      // handle error
    }
  };

  const openEdit = (row: Product) => {
    setSelectedRow(row);
    const rowKind = detectCategoryKind(row.category);
    const detailsState = buildEmptyDetails(rowKind);
    if (row.details && typeof row.details === "object") {
      for (const k of Object.keys(row.details)) {
        detailsState[k] = String(row.details[k] ?? "");
      }
    }
    setForm({
      category: row.category ?? "",
      name: row.name ?? "",
      price: row.price != null ? String(row.price) : "",
      imageUrl: row.imageUrl ?? "",
      description: row.description ?? "",
      status: row.status ?? "Active",
      ...detailsState,
    });
    setEditOpen(true);
  };

  const openRead = (row: Product) => {
    setSelectedRow(row);
    setReadOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: "imageUrl",
      label: "Image",
      sortable: false,
      render: (value: string | null) =>
        value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="w-10 h-10 object-cover rounded-md border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200" />
        ),
    },
    { key: "name", label: "Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    {
      key: "price",
      label: "Price ($)",
      sortable: true,
      render: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: "status",
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

  // ----- Read view sections (also category-specific) -------------------------
  function detailField(label: string, key: string): { label: string; value: string } {
    const v =
      selectedRow?.details && typeof selectedRow.details === "object"
        ? String((selectedRow.details as Record<string, unknown>)[key] ?? "")
        : "";
    return { label, value: v };
  }

  let detailsSection:
    | { title: string; fields: { label: string; value: string }[] }
    | null = null;
  if (selectedRow) {
    const rowKind = detectCategoryKind(selectedRow.category);
    if (rowKind === "hotels") {
      detailsSection = {
        title: "Hotel Details",
        fields: [
          detailField("Unit", "unit"),
          detailField("Destination / City", "destination"),
          detailField("Address", "address"),
          detailField("Star Rating", "starRating"),
          detailField("Hero Tag", "heroTag"),
          detailField("Overview", "overview"),
          detailField("Property Highlights", "propertyHighlights"),
          detailField("Amenities", "amenities"),
          detailField("Room Types", "roomTypes"),
          detailField("Check-in / Check-out", "checkInOut"),
          detailField("Property Rules", "propertyRules"),
          detailField("Nearby Attractions", "nearbyAttractions"),
        ],
      };
    } else if (rowKind === "carRentals") {
      detailsSection = {
        title: "Car Rental Details",
        fields: [
          detailField("Service City", "city"),
          detailField("Service Type", "serviceType"),
          detailField("Fixed Time Duration", "fixedTimeDuration"),
          detailField("Hero Tag", "heroTag"),
          detailField("Overview", "overview"),
          detailField("Vehicle Highlights", "vehicleHighlights"),
          detailField("Features / Amenities", "features"),
          detailField("Inclusions", "inclusions"),
          detailField("Policies / Terms", "policies"),
        ],
      };
    } else if (rowKind === "excursions") {
      detailsSection = {
        title: "Excursion Details",
        fields: [
          detailField("Unit", "unit"),
          detailField("Destination", "destination"),
          detailField("Duration", "duration"),
          detailField("Hero Tag", "heroTag"),
          detailField("Overview", "overview"),
          detailField("Highlights", "highlights"),
          detailField("Inclusions", "inclusions"),
          detailField("Exclusions", "exclusions"),
          detailField("Important Notes", "importantNotes"),
          detailField("Timing Options", "timingOptions"),
        ],
      };
    } else if (rowKind === "packages") {
      detailsSection = {
        title: "Package Details",
        fields: [
          detailField("Unit", "unit"),
          detailField("Destination", "destination"),
          detailField("Duration", "duration"),
          detailField("Hero Tag", "heroTag"),
          detailField("Overview", "overview"),
          detailField("Highlights", "highlights"),
          detailField("Inclusions", "inclusions"),
          detailField("Exclusions", "exclusions"),
          detailField("Suggested Hotels", "suggestedHotels"),
          detailField("Itinerary", "itinerary"),
        ],
      };
    } else if (rowKind === "visa") {
      detailsSection = {
        title: "Visa Details",
        fields: [
          detailField("Visa Country", "visaCountry"),
          detailField("Type of Visa", "visaType"),
          detailField("Processing Time", "processingTime"),
          detailField("Documents Required", "documentsRequired"),
          detailField("Hero Tag", "heroTag"),
          detailField("Overview", "overview"),
          detailField("Notes", "notes"),
        ],
      };
    }
  }

  const readSections = selectedRow
    ? [
        {
          title: "Product Details",
          fields: [
            { label: "Name", value: selectedRow.name },
            { label: "Category", value: selectedRow.category },
            {
              label: "Price",
              value:
                selectedRow.price != null
                  ? `$${Number(selectedRow.price).toFixed(2)}`
                  : "",
            },
            {
              label: "Status",
              value: selectedRow.status,
              isBadge: true,
              badgeColor: selectedRow.status === "Active" ? "green" : "gray",
            },
            { label: "Description", value: selectedRow.description ?? "" },
            { label: "Image URL", value: selectedRow.imageUrl ?? "" },
          ],
        },
        ...(detailsSection ? [detailsSection] : []),
        {
          title: "Audit",
          fields: [
            { label: "Created By", value: selectedRow.createdBy },
            { label: "Created At", value: selectedRow.createdAt },
            { label: "Last Modified By", value: selectedRow.lastModifiedBy },
            { label: "Last Modified At", value: selectedRow.lastModifiedAt },
          ],
        },
      ]
    : [];

  // ----- Form fields per category --------------------------------------------
  const nameLabel =
    kind === "hotels"
      ? "Hotel Name"
      : kind === "carRentals"
      ? "Car Name"
      : kind === "packages"
      ? "Package Name"
      : kind === "visa"
      ? "Visa Name"
      : "Name";

  const renderHotelFields = () => (
    <>
      <FormField
        label="Unit"
        name="unit"
        value={form.unit ?? "Per Room Per Night"}
        onChange={handleFieldChange}
        readOnly
        placeholder="Per Room Per Night"
      />
      <FormField
        label="Hotel Destination / City"
        name="destination"
        value={form.destination ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Dubai"
      />
      <div className="md:col-span-2">
        <FormField
          label="Hotel Address"
          name="address"
          type="textarea"
          value={form.address ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <FormField
        label="Star Rating"
        name="starRating"
        type="select"
        value={form.starRating ?? ""}
        onChange={handleFieldChange}
        options={[
          { label: "1 Star", value: "1 Star" },
          { label: "2 Star", value: "2 Star" },
          { label: "3 Star", value: "3 Star" },
          { label: "4 Star", value: "4 Star" },
          { label: "5 Star", value: "5 Star" },
        ]}
      />
      <FormField
        label="Hero Tag"
        name="heroTag"
        value={form.heroTag ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Best Family Hotel"
      />
      <div className="md:col-span-2">
        <FormField
          label="Overview"
          name="overview"
          type="textarea"
          value={form.overview ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Property Highlights"
          name="propertyHighlights"
          type="textarea"
          value={form.propertyHighlights ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Amenities"
          name="amenities"
          type="textarea"
          value={form.amenities ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Room Types"
          name="roomTypes"
          type="textarea"
          value={form.roomTypes ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <FormField
        label="Check-in / Check-out"
        name="checkInOut"
        value={form.checkInOut ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. 14:00 / 12:00"
      />
      <div className="md:col-span-2">
        <FormField
          label="Property Rules"
          name="propertyRules"
          type="textarea"
          value={form.propertyRules ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Nearby Attractions"
          name="nearbyAttractions"
          type="textarea"
          value={form.nearbyAttractions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
    </>
  );

  const renderCarFields = () => (
    <>
      <FormField
        label="Vehicle / Service City"
        name="city"
        value={form.city ?? ""}
        onChange={handleFieldChange}
      />
      <FormField
        label="Service Type"
        name="serviceType"
        type="select"
        value={form.serviceType ?? ""}
        onChange={handleFieldChange}
        options={[
          { label: "Airport transfer", value: "Airport transfer" },
          { label: "With Driver Fixed Time", value: "With Driver Fixed Time" },
          { label: "With Driver one way", value: "With Driver one way" },
        ]}
      />
      {form.serviceType === "With Driver Fixed Time" && (
        <FormField
          label="Fixed Time Duration"
          name="fixedTimeDuration"
          type="select"
          value={form.fixedTimeDuration ?? ""}
          onChange={handleFieldChange}
          options={[
            { label: "5 Hour", value: "5 Hour" },
            { label: "10 Hour", value: "10 Hour" },
          ]}
        />
      )}
      <FormField
        label="Hero Tag"
        name="heroTag"
        value={form.heroTag ?? ""}
        onChange={handleFieldChange}
      />
      <div className="md:col-span-2">
        <FormField
          label="Overview"
          name="overview"
          type="textarea"
          value={form.overview ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Vehicle Highlights"
          name="vehicleHighlights"
          type="textarea"
          value={form.vehicleHighlights ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Features / Amenities"
          name="features"
          type="textarea"
          value={form.features ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Inclusions"
          name="inclusions"
          type="textarea"
          value={form.inclusions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Policies / Terms"
          name="policies"
          type="textarea"
          value={form.policies ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
    </>
  );

  const renderExcursionFields = () => (
    <>
      <FormField
        label="Unit"
        name="unit"
        value={form.unit ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Per Person"
      />
      <FormField
        label="Excursion Destination"
        name="destination"
        value={form.destination ?? ""}
        onChange={handleFieldChange}
      />
      <FormField
        label="Duration"
        name="duration"
        value={form.duration ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. 4 hours"
      />
      <FormField
        label="Hero Tag"
        name="heroTag"
        value={form.heroTag ?? ""}
        onChange={handleFieldChange}
      />
      <div className="md:col-span-2">
        <FormField
          label="Overview"
          name="overview"
          type="textarea"
          value={form.overview ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Highlights"
          name="highlights"
          type="textarea"
          value={form.highlights ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Inclusions"
          name="inclusions"
          type="textarea"
          value={form.inclusions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Exclusions"
          name="exclusions"
          type="textarea"
          value={form.exclusions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Important Notes"
          name="importantNotes"
          type="textarea"
          value={form.importantNotes ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Timing Options"
          name="timingOptions"
          type="textarea"
          value={form.timingOptions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
    </>
  );

  const renderPackageFields = () => (
    <>
      <FormField
        label="Unit"
        name="unit"
        value={form.unit ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Per Person"
      />
      <FormField
        label="Package Destination"
        name="destination"
        value={form.destination ?? ""}
        onChange={handleFieldChange}
      />
      <FormField
        label="Package Duration"
        name="duration"
        value={form.duration ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. 5 nights / 6 days"
      />
      <FormField
        label="Hero Tag"
        name="heroTag"
        value={form.heroTag ?? ""}
        onChange={handleFieldChange}
      />
      <div className="md:col-span-2">
        <FormField
          label="Overview"
          name="overview"
          type="textarea"
          value={form.overview ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Highlights"
          name="highlights"
          type="textarea"
          value={form.highlights ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Inclusions"
          name="inclusions"
          type="textarea"
          value={form.inclusions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Exclusions"
          name="exclusions"
          type="textarea"
          value={form.exclusions ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Suggested Hotels"
          name="suggestedHotels"
          type="textarea"
          value={form.suggestedHotels ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Itinerary"
          name="itinerary"
          type="textarea"
          value={form.itinerary ?? ""}
          onChange={handleFieldChange}
          rows={4}
        />
      </div>
    </>
  );

  const renderVisaFields = () => (
    <>
      <FormField
        label="Visa Country"
        name="visaCountry"
        value={form.visaCountry ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. United Arab Emirates"
      />
      <FormField
        label="Type of Visa"
        name="visaType"
        value={form.visaType ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Tourist, Business, Transit"
      />
      <FormField
        label="Processing Time"
        name="processingTime"
        value={form.processingTime ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. 3-5 working days"
      />
      <FormField
        label="Hero Tag"
        name="heroTag"
        value={form.heroTag ?? ""}
        onChange={handleFieldChange}
        placeholder="e.g. Fastest Visa Service"
      />
      <div className="md:col-span-2">
        <FormField
          label="Documents Required"
          name="documentsRequired"
          type="textarea"
          value={form.documentsRequired ?? ""}
          onChange={handleFieldChange}
          rows={3}
          placeholder="Passport copy, photo, application form, etc."
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Overview"
          name="overview"
          type="textarea"
          value={form.overview ?? ""}
          onChange={handleFieldChange}
          rows={3}
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          label="Notes"
          name="notes"
          type="textarea"
          value={form.notes ?? ""}
          onChange={handleFieldChange}
          rows={2}
        />
      </div>
    </>
  );

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Category"
        name="category"
        type="select"
        value={form.category}
        onChange={handleFieldChange}
        required
        options={categories.map((c) => ({ label: c.name, value: c.name }))}
      />
      <FormField
        label={nameLabel}
        name="name"
        value={form.name}
        onChange={handleFieldChange}
        required
        placeholder={`Enter ${nameLabel.toLowerCase()}`}
      />
      <FormField
        label="Price ($)"
        name="price"
        type="number"
        value={form.price}
        onChange={handleFieldChange}
        required
        placeholder="0.00"
      />
      <FormField
        label="Status"
        name="status"
        type="select"
        value={form.status}
        onChange={handleFieldChange}
        options={[
          { label: "Active", value: "Active" },
          { label: "Inactive", value: "Inactive" },
        ]}
      />

      {kind === "hotels" && renderHotelFields()}
      {kind === "carRentals" && renderCarFields()}
      {kind === "excursions" && renderExcursionFields()}
      {kind === "packages" && renderPackageFields()}
      {kind === "visa" && renderVisaFields()}

      <div className="md:col-span-2">
        <FormField
          label="Product Image URL"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleFieldChange}
          placeholder="https://..."
        />
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.imageUrl}
            alt="Preview"
            className="mt-2 w-24 h-24 object-cover rounded-md border border-gray-200"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
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
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <DataTable<Product>
        moduleName="Product"
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
        title="Create Product"
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
        title="Edit Product"
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
        title="Product Details"
        sections={readSections}
        onEdit={() => {
          setReadOpen(false);
          if (selectedRow) openEdit(selectedRow);
        }}
      />
    </div>
  );
}
