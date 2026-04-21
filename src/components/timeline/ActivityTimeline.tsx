"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useAuth";
import { Phone, Users, FileText, Clock, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ActivityItem {
  id: string;
  activityType: string;
  subject: string;
  description?: string;
  activityDate: string;
  status: string;
  priority?: string;
  owner?: { firstName: string; lastName: string };
}

interface ActivityTimelineProps {
  relatedToType: string;
  relatedToId: string;
}

export default function ActivityTimeline({ relatedToType, relatedToId }: ActivityTimelineProps) {
  const { fetchApi } = useApi();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await fetchApi<{ success: boolean; data: ActivityItem[] }>(`/api/activities?relatedToType=${relatedToType}&relatedToId=${relatedToId}`);
        if (data.success) setActivities(data.data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };
    if (relatedToId) fetchActivities();
  }, [relatedToId]);

  const typeIcon: Record<string, any> = {
    Meeting: Users,
    Call: Phone,
    MOM: FileText,
    Email: FileText,
    Chat: FileText,
  };

  const statusColor: Record<string, string> = {
    Planned: "text-blue-500",
    Completed: "text-green-500",
    Cancelled: "text-red-500",
  };

  return (
    <div className="border rounded-lg p-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Activity Timeline</h4>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No activities recorded</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = typeIcon[activity.activityType] || Clock;
              return (
                <div key={activity.id} className="relative pl-10">
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-blue-400" />
                  <div className="bg-white border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className={statusColor[activity.status] || "text-gray-500"} />
                      <span className="text-sm font-medium text-gray-700">{activity.subject}</span>
                      <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${activity.status === "Completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                        {activity.status}
                      </span>
                    </div>
                    {activity.description && <p className="text-xs text-gray-500 mb-1">{activity.description}</p>}
                    <p className="text-xs text-gray-400">
                      {activity.activityType} {formatDateTime(activity.activityDate)}
                      {activity.owner && ` by ${activity.owner.firstName} ${activity.owner.lastName}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
