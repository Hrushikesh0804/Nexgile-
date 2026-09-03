import React, { useState, useEffect } from 'react';
import { Target, Plus, Coins, TrendingDown, CheckCircle2, Award } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ReductionPlanningView: React.FC = () => {
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [macc, setMacc] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Energy Efficiency',
    expected_reduction_co2e_kg: 150000.0,
    capex_cost_usd: 80000.0,
    opex_cost_usd: 4000.0,
    timeline_year: 2026
  });

  const fetchReductionData = () => {
    Promise.all([
      apiClient.get('/ai-analytics/initiatives').catch(() => ({ data: [] })),
      apiClient.get('/ai-analytics/macc').catch(() => ({ data: null })),
    ]).then(([initRes, maccRes]) => {
      setInitiatives(initRes.data || []);
      setMacc(maccRes.data || null);
    });
  };

  useEffect(() => {
    fetchReductionData();
  }, []);

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/ai-analytics/initiatives', form);
      setShowModal(false);
      setForm({ title: '', description: '', category: 'Energy Efficiency', expected_reduction_co2e_kg: 150000.0, capex_cost_usd: 80000.0, opex_cost_usd: 4000.0, timeline_year: 2026 });
      fetchReductionData();
    } catch (err: any) {
      alert(err.message || 'Failed to create initiative');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Decarbonization Capital Allocation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Reduction Planning & Marginal Abatement Cost Curve (MACC)</h1>
          <p className="text-slate-400 text-sm">Prioritizing decarbonization initiatives by abatement cost ($ / tCO2e avoided) and ROI</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Reduction Initiative
        </button>
      </div>

      {/* MACC WATERFALL CHART */}
      {macc && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" /> Marginal Abatement Cost Curve (MACC) Ranking
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Total Abatement Potential: <strong className="text-emerald-400 font-bold">{macc.total_potential_reduction_tco2e} tCO2e</strong></span>
              <span className="text-slate-400">Avg Cost: <strong className="text-slate-200 font-bold">${macc.average_abatement_cost_per_tco2e} / tCO2e</strong></span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {macc.initiatives?.map((item: any) => {
              const isNegative = item.abatement_cost_per_tco2e < 0;
              return (
                <div key={item.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-xs">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Avoided Emissions: <strong className="text-emerald-400 font-bold">{item.expected_reduction_tco2e} tCO2e</strong> | CapEx: ${item.capex_cost_usd?.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-bold font-mono px-3 py-1 rounded-lg border inline-block ${
                      isNegative ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {isNegative ? `Net Savings: $${item.abatement_cost_per_tco2e}/tCO2e` : `Cost: $${item.abatement_cost_per_tco2e}/tCO2e`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INITIATIVES KANBAN / LIST */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" /> Decarbonization Initiative Portfolio ({initiatives.length})
        </h2>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Initiative Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">CO2e Avoided</th>
              <th className="p-4">CapEx ($)</th>
              <th className="p-4">Abatement Cost</th>
              <th className="p-4">ROI (%)</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {initiatives.map((init) => (
              <tr key={init.id} className="hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-100">{init.title}</td>
                <td className="p-4 text-xs text-slate-300">{init.category}</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">{(init.expected_reduction_co2e_kg / 1000).toFixed(1)} tCO2e</td>
                <td className="p-4 font-mono text-slate-200">${init.capex_cost_usd?.toLocaleString()}</td>
                <td className="p-4 font-mono font-bold text-amber-400">${init.abatement_cost_per_tco2e}/t</td>
                <td className="p-4 font-bold text-teal-400">{init.roi_pct}%</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {init.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE INITIATIVE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Add Reduction Initiative</h3>
            <form onSubmit={handleCreateInitiative} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Initiative Title</label>
                <input
                  type="text"
                  placeholder="e.g. Heat Recovery Retrofit"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="Energy Efficiency">Energy Efficiency</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="Supplier Substitution">Supplier Substitution</option>
                  <option value="Material Circularity">Material Circularity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expected Reduction (kgCO2e)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.expected_reduction_co2e_kg}
                    onChange={(e) => setForm({ ...form, expected_reduction_co2e_kg: parseFloat(e.target.value) })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">CapEx Cost ($ USD)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.capex_cost_usd}
                    onChange={(e) => setForm({ ...form, capex_cost_usd: parseFloat(e.target.value) })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Initiative</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
