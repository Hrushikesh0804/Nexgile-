import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingDown, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/client';

interface Props {
  productId: string;
  latestPcf: any;
  materials: any[];
}

export const ScenarioPanel: React.FC<Props> = ({ productId, latestPcf, materials }) => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioName, setScenarioName] = useState('Alternative Recycled Material Simulation');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [running, setRunning] = useState(false);

  const fetchScenarios = () => {
    apiClient.get(`/products/${productId}/scenarios`)
      .then((res: any) => setScenarios(res.data || []))
      .catch(() => setScenarios([]));
  };

  useEffect(() => {
    fetchScenarios();
  }, [productId]);

  const handleRunScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      await apiClient.post(`/products/${productId}/scenarios`, {
        product_id: productId,
        forked_from_pcf_id: latestPcf.id,
        scenario_name: scenarioName,
        alternative_material_id: selectedMaterialId || undefined
      });
      setRunning(false);
      fetchScenarios();
    } catch (err: any) {
      setRunning(false);
      alert(err.message || 'Error executing scenario simulation');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border-2 border-indigo-500/30 space-y-6 relative overflow-hidden bg-slate-900/60">
      {/* SCENARIO VISUAL BADGE */}
      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> Isolated What-If Scenario Environment
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Speculative Simulation
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mt-1">Run Alternative Material & Circularity Scenario</h2>
        <p className="text-slate-400 text-xs">
          Simulate carbon reductions from eco-design and recycled material substitution. Guaranteed zero-mutation of actual PCF historical data.
        </p>
      </div>

      {/* FORM & TRIGGER */}
      <form onSubmit={handleRunScenario} className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Name</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alternative Material</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-100"
            >
              <option value="">100% Recycled Eco-Aluminum (Default -55% CO2e)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.recycled_content_pct}% Recycled)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Forked from PCF Actual Version {latestPcf.version} ({latestPcf.total_co2e_kg} kgCO2e)</span>
          </div>

          <button
            type="submit"
            disabled={running}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running Simulation...' : 'Simulate Scenario Impact'}
          </button>
        </div>
      </form>

      {/* COMPLETED SCENARIOS LIST */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Scenario Runs ({scenarios.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc) => (
              <div key={sc.id} className="glass-card p-4 rounded-xl border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-xs">{sc.scenario_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> -{sc.reduction_pct}% CO2e
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Scenario PCF: </span>
                    <strong className="text-emerald-400 font-bold">{sc.total_co2e_kg.toFixed(2)} kgCO2e</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Carbon Savings: </span>
                    <strong className="text-indigo-300">{sc.reduction_co2e_kg.toFixed(2)} kgCO2e</strong>
                  </div>
                </div>

                {sc.assumptions_json && (
                  <p className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    Table: <span className="text-indigo-400">{sc.assumptions_json.isolated_scenario_table}</span> | Base: {sc.assumptions_json.forked_from_pcf_co2e} kgCO2e
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
