"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useAuth";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface DocumentItem {
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

interface DocumentUploadProps {
  relatedToType: string;
  relatedToId: string;
  relatedToName?: string;
  proposalId?: string;
  contractId?: string;
  accountId?: string;
}

export default function DocumentUpload({ relatedToType, relatedToId, relatedToName, proposalId, contractId, accountId }: DocumentUploadProps) {
  const { fetchApi } = useApi();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await fetchApi<{ success: boolean; data: DocumentItem[] }>(`/api/documents?relatedToType=${relatedToType}&relatedToId=${relatedToId}`);
      if (data.success) setDocuments(data.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    if (relatedToId) fetchDocuments();
  }, [relatedToId]);

  const handleUpload = async () => {
    if (!fileName || !fileUrl) return;
    setLoading(true);
    try {
      const data = await fetchApi<{ success: boolean; data: DocumentItem }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          relatedToType,
          relatedToId,
          relatedToName,
          fileName,
          fileUrl,
          remarks,
          version: documents.length + 1,
          proposalId,
          contractId,
          accountId,
        }),
      });
      if (data.success) {
        setDocuments([data.data, ...documents]);
        setShowUploadForm(false);
        setFileName("");
        setFileUrl("");
        setRemarks("");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await fetchApi(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <div className="border rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase">Documents</h4>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <Upload size={14} /> Add Document
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <input type="text" placeholder="File Name *" value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <input type="text" placeholder="File URL *" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <input type="text" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-lg" />
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={loading || !fileName || !fileUrl} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button onClick={() => setShowUploadForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-white border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">
                    v{doc.version} {doc.uploadedBy && `by ${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`} {doc.createdAt && `on ${formatDateTime(doc.createdAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-500 hover:text-blue-700">
                  <Download size={14} />
                </a>
                <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
