import React, { useState } from 'react';
import { Sparkles, TrendingDown, RefreshCw, ShieldAlert } from 'lucide-react';
import apiClient from '../../core/api/client';

export const WhatIfBuilderView: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('2028 Strategic Net-Zero Acceleration');
  const [renewablePct, setRenewablePct] = useState(50);
  const [supplierShiftPct, setSupplierShiftPct] = useState(30);
  const [materialSwapPct, setMaterialSwapPct] = useState(40);

  const [result, setResult] = useState<any | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunWhatIf = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res: any = await apiClient.post('/ai-analytics/what-if', {
        scenario_name: scenarioName,
        renewable_electricity_pct: renewablePct,
        supplier_switch_pct: supplierShiftPct,
        material_swap_recycled_pct: materialSwapPct
      });
      setResult(res.data);
      setRunning(false);
    } catch (err: any) {
      setRunning(false);
      alert(err.message || 'What-If scenario run failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Interactive What-If Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Strategic Decarbonization Lever Simulation</h1>
          <p className="text-slate-400 text-sm">Simulate grid energy switches, supplier substitutions, and eco-materials without mutating actual emissions</p>
        </div>
      </div>

      {/* PARAMETER SLIDERS FORM */}
      <form onSubmit={handleRunWhatIf} className="glass-panel p-6 rounded-2xl border-2 border-indigo-500/30 space-y-6 bg-slate-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Isolated What-If Scenario Mode
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Name</label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 max-w-md"
          />
        </div>

        {/* PARAMETER SLIDERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Renewable Electricity Share</span>
              <strong className="text-amber-400 font-mono text-sm">{renewablePct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={renewablePct}
              onChange={(e) => setRenewablePct(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Replaces Scope 2 fossil grid electricity with 0-emission PPA/RECs.</p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Supplier Shift to Eco-Vendors</span>
              <strong className="text-teal-400 font-mono text-sm">{supplierShiftPct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={supplierShiftPct}
              onChange={(e) => setSupplierShiftPct(parseInt(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Replaces high-carbon Tier 1 vendors with Leader-tier Scope 3 partners.</p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Material Swap to Recycled Alloys</span>
              <strong className="text-purple-400 font-mono text-sm">{materialSwapPct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={materialSwapPct}
              onChange={(e) => setMaterialSwapPct(parseInt(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Replaces virgin aluminum/steel in BOMs with 100% recycled circular alloys.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <ShieldAlert className="w-4 h-4" />
            <span>Guaranteed zero-mutation of historical actuals (`scenario_pcf` isolated storage)</span>
          </div>

          <button
            type="submit"
            disabled={running}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Simulating Levers...' : 'Run What-If Scenario Engine'}
          </button>
        </div>
      </form>

      {/* SIDE-BY-SIDE BASELINE VS SCENARIO COMPARISON */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                Simulation Output Comparison
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">{result.scenario_name}</h2>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold text-sm">
              <TrendingDown className="w-4 h-4" /> -{result.reduction_pct}% Overall Reduction
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold uppercase">Actual Baseline Footprint</p>
              <p className="text-3xl font-bold text-slate-200 font-mono">
                {(result.baseline_co2e_kg / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
              </p>
              <p className="text-[10px] text-slate-500">Historical Actuals (Unchanged)</p>
            </div>

            <div className="glass-card p-5 rounded-xl border border-emerald-500/30 space-y-1 bg-emerald-500/10">
              <p className="text-xs text-emerald-400 font-semibold uppercase">Projected Scenario Footprint</p>
              <p className="text-3xl font-bold text-emerald-300 font-mono">
                {(result.projected_scenario_co2e_kg / 1000).toFixed(1)} <span className="text-xs font-normal text-emerald-400">tCO2e</span>
              </p>
              <p className="text-[10px] text-emerald-400">Simulated Target Output</p>
            </div>

            <div className="glass-card p-5 rounded-xl border border-indigo-500/30 space-y-1 bg-indigo-500/10">
              <p className="text-xs text-indigo-400 font-semibold uppercase">Net Carbon Avoided</p>
              <p className="text-3xl font-bold text-indigo-300 font-mono">
                {(result.reduction_co2e_kg / 1000).toFixed(1)} <span className="text-xs font-normal text-indigo-400">tCO2e</span>
              </p>
              <p className="text-[10px] text-indigo-400">Calculated Savings Delta</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
