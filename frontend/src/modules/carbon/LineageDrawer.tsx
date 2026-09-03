import React, { useEffect, useState } from 'react';
import { X, GitCommit, ShieldCheck, Database, Calendar, User, Cpu, AlertTriangle, FileText } from 'lucide-react';
import apiClient from '../../core/api/client';

interface Props {
  calculationId: string | null;
  onClose: () => void;
}

export const LineageDrawer: React.FC<Props> = ({ calculationId, onClose }) => {
  const [lineage, setLineage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!calculationId) return;
    setLoading(true);
    setError(null);
    
    apiClient.get(`/carbon/calculations/${calculationId}/lineage`)
      .then((res: any) => {
        setLineage(res.data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to fetch lineage trail');
        setLoading(false);
      });
  }, [calculationId]);

  if (!calculationId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50 transition-opacity">
      <div className="w-full max-w-xl glass-panel h-full border-l border-slate-800 p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg">Audit Data Lineage Trail</h2>
              <p className="text-xs text-slate-400">Calculation ID: <span className="font-mono text-emerald-400">{calculationId}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Loading lineage trail...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* LINEAGE NODES */}
        {!loading && lineage && (
          <div className="space-y-6 flex-1">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Immutable calculation lineage record — fully reproducible audit log.</span>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
              {/* NODE 1: DATA SOURCE */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-slate-900" />
                <div className="glass-card p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1"><Database className="w-3.5 h-3.5" /> 1. Raw Activity Source</span>
                    <span>Version: {lineage.data_version}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{lineage.source}</p>
                </div>
              </div>

              {/* NODE 2: METHODOLOGY & SCOPE */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-teal-400 ring-4 ring-slate-900" />
                <div className="glass-card p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-teal-400 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> 2. Standard Methodology</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{lineage.methodology}</p>
                </div>
              </div>

              {/* NODE 3: EMISSION FACTOR */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-indigo-400 ring-4 ring-slate-900" />
                <div className="glass-card p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-indigo-400 flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> 3. Emission Factor Version</span>
                  </div>
                  <p className="text-sm font-mono text-slate-200">{lineage.factor_version}</p>
                </div>
              </div>

              {/* NODE 4: FORMULA & CALCULATION */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-slate-900" />
                <div className="glass-card p-4 rounded-xl space-y-2">
                  <span className="font-semibold text-amber-400 text-xs flex items-center gap-1">4. Formula & Execution Parameters</span>
                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-xs text-slate-300 break-all border border-slate-800">
                    {lineage.formula}
                  </div>
                  {lineage.calculation_params && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                      <div>Quantity: <strong className="text-slate-200">{lineage.calculation_params.quantity} {lineage.calculation_params.input_unit}</strong></div>
                      <div>Factor Value: <strong className="text-slate-200">{lineage.calculation_params.factor_value}</strong></div>
                      <div>Unit Conversion: <strong className="text-slate-200">{lineage.calculation_params.conversion_ratio}</strong></div>
                      <div>Allocation: <strong className="text-slate-200">{lineage.calculation_params.allocation_pct}%</strong></div>
                    </div>
                  )}
                </div>
              </div>

              {/* NODE 5: RESULT & AUDIT TIMESTAMP */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                <div className="glass-card p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Verified CO2e Output</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(lineage.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {lineage.calculation_params?.co2e_result_kg ? `${lineage.calculation_params.co2e_result_kg.toFixed(2)} kgCO2e` : 'Calculated Output Verified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold">
            Close Lineage Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
