import React, { useState } from 'react';
import { RefreshCw, Sparkles, Sliders } from 'lucide-react';
import apiClient from '../../core/api/client';

export const SensitivityView: React.FC = () => {
  const [mcRun, setMcRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunMonteCarlo = async () => {
    setRunning(true);
    try {
      const res: any = await apiClient.post('/ai-analytics/monte-carlo');
      setMcRun(res.data);
      setRunning(false);
    } catch (err: any) {
      setRunning(false);
      alert(err.message || 'Monte Carlo run failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Stochastic Risk Modeling
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Monte Carlo Simulation & Sensitivity Tornado Analysis</h1>
          <p className="text-slate-400 text-sm">Evaluating parameter uncertainty (emission factor variance vs activity volatility)</p>
        </div>

        <button
          onClick={handleRunMonteCarlo}
          disabled={running}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Executing 1,000 Iterations...' : 'Run 1,000 Stochastic Iterations'}
        </button>
      </div>

      {/* MONTE CARLO DISTRIBUTION METRICS */}
      {mcRun && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase">P5 Optimistic Bound (5th %tile)</p>
            <p className="text-3xl font-bold text-teal-400 font-mono">
              {(mcRun.p5_co2e_kg / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">tCO2e</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-1 bg-purple-500/10">
            <p className="text-xs text-purple-400 font-semibold uppercase">P50 Expected Mean (1,000 Runs)</p>
            <p className="text-3xl font-bold text-purple-300 font-mono">
              {(mcRun.mean_co2e_kg / 1000).toFixed(1)} <span className="text-xs text-purple-400 font-normal">tCO2e</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase">P95 High-Risk Bound (95th %tile)</p>
            <p className="text-3xl font-bold text-amber-400 font-mono">
              {(mcRun.p95_co2e_kg / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">tCO2e</span>
            </p>
          </div>
        </div>
      )}

      {/* SENSITIVITY TORNADO CHART */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" /> Sensitivity Tornado Ranking (Which Drivers Matter Most)
        </h2>

        <div className="space-y-4 pt-2">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">1. Grid Electricity Emission Factor Variance</span>
              <span className="font-mono text-purple-400 font-bold">48% Variance Contribution (±15% Range)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full w-[48%]" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">2. Facility Meter Reading Activity Volatility</span>
              <span className="font-mono text-purple-400 font-bold">32% Variance Contribution (±20% Range)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[32%]" />
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">3. Scope 3 Supplier Spend Multilateral Multiplier Variance</span>
              <span className="font-mono text-purple-400 font-bold">20% Variance Contribution (±25% Range)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full w-[20%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
