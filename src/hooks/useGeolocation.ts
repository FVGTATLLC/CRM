"use client";
import { useState, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    status: "idle",
    error: null,
  });

  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode via Nominatim (free, no API key)
      let address: string | null = null;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { "User-Agent": "FLYVENTOCRM/1.0" } }
        );
        const data = await res.json();
        address = data.display_name || null;
      } catch {
        // Reverse geocoding failure is non-fatal
      }

      setState({
        latitude,
        longitude,
        address,
        status: "success",
        error: null,
      });
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      let message = "Failed to get location";
      if (geoErr.code === 1)
        message =
          "Location permission denied. Please enable location access in your browser settings.";
      if (geoErr.code === 2)
        message = "Location unavailable. Please try again.";
      if (geoErr.code === 3)
        message = "Location request timed out. Please try again.";
      setState((prev) => ({ ...prev, status: "error", error: message }));
    }
  }, []);

  return { ...state, requestLocation };
}
