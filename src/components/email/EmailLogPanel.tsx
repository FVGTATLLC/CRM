"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useAuth";
import { Mail, Plus, Send } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  sentDate?: string;
  status: string;
  sentBy?: { firstName: string; lastName: string };
  createdAt: string;
}

interface EmailLogPanelProps {
  relatedToType: string;
  relatedToId: string;
  relatedToName?: string;
  proposalId?: string;
  contractId?: string;
}

export default function EmailLogPanel({ relatedToType, relatedToId, relatedToName, proposalId, contractId }: EmailLogPanelProps) {
  const { fetchApi } = useApi();
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await fetchApi<{ success: boolean; data: EmailLogItem[] }>(`/api/email-logs?relatedToType=${relatedToType}&relatedToId=${relatedToId}`);
      if (data.success) setLogs(data.data);
    } catch (error) {
      console.error("Error fetching email logs:", error);
    }
  };

  useEffect(() => {
    if (relatedToId) fetchLogs();
  }, [relatedToId]);

  const handleLog = async () => {
    if (!recipient || !subject) return;
    setLoading(true);
    try {
      const data = await fetchApi<{ success: boolean; data: EmailLogItem }>("/api/email-logs", {
        method: "POST",
        body: JSON.stringify({
          relatedToType,
          relatedToId,
          relatedToName,
          recipient,
          subject,
          body,
          status: "Sent",
          proposalId,
          contractId,
        }),
      });
      if (data.success) {
        setLogs([data.data, ...logs]);
        setShowForm(false);
        setRecipient("");
        setSubject("");
        setBody("");
      }
    } catch (error) {
      console.error("Error logging email:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800",
    Sent: "bg-green-100 text-green-800",
    Failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase">Email Log</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <Plus size={14} /> Log Email
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <input type="email" placeholder="Recipient Email *" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <input type="text" placeholder="Subject *" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <textarea placeholder="Email Body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <div className="flex gap-2">
            <button onClick={handleLog} disabled={loading || !recipient || !subject} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Send size={12} /> {loading ? "Logging..." : "Log Email"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No emails logged</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-2 bg-white border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{log.subject}</p>
                  <p className="text-xs text-gray-400">To: {log.recipient} {log.sentDate && `on ${formatDateTime(log.sentDate)}`}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[log.status] || "bg-gray-100 text-gray-800"}`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
