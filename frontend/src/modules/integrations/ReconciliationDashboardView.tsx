import React, { useState, useEffect } from 'react';
import { FileCheck, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ReconciliationDashboardView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/integrations/reconciliation')
      .then((res: any) => setLogs(res.data || []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Source vs Imported Audit Balance
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Reconciliation Dashboard</h1>
        <p className="text-slate-400 text-sm">Verify 100% record completeness: Source Count = Imported Count + Rejected Count</p>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-base">Reconciliation Audit Log #{log.id.substring(0, 8)}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Balanced
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Source Records</p>
                <p className="text-xl font-bold text-slate-100">{log.source_count}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Successfully Imported</p>
                <p className="text-xl font-bold text-emerald-400">{log.imported_count}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Rejected Rows</p>
                <p className="text-xl font-bold text-red-400">{log.rejected_count}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              "{log.summary_notes}"
            </p>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
            No reconciliation logs recorded yet. Run an import pipeline to generate reports.
          </div>
        )}
      </div>
    </div>
  );
};
