import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert, ArrowRight, Calculator } from 'lucide-react';
import apiClient from '../../core/api/client';

export const DocumentOCRView: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [fileName, setFileName] = useState('Utility_Invoice_Reliant_Energy_Jan2025.pdf');
  const [rawText, setRawText] = useState('Reliant Texas Energy Natural Gas Stationary Combustion Invoice #INV-2025-88492 12500 kWh');
  
  const [uploading, setUploading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedCalc, setApprovedCalc] = useState<any | null>(null);

  const fetchDocuments = () => {
    apiClient.get('/ai-analytics/documents')
      .then((res: any) => setDocuments(res.data || []))
      .catch(() => setDocuments([]));
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadOCR = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file_name', fileName);
      formData.append('raw_text', rawText);

      await apiClient.post('/ai-analytics/documents/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploading(false);
      fetchDocuments();
    } catch (err: any) {
      setUploading(false);
      alert(err.message || 'OCR processing failed');
    }
  };

  const handleApproveDraft = async (docId: string) => {
    setApprovingId(docId);
    try {
      const res: any = await apiClient.post(`/ai-analytics/documents/${docId}/approve`);
      setApprovingId(null);
      setApprovedCalc(res.data);
      fetchDocuments();
    } catch (err: any) {
      setApprovingId(null);
      alert(err.message || 'Approval failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Document Intelligence & OCR Ingestion
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Utility Invoice OCR & Human Approval Pipeline</h1>
        <p className="text-slate-400 text-sm">Automated document parsing with candidate extraction review prior to actuals approval</p>
      </div>

      {approvedCalc && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Draft invoice approved into actuals! Calculated <strong className="text-emerald-400 font-bold">{approvedCalc.calculated_co2e_kg} kgCO2e</strong> with Lineage ID: <span className="font-mono">{approvedCalc.lineage_id}</span></span>
          </div>
          <button onClick={() => setApprovedCalc(null)} className="text-xs underline text-slate-400">Dismiss</button>
        </div>
      )}

      {/* UPLOAD & OCR INGESTION FORM */}
      <form onSubmit={handleUploadOCR} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" /> Upload Utility Invoice / Energy Meter Document
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sample Document Text / OCR Bounding Stream</label>
            <input
              type="text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {uploading ? 'Parsing OCR Candidate Fields...' : 'Process Document & Extract Candidate Fields'}
          </button>
        </div>
      </form>

      {/* INGESTED DOCUMENTS DRAFT QUEUE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" /> Ingested Invoices Queue ({documents.length})
        </h2>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-100 text-sm">{doc.file_name}</span>
                  <span className={`ml-3 px-2 py-0.5 rounded text-[10px] font-bold ${
                    doc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date(doc.created_at).toLocaleString()}</span>
              </div>

              {/* CANDIDATE EXTRACTIONS JSON */}
              {doc.extracted_fields_json && (
                <div className="p-3 bg-slate-950 rounded-lg text-xs space-y-1 font-mono text-slate-300 border border-slate-800">
                  <p className="text-[10px] text-teal-400 font-semibold uppercase">Extracted Candidate Fields:</p>
                  <p>• Vendor: <span className="text-slate-100">{doc.extracted_fields_json.vendor_name}</span></p>
                  <p>• Fuel / Activity: <span className="text-slate-100">{doc.extracted_fields_json.fuel_type} ({doc.extracted_fields_json.quantity} {doc.extracted_fields_json.unit})</span></p>
                  <p>• OCR Confidence Score: <span className="text-emerald-400 font-bold">{doc.extracted_fields_json.confidence_pct}%</span></p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[10px] text-amber-400">⚠️ Candidate draft requires human sign-off before committing into actual emissions log.</span>
                {doc.status !== 'APPROVED' ? (
                  <button
                    onClick={() => handleApproveDraft(doc.id)}
                    disabled={approvingId === doc.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {approvingId === doc.id ? 'Approving & Calculating...' : 'Approve into Actual Emissions'}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved Actual
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
