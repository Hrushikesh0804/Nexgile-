import React, { useState, useEffect } from 'react';
import { GitCommit, Search, RefreshCw, FileSearch, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';
import { LineageDrawer } from './LineageDrawer';

export const CalculationsPage: React.FC = () => {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCalculations = () => {
    apiClient.get('/carbon/calculations')
      .then((res: any) => setCalculations(res.data || []))
      .catch(() => setCalculations([]));
  };

  useEffect(() => {
    fetchCalculations();
  }, []);

  const filteredCalculations = calculations.filter((c) => {
    if (!statusFilter) return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Audit Lineage Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Calculations Governance & Lineage Log</h1>
          <p className="text-slate-400 text-sm">Versioned calculation history with full audit lineage tracing back to raw activity data</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">APPROVED (Active Actuals)</option>
            <option value="SUPERSEDED">SUPERSEDED (Historical Versions)</option>
          </select>
        </div>
      </div>

      {/* CALCULATIONS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Calculation ID / Version</th>
              <th className="p-4">Formula & Parameters</th>
              <th className="p-4">CO2e Output</th>
              <th className="p-4">Status</th>
              <th className="p-4">Audit Lineage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredCalculations.map((calc) => (
              <tr key={calc.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-200">{calc.id.substring(0, 8)}...</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      v{calc.version}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(calc.created_at).toLocaleString()}</p>
                </td>
                <td className="p-4 text-xs font-mono text-slate-300 max-w-md truncate">
                  {calc.formula_expression}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedCalcId(calc.id)}
                    className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    <span>{calc.calculated_co2e_kg.toFixed(2)} kgCO2e</span>
                    <GitCommit className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      calc.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {calc.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelectedCalcId(calc.id)}
                    className="text-xs text-slate-400 hover:text-emerald-400 underline flex items-center gap-1"
                  >
                    <FileSearch className="w-3.5 h-3.5" /> Inspect Lineage
                  </button>
                </td>
              </tr>
            ))}
            {filteredCalculations.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                  No calculation records found. Add Scope 1, Scope 2, or Scope 3 activity entries to generate versioned calculations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LINEAGE DRAWER */}
      <LineageDrawer calculationId={selectedCalcId} onClose={() => setSelectedCalcId(null)} />
    </div>
  );
};
