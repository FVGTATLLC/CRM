"use client";
import { create } from "zustand";
import { useCallback, useEffect, useRef } from "react";
import { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_token", token);
      localStorage.setItem("crm_user", JSON.stringify(user));
    }
    set({ user, token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
    }
    set({ user: null, token: null, isLoading: false });
  },
  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("crm_token");
      const userStr = localStorage.getItem("crm_user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },
}));

const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useSessionManager() {
  const { token, logout, setAuth } = useAuthStore();
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!token) return;

    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keypress", updateActivity);
    window.addEventListener("click", updateActivity);

    // Auto refresh token every 25 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const currentToken = localStorage.getItem("crm_token");
        if (!currentToken) return;

        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.token) {
            const userStr = localStorage.getItem("crm_user");
            if (userStr) {
              const user = JSON.parse(userStr);
              setAuth(user, data.data.token);
            }
          }
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }, TOKEN_REFRESH_INTERVAL);

    // Check for inactivity every minute
    const inactivityInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT) {
        logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }, 60 * 1000);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keypress", updateActivity);
      window.removeEventListener("click", updateActivity);
      clearInterval(refreshInterval);
      clearInterval(inactivityInterval);
    };
  }, [token, logout, setAuth]);
}

export function useApi() {
  const { token, logout } = useAuthStore();

  const fetchApi = useCallback(
    async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      if (res.status === 401) {
        logout();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [token, logout]
  );

  return { fetchApi };
}
