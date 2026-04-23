"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Country list with flag emoji + dial code. Add more entries as needed.
interface Country {
  code: string; // ISO-2
  name: string;
  dial: string; // e.g. "+971"
  flag: string; // emoji
}

const COUNTRIES: Country[] = [
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "TR", name: "Türkiye", dial: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
];

const DEFAULT_DIAL = "+971"; // UAE default

interface PhoneInputProps {
  label: string;
  name: string;
  value: string; // full phone string, e.g. "+971 50 123 4567"
  onChange: (name: string, value: string) => void;
  required?: boolean;
  placeholder?: string;
  /**
   * Optional country name from another field (e.g. "India", "UAE", "United Arab Emirates").
   * When provided, the phone's country/dial-code will auto-sync to it.
   * The user can still override by clicking the flag.
   */
  country?: string;
}

// Map a free-text country name to a Country entry (forgiving match)
function findCountryByName(name: string | undefined): Country | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  // Common aliases
  const aliases: Record<string, string> = {
    "uae": "AE",
    "u.a.e": "AE",
    "u.a.e.": "AE",
    "uk": "GB",
    "england": "GB",
    "britain": "GB",
    "great britain": "GB",
    "usa": "US",
    "united states of america": "US",
    "us": "US",
    "russia": "RU",
    "turkey": "TR",
    "türkiye": "TR",
  };
  const aliasCode = aliases[q];
  if (aliasCode) return COUNTRIES.find((c) => c.code === aliasCode);
  return COUNTRIES.find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.code.toLowerCase() === q ||
      c.dial === q
  );
}

function parseValue(value: string): { dial: string; rest: string } {
  const v = (value || "").trim();
  if (!v) return { dial: DEFAULT_DIAL, rest: "" };

  // Sort dial codes longest-first so "+971" matches before "+9"
  const sortedDials = COUNTRIES.map((c) => c.dial).sort(
    (a, b) => b.length - a.length
  );

  // Strip a leading "+" then attempt to match a dial code prefix
  const stripped = v.startsWith("+") ? v : `+${v.replace(/^\s*0+/, "")}`;
  for (const dial of sortedDials) {
    if (stripped.startsWith(dial)) {
      return { dial, rest: stripped.slice(dial.length).trim() };
    }
  }
  return { dial: DEFAULT_DIAL, rest: v };
}

export default function PhoneInput({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
  country,
}: PhoneInputProps) {
  const { dial: parsedDial, rest: parsedRest } = parseValue(value);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  // Track whether the user has manually picked a country (to stop auto-sync overriding it)
  const userPickedRef = useRef<boolean>(!!value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Auto-sync dial code to the linked country prop, unless the user has already typed a number
  useEffect(() => {
    if (!country) return;
    if (userPickedRef.current && parsedRest) return; // don't clobber an already-typed number
    const matched = findCountryByName(country);
    if (matched && matched.dial !== parsedDial) {
      const composed = parsedRest ? `${matched.dial} ${parsedRest}`.trim() : matched.dial;
      onChange(name, composed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.dial === parsedDial) || COUNTRIES[0],
    [parsedDial]
  );

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase() === q
    );
  }, [search]);

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value.replace(/[^0-9 \-]/g, "");
    const composed = next ? `${parsedDial} ${next}`.trim() : "";
    userPickedRef.current = true;
    onChange(name, composed);
  }

  function handleCountryPick(c: Country) {
    setOpen(false);
    setSearch("");
    const composed = parsedRest ? `${c.dial} ${parsedRest}`.trim() : c.dial;
    userPickedRef.current = true;
    onChange(name, composed);
  }

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div ref={containerRef} className="relative flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[90px]"
          aria-label="Select country code"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span>{selectedCountry.dial}</span>
          <svg className="w-3 h-3 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <input
          id={name}
          name={name}
          type="tel"
          value={parsedRest}
          onChange={handleNumberChange}
          required={required}
          placeholder={placeholder || "50 123 4567"}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {open && (
          <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                placeholder="Search country or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <ul className="overflow-y-auto flex-1">
              {filteredCountries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleCountryPick(c)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                      c.dial === parsedDial ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-gray-400">{c.dial}</span>
                  </button>
                </li>
              ))}
              {filteredCountries.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">No matches</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
