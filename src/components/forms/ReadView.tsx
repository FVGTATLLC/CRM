"use client";
import React from "react";
import FormModal from "./FormModal";
import { formatDateTime } from "@/lib/utils";

interface ReadField {
  label: string;
  value: string | number | boolean | null | undefined;
  isLink?: boolean;
  onLinkClick?: () => void;
  isBadge?: boolean;
  badgeColor?: string;
}

interface ReadSection {
  title: string;
  fields: ReadField[];
}

interface ReadViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: ReadSection[];
  onEdit?: () => void;
  children?: React.ReactNode;
}

export default function ReadView({ isOpen, onClose, title, sections, onEdit, children }: ReadViewProps) {
  const renderValue = (field: ReadField) => {
    if (field.value === null || field.value === undefined || field.value === "") {
      return <span className="text-gray-400">—</span>;
    }

    if (field.isBadge) {
      const color = field.badgeColor || (field.value === "Active" ? "green" : "gray");
      return (
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}>
          {String(field.value)}
        </span>
      );
    }

    if (field.isLink && field.onLinkClick) {
      return (
        <button onClick={field.onLinkClick} className="text-blue-600 hover:text-blue-800 hover:underline">
          {String(field.value)}
        </button>
      );
    }

    if (typeof field.value === "boolean") {
      return <span>{field.value ? "Yes" : "No"}</span>;
    }

    // Check if it looks like a date
    if (typeof field.value === "string" && field.value.includes("T") && field.value.includes("-")) {
      return <span>{formatDateTime(field.value)}</span>;
    }

    return <span>{String(field.value)}</span>;
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field, fidx) => (
                <div key={fidx} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 mb-1">{field.label}</span>
                  <span className="text-sm text-gray-900">{renderValue(field)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Extra content (e.g. action buttons from parent) */}
        {children}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </FormModal>
  );
}
