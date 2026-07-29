'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { DocumentRecord } from '@/types';
import { 
  Paperclip, 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  Search, 
  FileText, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    fileName: '',
    fileUrl: '',
    category: 'Leave Attachment' as any,
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.fileUrl) {
      toast.error('Title and file URL are required');
      return;
    }

    try {
      setUploading(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileName: formData.fileName || 'uploaded_document.pdf',
          fileSize: 1024 * 45, // Sample 45KB
          uploadedBy: user?.email || 'admin@philfida.da.gov.ph',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Document uploaded successfully!');
        setIsUploadOpen(false);
        setFormData({ title: '', fileName: '', fileUrl: '', category: 'Leave Attachment' });
        fetchDocuments();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to soft-delete document: "${title}"?`)) return;

    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Document soft-deleted');
        fetchDocuments();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Error deleting document');
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <Paperclip className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Agency Document Management Repository
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Centralized repository for PhilFIDA Region VII leave attachments, CTO supporting files, and generated report records
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDocuments}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#1E407C] rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search document title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-white"
        >
          <option value="all">All Document Categories</option>
          <option value="Leave Attachment">Leave Attachments</option>
          <option value="CTO Document">CTO Supporting Files</option>
          <option value="Report">Generated Reports</option>
          <option value="Employee File">Employee Files</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading documents...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No documents found</td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {doc.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{doc.fileName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{doc.uploadedBy}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:underline inline-block"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                        title="Soft Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0F2C59] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Upload New Document Record</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical Certificate — Juan Dela Cruz"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Leave Attachment">Leave Attachment</option>
                  <option value="CTO Document">CTO Document</option>
                  <option value="Report">Report</option>
                  <option value="Employee File">Employee File</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">File URL or Data Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or data:application/pdf;base64,..."
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-[#0F2C59]"
                >
                  Upload File Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#0F2C59] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Preview: {previewDoc.title}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <p><strong>Category:</strong> {previewDoc.category}</p>
                <p><strong>Filename:</strong> {previewDoc.fileName}</p>
                <p><strong>Uploaded By:</strong> {previewDoc.uploadedBy}</p>
                <p><strong>Uploaded Date:</strong> {new Date(previewDoc.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-[#0F2C59] flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Open Full File</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
