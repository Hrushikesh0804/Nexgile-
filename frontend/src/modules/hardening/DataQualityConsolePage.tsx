import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react';
import apiClient from '../../core/api/client';

export const DataQualityConsolePage: React.FC = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const fetchFlags = () => {
    setLoading(true);
    apiClient.get('/hardening/quality/console')
      .then((res: any) => {
        setFlags(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleCreateRemediationTask = async (flagId: string) => {
    try {
      await apiClient.post(`/hardening/quality/remediate?flag_id=${flagId}`);
      alert('Remediation task created and routed via WorkflowService!');
      fetchFlags();
    } catch (err: any) {
      alert(err.message || 'Failed to create remediation task');
    }
  };

  const filteredFlags = selectedSeverity === 'ALL'
    ? flags
    : flags.filter(f => f.severity === selectedSeverity);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Platform-Wide Data Governance
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Data Quality & Governance Console</h1>
          <p className="text-slate-400 text-sm">Centralized surfacing of DataQualityService completeness scores, confidence ratings, and remediation tasks</p>
        </div>

        <button
          onClick={fetchFlags}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Quality Console
        </button>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Platform Quality Score</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">94.2%</p>
          <p className="text-xs text-slate-500 mt-0.5">High Confidence Rating</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Active Flags</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{flags.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Across Modules 1–7</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Completeness Index</p>
          <p className="text-2xl font-bold text-teal-400 mt-1">98.5%</p>
          <p className="text-xs text-slate-500 mt-0.5">Required fields mapped</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Open Remediation Tasks</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">3 Tasks</p>
          <p className="text-xs text-slate-500 mt-0.5">WorkflowService Active</p>
        </div>
      </div>

      {/* FLAGS LIST TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" /> Active Data Quality Flags ({filteredFlags.length})
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFlags.map((flag) => (
            <div key={flag.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{flag.target_entity_type} ({flag.target_entity_id.substring(0, 8)}...)</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    flag.severity === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {flag.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{flag.message}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Completeness: <strong className="text-teal-400">{Math.round(flag.completeness_score * 100)}%</strong></span>
                  <span>Confidence: <strong className="text-emerald-400">{Math.round(flag.confidence_score * 100)}%</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateRemediationTask(flag.id)}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Create Remediation Task
                </button>
              </div>
            </div>
          ))}

          {filteredFlags.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No data quality flags found for current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
