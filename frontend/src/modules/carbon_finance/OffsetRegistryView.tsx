import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Upload, ExternalLink, ShieldCheck, Plus } from 'lucide-react';
import apiClient from '../../core/api/client';

export const OffsetRegistryView: React.FC = () => {
  const [offsets, setOffsets] = useState<any[]>([]);
  const [retireModalId, setRetireModalId] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('https://registry.verra.org/credit-res/VCS-1184-2025-001');

  const fetchOffsets = () => {
    apiClient.get('/carbon-finance/offsets')
      .then((res: any) => setOffsets(res.data || []))
      .catch(() => setOffsets([]));
  };

  useEffect(() => {
    fetchOffsets();
  }, []);

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireModalId) return;
    try {
      await apiClient.post(`/carbon-finance/offsets/${retireModalId}/retire`, {
        retirement_evidence_url: evidenceUrl
      });
      setRetireModalId(null);
      fetchOffsets();
    } catch (err: any) {
      alert(err.message || 'Retirement failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Verified Carbon Offsets Registry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Carbon Offsets Registry & Retirement Evidence</h1>
          <p className="text-slate-400 text-sm">Verra, Gold Standard, and ACR offset certificate registry with proof of retirement</p>
        </div>
      </div>

      {/* OFFSETS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-400" /> Carbon Offset Holdings ({offsets.length})
        </h2>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Project Name</th>
              <th className="p-4">Registry</th>
              <th className="p-4">Serial Number</th>
              <th className="p-4">Quantity (tCO2e)</th>
              <th className="p-4">Cost ($/t)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Retirement Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {offsets.map((off) => (
              <tr key={off.id} className="hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-100">{off.project_name}</td>
                <td className="p-4 text-xs text-teal-300 font-semibold">{off.registry}</td>
                <td className="p-4 font-mono text-xs text-slate-400">{off.serial_number}</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">{off.quantity_tco2e} tCO2e</td>
                <td className="p-4 font-mono text-slate-200">${off.cost_per_tco2e_usd}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    off.status === 'RETIRED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {off.status}
                  </span>
                </td>
                <td className="p-4">
                  {off.status === 'RETIRED' ? (
                    <a href={off.retirement_evidence_url} target="_blank" rel="noreferrer" className="text-xs text-teal-400 underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> View Proof
                    </a>
                  ) : (
                    <button
                      onClick={() => setRetireModalId(off.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow"
                    >
                      Retire Credit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RETIRE CREDIT MODAL */}
      {retireModalId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Upload Retirement Evidence</h3>
            <form onSubmit={handleRetire} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Registry Retirement Certificate URL</label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setRetireModalId(null)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-semibold">Confirm Retirement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
