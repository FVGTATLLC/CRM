export type UserType = "SuperAdmin" | "Admin" | "Standard";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  userType: UserType;
  avatarUrl?: string | null;
  roleId?: string | null;
  roleName?: string;
  businessLineName?: string;
  departmentName?: string;
  branchCode?: string;
}

export interface SidebarModule {
  id: string;
  name: string;
  shortCode: string;
  icon: string;
  href: string;
  category: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface TableFilters {
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export interface NotificationItem {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DateFilterOption {
  label: string;
  value: string;
  category: string;
}

export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { label: "Lifetime/All Time", value: "lifetime", category: "General" },
  { label: "Custom", value: "custom", category: "General" },
  { label: "MTD", value: "mtd", category: "General" },
  { label: "YTD", value: "ytd", category: "General" },
  { label: "Today", value: "today", category: "Daily" },
  { label: "Yesterday", value: "yesterday", category: "Daily" },
  { label: "Last 7 Days", value: "last7days", category: "Daily" },
  { label: "Last 14 Days", value: "last14days", category: "Daily" },
  { label: "Last 30 Days", value: "last30days", category: "Daily" },
  { label: "Last 60 Days", value: "last60days", category: "Daily" },
  { label: "Last 90 Days", value: "last90days", category: "Daily" },
  { label: "Tomorrow", value: "tomorrow", category: "Daily" },
  { label: "This Week", value: "thisweek", category: "Weekly" },
  { label: "Last Week", value: "lastweek", category: "Weekly" },
  { label: "This Month", value: "thismonth", category: "Monthly" },
  { label: "Last Month", value: "lastmonth", category: "Monthly" },
  { label: "This Quarter", value: "thisquarter", category: "Quarterly" },
  { label: "Last Quarter", value: "lastquarter", category: "Quarterly" },
  { label: "This Year", value: "thisyear", category: "Yearly" },
  { label: "Last Year", value: "lastyear", category: "Yearly" },
];

export interface LocationCheckIn {
  id: string;
  checkInTime: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAddress?: string;
  checkOutTime?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  durationMinutes?: number;
  relatedToType?: string;
  relatedToId?: string;
  relatedToName?: string;
  purpose?: string;
  remarks?: string;
  status: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  version: number;
  remarks?: string;
  uploadedBy?: { firstName: string; lastName: string };
  createdAt: string;
}

export interface DocumentUploadProps {
  relatedToType: string;
  relatedToId: string;
  relatedToName?: string;
  proposalId?: string;
  contractId?: string;
  accountId?: string;
}

export interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  sentDate?: string;
  status: string;
  sentBy?: { firstName: string; lastName: string };
  createdAt: string;
}

export interface EmailLogPanelProps {
  relatedToType: string;
  relatedToId: string;
  relatedToName?: string;
  proposalId?: string;
  contractId?: string;
}

export interface ActivityItem {
  id: string;
  activityType: string;
  subject: string;
  description?: string;
  activityDate: string;
  status: string;
  priority?: string;
  owner?: { firstName: string; lastName: string };
}

export interface ActivityTimelineProps {
  relatedToType: string;
  relatedToId: string;
}
