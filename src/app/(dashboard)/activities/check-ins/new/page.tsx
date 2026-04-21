"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDateTime } from "@/lib/utils";
import {
  MapPin,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface ActiveCheckIn {
  id: string;
  checkInTime: string;
  checkInAddress?: string;
  relatedToType?: string;
  relatedToName?: string;
  purpose?: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export default function NewCheckInPage() {
  const { fetchApi } = useApi();
  const { latitude, longitude, address, status: gpsStatus, error: gpsError, requestLocation } =
    useGeolocation();

  // Active check-in state
  const [activeCheckIn, setActiveCheckIn] = useState<ActiveCheckIn | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Form state for new check-in
  const [clientType, setClientType] = useState("Account");
  const [clientId, setClientId] = useState("");
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");

  // Action state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Duration timer for active check-in
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request GPS on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch active check-in on mount
  useEffect(() => {
    async function fetchActive() {
      setLoadingActive(true);
      try {
        const res = await fetchApi<{ data: ActiveCheckIn | null }>(
          "/api/check-ins/active"
        );
        setActiveCheckIn(res.data ?? null);
      } catch {
        setActiveCheckIn(null);
      } finally {
        setLoadingActive(false);
      }
    }
    fetchActive();
  }, [fetchApi]);

  // Elapsed time timer for active check-in
  useEffect(() => {
    if (activeCheckIn) {
      const calcElapsed = () => {
        const start = new Date(activeCheckIn.checkInTime).getTime();
        const now = Date.now();
        setElapsedMinutes(Math.floor((now - start) / 60000));
      };
      calcElapsed();
      timerRef.current = setInterval(calcElapsed, 60000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsedMinutes(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeCheckIn]);

  // Fetch clients when client type changes
  const fetchClients = useCallback(
    async (type: string) => {
      setLoadingClients(true);
      setClientOptions([]);
      setClientId("");
      try {
        let endpoint = "/api/accounts?limit=100";
        if (type === "Lead") endpoint = "/api/leads?limit=100";
        if (type === "Contact") endpoint = "/api/contacts?limit=100";

        const res = await fetchApi<{
          data: Array<{ id: string; name?: string; firstName?: string; lastName?: string }>;
        }>(endpoint);

        const options: ClientOption[] = (res.data ?? []).map((item) => ({
          id: item.id,
          name:
            item.name ||
            [item.firstName, item.lastName].filter(Boolean).join(" ") ||
            item.id,
        }));
        setClientOptions(options);
      } catch {
        setClientOptions([]);
      } finally {
        setLoadingClients(false);
      }
    },
    [fetchApi]
  );

  // Fetch clients on mount and when type changes
  useEffect(() => {
    fetchClients(clientType);
  }, [clientType, fetchClients]);

  const formatElapsed = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const gpsReady = gpsStatus === "success" && latitude !== null && longitude !== null;

  // Handle check-in
  const handleCheckIn = async () => {
    if (!gpsReady) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const selectedClient = clientOptions.find((c) => c.id === clientId);
      const payload = {
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInAddress: address,
        relatedToType: clientType || undefined,
        relatedToId: clientId || undefined,
        relatedToName: selectedClient?.name || undefined,
        purpose: purpose || undefined,
        remarks: remarks || undefined,
      };

      const res = await fetchApi<{ data: ActiveCheckIn }>("/api/check-ins", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setActiveCheckIn(res.data ?? null);
      // Reset form
      setPurpose("");
      setRemarks("");
      setClientId("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to check in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!activeCheckIn || !gpsReady) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
        checkOutAddress: address,
      };

      await fetchApi(`/api/check-ins/${activeCheckIn.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const totalDuration = formatElapsed(elapsedMinutes);
      setActiveCheckIn(null);
      setSuccessMessage(`Checked out successfully! Total duration: ${totalDuration}`);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to check out. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loadingActive) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">Location Check-In</h1>
        <p className="text-sm text-gray-500 mt-1">Record your field visit</p>
      </div>

      {/* GPS Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 p-2 rounded-full ${
              gpsStatus === "success"
                ? "bg-green-100"
                : gpsStatus === "error"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            {gpsStatus === "loading" ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : gpsStatus === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : gpsStatus === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <MapPin className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Your Location</p>
            {gpsStatus === "loading" && (
              <p className="text-sm text-gray-500 mt-1">Detecting your location...</p>
            )}
            {gpsStatus === "error" && (
              <div className="mt-1">
                <p className="text-sm text-red-600">{gpsError}</p>
                <button
                  onClick={requestLocation}
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}
            {gpsStatus === "success" && (
              <div className="mt-1">
                {address && (
                  <p className="text-sm text-gray-700 break-words">{address}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </p>
              </div>
            )}
            {gpsStatus === "idle" && (
              <p className="text-sm text-gray-500 mt-1">
                Waiting for GPS...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Check-In Mode (no active check-in) */}
      {!activeCheckIn && !successMessage && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Visit Details</h2>

          {/* Client Type */}
          <div className="space-y-1">
            <label
              htmlFor="clientType"
              className="block text-sm font-medium text-gray-700"
            >
              Client Type
            </label>
            <select
              id="clientType"
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="Account">Account</option>
              <option value="Lead">Lead</option>
              <option value="Contact">Contact</option>
            </select>
          </div>

          {/* Client Name */}
          <div className="space-y-1">
            <label
              htmlFor="clientName"
              className="block text-sm font-medium text-gray-700"
            >
              Client Name
            </label>
            <select
              id="clientName"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">
                {loadingClients ? "Loading..." : "Select Client"}
              </option>
              {clientOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div className="space-y-1">
            <label
              htmlFor="purpose"
              className="block text-sm font-medium text-gray-700"
            >
              Purpose of Visit
            </label>
            <input
              id="purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Enter purpose of visit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700"
            >
              Remarks
            </label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* CHECK IN Button */}
          <button
            onClick={handleCheckIn}
            disabled={!gpsReady || submitting}
            className="w-full h-14 flex items-center justify-center gap-2 text-lg font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                CHECK IN
              </>
            )}
          </button>

          {!gpsReady && gpsStatus !== "loading" && (
            <p className="text-xs text-center text-amber-600">
              GPS location is required to check in
            </p>
          )}
        </div>
      )}

      {/* Check-Out Mode (active check-in exists) */}
      {activeCheckIn && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Active Check-In</h2>

          {/* Active check-in info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Checked in at {formatDateTime(activeCheckIn.checkInTime)}
              </span>
            </div>

            {activeCheckIn.checkInAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-700 break-words">
                  {activeCheckIn.checkInAddress}
                </span>
              </div>
            )}

            {activeCheckIn.relatedToName && (
              <div className="text-sm text-amber-700">
                <span className="font-medium">Visiting:</span>{" "}
                {activeCheckIn.relatedToName}
                {activeCheckIn.relatedToType && (
                  <span className="text-amber-500 text-xs ml-1">
                    ({activeCheckIn.relatedToType})
                  </span>
                )}
              </div>
            )}

            {activeCheckIn.purpose && (
              <div className="text-sm text-amber-700">
                <span className="font-medium">Purpose:</span> {activeCheckIn.purpose}
              </div>
            )}
          </div>

          {/* Duration so far */}
          <div className="flex items-center justify-center gap-2 py-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-2xl font-bold text-gray-900">
              {formatElapsed(elapsedMinutes)}
            </span>
            <span className="text-sm text-gray-500">elapsed</span>
          </div>

          {/* CHECK OUT Button */}
          <button
            onClick={handleCheckOut}
            disabled={!gpsReady || submitting}
            className="w-full h-14 flex items-center justify-center gap-2 text-lg font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking Out...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                CHECK OUT
              </>
            )}
          </button>

          {!gpsReady && gpsStatus !== "loading" && (
            <p className="text-xs text-center text-amber-600">
              GPS location is required to check out
            </p>
          )}
        </div>
      )}
    </div>
  );
}
