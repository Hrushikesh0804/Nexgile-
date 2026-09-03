import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, CheckCircle2, FileSearch, RefreshCw, Lock } from 'lucide-react';
import apiClient from '../../core/api/client';

export const EvidenceAuditBrowserPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('VERIFIED');

  const fetchRecords = () => {
    setLoading(true);
    apiClient.get('/hardening/evidence/lineage')
      .then((res: any) => {
        setRecords(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleVerifySubmit = async () => {
    if (!showVerifyModal) return;
    try {
      await apiClient.post('/hardening/evidence/verify', {
        lineage_id: showVerifyModal.lineage_id,
        verification_status: status,
        verification_notes: notes || 'Audited line item calculations.'
      });
      alert('Auditor verification stamp successfully recorded!');
      setShowVerifyModal(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Immutable Audit Trail & Lineage Verification
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Evidence & Audit Lineage Browser</h1>
          <p className="text-slate-400 text-sm">Platform-wide LineageRecord inspector with auditor verification stamps</p>
        </div>

        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Lineage Trail
        </button>
      </div>

      {/* LINEAGE TRAIL LIST */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" /> Platform Calculation & Ingestion Lineage Records ({records.length})
        </h2>

        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{r.target_entity_type}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-300 font-mono">
                    ID: {r.target_entity_id.substring(0, 8)}...
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    r.verification_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    r.verification_status === 'FLAGGED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {r.verification_status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Source: <strong className="text-slate-200">{r.source}</strong> | Formula: <span className="text-teal-400">{r.formula}</span>
                </p>
                {r.verification_notes && (
                  <p className="text-[11px] text-emerald-400 italic mt-1 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    Auditor Stamp: "{r.verification_notes}"
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowVerifyModal(r)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Auditor Verification
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AUDITOR VERIFY MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verify Lineage Record #{showVerifyModal.lineage_id.substring(0, 8)}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Verification Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="VERIFIED">VERIFIED (Auditor Approved)</option>
                  <option value="FLAGGED">FLAGGED (Requires Clarification)</option>
                  <option value="REJECTED">REJECTED (Non-Compliant)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Auditor Verification Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified against DEFRA 2024 emission factor calculation methodology..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowVerifyModal(null)} className="px-4 py-2 text-slate-400 text-xs">
                Cancel
              </button>
              <button onClick={handleVerifySubmit} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">
                Submit Auditor Stamp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
