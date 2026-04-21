"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Maximize2,
  Minimize2,
  Bell,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeaderProps {
  currentModule: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  read: boolean;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 300;
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_KEY = "crm-recent-searches";

const NOTIFICATION_COLORS: Record<Notification["type"], string> = {
  success: "bg-green-500",
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

const NOTIFICATION_TEXT_COLORS: Record<Notification["type"], string> = {
  success: "text-green-600 dark:text-green-400",
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Detects clicks outside the provided ref and invokes the callback.
 */
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void
) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
}

/**
 * Listens for the Escape key globally and invokes the callback.
 */
function useEscapeKey(callback: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        callback();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Search bar with debounced input, recent searches, and keyboard navigation */
function SearchBar({ currentModule }: { currentModule: string }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Silently ignore parse errors
    }
  }, []);

  // Debounce the query input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const showDropdown = isFocused && recentSearches.length > 0 && query === "";

  const persistSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s !== trimmed),
      ].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
    },
    [recentSearches]
  );

  const handleSubmit = useCallback(
    (term: string) => {
      const value = term.trim();
      if (!value) return;
      persistSearch(value);
      setQuery(value);
      setIsFocused(false);
      inputRef.current?.blur();
      // In a real app you would trigger a search action / route here
    },
    [persistSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        if (e.key === "Enter") {
          handleSubmit(query);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < recentSearches.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : recentSearches.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSubmit(recentSearches[highlightedIndex]);
          } else {
            handleSubmit(query);
          }
          break;
        case "Escape":
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, query, highlightedIndex, recentSearches, handleSubmit]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useClickOutside(
    containerRef,
    useCallback(() => setIsFocused(false), [])
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-all duration-200 dark:bg-gray-800",
          isFocused
            ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400 dark:ring-blue-400/20"
            : "border-gray-300 dark:border-gray-600"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          aria-label={`Search in ${currentModule}`}
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Recent searches dropdown */}
      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 dark:border-gray-700 dark:bg-gray-800">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent Searches
          </div>
          <ul role="listbox" className="py-1">
            {recentSearches.map((term, index) => (
              <li
                key={term}
                role="option"
                aria-selected={index === highlightedIndex}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                  index === highlightedIndex
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur before click fires
                  handleSubmit(term);
                }}
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{term}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Full-screen toggle button */
function FullScreenToggle() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullScreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen API may not be available in all contexts
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      {isFullScreen ? (
        <Minimize2 className="h-5 w-5" />
      ) : (
        <Maximize2 className="h-5 w-5" />
      )}
    </button>
  );
}

/** Notification bell with badge and dropdown panel */
function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New lead assigned",
      message: "A new lead has been assigned to you.",
      type: "info",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "2",
      title: "Deal closed",
      message: "The deal with Acme Corp has been closed successfully.",
      type: "success",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "3",
      title: "Follow-up reminder",
      message: "You have a follow-up scheduled for today.",
      type: "warning",
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      ),
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const closePanel = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, closePanel);
  useEscapeKey(closePanel);

  /** Format a relative timestamp for display */
  function formatTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-gray-700 dark:bg-gray-800 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {sortedNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    {/* Type indicator dot */}
                    <span
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        NOTIFICATION_COLORS[notification.type]
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            notification.read
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-900 dark:text-gray-100"
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>
                    </div>
                    {/* Unread indicator */}
                    {!notification.read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** User profile dropdown with avatar, info, and actions */
function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { user, logout } = useAuthStore();

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  useClickOutside(containerRef, closeDropdown);
  useEscapeKey(closeDropdown);

  const handleViewProfile = useCallback(() => {
    setIsOpen(false);
    router.push("/profile");
  }, [router]);

  const handleSignOut = useCallback(() => {
    setIsOpen(false);
    logout();
    router.push("/login");
  }, [logout, router]);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "User";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.roleName ?? user?.userType ?? "Member";
  const avatarUrl = user?.avatarUrl ?? null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          isOpen && "bg-gray-100 dark:bg-gray-700"
        )}
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-2 ring-gray-200 dark:bg-blue-900 dark:ring-gray-600">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </span>
        )}

        {/* Name & role */}
        <div className="hidden text-left md:block">
          <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
            {displayName}
          </p>
          <p className="text-xs leading-tight text-gray-500 dark:text-gray-400">
            {displayRole}
          </p>
        </div>

        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-gray-400 transition-transform duration-200 md:block",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-gray-700 dark:bg-gray-800">
          {/* User info section */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {displayEmail}
                  </p>
                )}
                <p className="mt-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleViewProfile}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
            >
              <User className="h-4 w-4 text-gray-400" />
              View Profile
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header (main export)
// ---------------------------------------------------------------------------

export default function Header({ currentModule }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 md:px-6">
      {/* Search */}
      <SearchBar currentModule={currentModule} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <FullScreenToggle />

        <NotificationBell />

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <UserProfileDropdown />
      </div>
    </header>
  );
}
