import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingDown, Target, Zap, ShieldCheck, Factory, Award, Building2 } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ExecutiveDashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboards/executive')
      .then((res: any) => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Executive Aggregation Layer
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Executive Carbon & Net-Zero Dashboard</h1>
          <p className="text-slate-400 text-sm">Aggregated emissions footprint, intensity metrics, and target trajectory monitoring</p>
        </div>
      </div>

      {metrics && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/30 space-y-1 bg-slate-900/60">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Carbon Footprint</p>
              <p className="text-3xl font-bold text-emerald-400 font-mono">
                {metrics.total_emissions_co2e_t} <span className="text-xs text-slate-400 font-normal">tCO2e</span>
              </p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Audit-Ready Aggregation
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Emission Intensity</p>
              <p className="text-3xl font-bold text-teal-300 font-mono">{metrics.emission_intensity_per_sqft}</p>
              <p className="text-[10px] text-slate-400">kgCO2e / sqft facility area</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trajectory Status</p>
              <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> {metrics.trajectory_status}
              </p>
              <p className="text-[10px] text-slate-400">Target Horizon: {metrics.target_annual_co2e_t} tCO2e</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Industry Peer Benchmark</p>
              <p className="text-3xl font-bold text-amber-400 font-mono">{metrics.benchmark_comparison_pct}%</p>
              <p className="text-[10px] text-amber-400">Below Industry Average Intensity</p>
            </div>
          </div>

          {/* SCOPE 1, 2, 3 BREAKDOWN & CATEGORY CHART */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> GHG Scope Footprint Breakdown
              </h2>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">Scope 1 (Direct Operations)</span>
                    <strong className="text-emerald-400 font-mono">{metrics.scope1_emissions_t} tCO2e</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full w-[35%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">Scope 2 (Purchased Energy)</span>
                    <strong className="text-teal-400 font-mono">{metrics.scope2_emissions_t} tCO2e</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-teal-500 h-full rounded-full w-[40%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">Scope 3 (Value Chain / Suppliers)</span>
                    <strong className="text-purple-400 font-mono">{metrics.scope3_emissions_t} tCO2e</strong>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-purple-500 h-full rounded-full w-[25%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Factory className="w-4 h-4 text-indigo-400" /> Activity Category Breakdown
              </h2>

              <div className="space-y-3 pt-2">
                {Object.entries(metrics.category_breakdown || {}).map(([cat, val]: [string, any]) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="capitalize text-xs text-slate-300 font-semibold">{cat.replace('_', ' ')}</span>
                    <strong className="text-indigo-400 font-mono text-xs">{val} tCO2e</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
