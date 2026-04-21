"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApi, useAuthStore } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverId?: string;
  approver?: { firstName: string; lastName: string };
  status: string;
  remarks?: string;
  actionAt?: string;
}

interface ApprovalRequest {
  id: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName?: string;
  requestType: string;
  status: string;
  currentStep: number;
  remarks?: string;
  requestedBy?: { firstName: string; lastName: string };
  steps: ApprovalStep[];
  createdAt: string;
}

export default function ApprovalsPage() {
  const { fetchApi } = useApi();
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [pendingForMe, setPendingForMe] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        fetchApi<{ data: ApprovalRequest[] }>("/api/approvals"),
        fetchApi<{ data: ApprovalRequest[] }>("/api/approvals?pendingForMe=true"),
      ]);
      setApprovals(allRes.data || []);
      setPendingForMe(pendingRes.data || []);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async (approvalId: string, stepId: string, action: "approve" | "reject") => {
    const remarks = action === "reject" ? prompt("Reason for rejection:") : "";
    if (action === "reject" && remarks === null) return;

    setProcessing(approvalId);
    try {
      await fetchApi(`/api/approvals/${approvalId}`, {
        method: "PUT",
        body: JSON.stringify({ action, stepId, remarks }),
      });
      await fetchApprovals();
    } catch (error) {
      console.error("Error processing approval:", error);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Waiting: "bg-gray-100 text-gray-600",
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || colors.Waiting}`}>{status}</span>;
  };

  const displayList = activeTab === "pending" ? pendingForMe : approvals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            My Pending ({pendingForMe.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            All Requests ({approvals.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">{activeTab === "pending" ? "No pending approvals" : "No approval requests found"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((approval) => {
            const myStep = approval.steps.find((s) => s.approverId === user?.id && s.status === "Pending");
            return (
              <div key={approval.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-800">{approval.requestType}</h3>
                      {statusBadge(approval.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {approval.relatedToType}: {approval.relatedToName || approval.relatedToId}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested by {approval.requestedBy?.firstName} {approval.requestedBy?.lastName} on {formatDateTime(approval.createdAt)}
                    </p>
                    {approval.remarks && <p className="text-xs text-gray-500 mt-1 italic">{approval.remarks}</p>}
                  </div>

                  {myStep && approval.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(approval.id, myStep.id, "approve")}
                        disabled={processing === approval.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(approval.id, myStep.id, "reject")}
                        disabled={processing === approval.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Steps Timeline */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                  {approval.steps.map((step, i) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center gap-1.5">
                        {step.status === "Approved" ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : step.status === "Rejected" ? (
                          <XCircle size={16} className="text-red-500" />
                        ) : step.status === "Pending" ? (
                          <Clock size={16} className="text-yellow-500" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300" />
                        )}
                        <span className="text-xs text-gray-600">
                          {step.approver ? `${step.approver.firstName} ${step.approver.lastName}` : `Step ${step.stepNumber}`}
                        </span>
                      </div>
                      {i < approval.steps.length - 1 && <div className="w-8 h-px bg-gray-300" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
