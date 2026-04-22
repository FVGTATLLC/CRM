"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "date" | "datetime-local" | "textarea" | "select";
  value: string | number;
  onChange: (name: string, value: string | number) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  error?: string;
  options?: { label: string; value: string }[];
  className?: string;
  rows?: number;
}

export default function FormField({
  label, name, type = "text", value, onChange, required = false,
  disabled = false, readOnly = false, placeholder, error, options, className, rows = 3,
}: FormFieldProps) {
  const baseClasses = cn(
    "w-full px-3 py-2 border rounded-lg text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    error ? "border-red-500" : "border-gray-300",
    disabled || readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white",
    className
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(name, e.target.value);
  };

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          rows={rows}
          className={baseClasses}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={baseClasses}
        >
          <option value="">Select {label}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => {
            // Numbers cannot be negative anywhere in the app
            if (type === "number" && e.target.value !== "" && Number(e.target.value) < 0) {
              onChange(name, "0");
              return;
            }
            handleChange(e);
          }}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          {...(type === "number" ? { min: 0, step: "any" } : {})}
          className={baseClasses}
        />
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
