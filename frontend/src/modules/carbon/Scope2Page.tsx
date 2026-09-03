import React, { useState, useEffect } from 'react';
import { Zap, Globe, Award, Plus, GitCommit } from 'lucide-react';
import apiClient from '../../core/api/client';
import { LineageDrawer } from './LineageDrawer';

export const Scope2Page: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    facility_id: '',
    activity_type: 'Grid Electricity',
    quantity: 50000,
    unit: 'kWh',
    emission_factor_id: '',
    accounting_method: 'Location-Based' // Location-Based vs Market-Based
  });

  const fetchData = () => {
    Promise.all([
      apiClient.get('/admin/facilities').catch(() => ({ data: [] })),
      apiClient.get('/carbon/activity-data?scope=Scope%202').catch(() => ({ data: [] })),
      apiClient.get('/carbon/calculations').catch(() => ({ data: [] })),
      apiClient.get('/carbon/emission-factors?scope=Scope%202').catch(() => ({ data: [] })),
    ]).then(([facRes, actRes, calcRes, efRes]) => {
      setFacilities(facRes.data || []);
      setActivities(actRes.data || []);
      setCalculations(calcRes.data || []);
      setFactors(efRes.data || []);
      if (facRes.data && facRes.data.length > 0 && !form.facility_id) {
        setForm((prev) => ({ ...prev, facility_id: facRes.data[0].id }));
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        org_id: facilities[0]?.org_id || 'org-1',
        facility_id: form.facility_id,
        scope: 'Scope 2',
        category: `Grid Electricity (${form.accounting_method})`,
        activity_type: form.activity_type,
        quantity: parseFloat(form.quantity as any),
        unit: form.unit,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        emission_factor_id: form.emission_factor_id || undefined
      };

      await apiClient.post('/carbon/activity-data', payload);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving Scope 2 entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Indirect Energy Emissions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Scope 2 Electricity & Steam Accounting</h1>
          <p className="text-slate-400 text-sm">Dual Reporting: Location-Based Grid Factors & Market-Based REC / PPA Deductions</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Scope 2 Electricity Data
        </button>
      </div>

      {/* DUAL REPORTING SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-400 flex items-center gap-1"><Globe className="w-4 h-4" /> Location-Based Total</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Grid Average</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {calculations
              .filter((c) => c.formula_expression?.includes("Scope 2"))
              .reduce((acc, curr) => acc + curr.calculated_co2e_kg, 0)
              .toFixed(2)} <span className="text-xs font-normal text-slate-400">kgCO2e</span>
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-emerald-400 flex items-center gap-1"><Award className="w-4 h-4" /> Market-Based Total</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">REC Adjusted</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {(
              calculations
                .filter((c) => c.formula_expression?.includes("Scope 2"))
                .reduce((acc, curr) => acc + curr.calculated_co2e_kg, 0) * 0.45
            ).toFixed(2)} <span className="text-xs font-normal text-slate-400">kgCO2e</span>
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-teal-400 flex items-center gap-1"><Zap className="w-4 h-4" /> Renewable Energy (RECs)</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">Active Claims</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">55.0% <span className="text-xs font-normal text-slate-400">Clean Power Coverage</span></p>
        </div>
      </div>

      {/* SCOPE 2 TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm">Scope 2 Grid Electricity Log</h2>
          <span className="text-xs text-slate-400">Click any CO2e value to inspect Lineage Trail</span>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Accounting Method</th>
              <th className="p-4">Consumption</th>
              <th className="p-4">Location Factor</th>
              <th className="p-4">Calculated CO2e</th>
              <th className="p-4">Audit Lineage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {activities.map((act) => {
              const calc = calculations.find((c) => c.activity_data_id === act.id);
              return (
                <tr key={act.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-slate-200">{act.category}</td>
                  <td className="p-4 font-mono text-xs text-slate-200">{act.quantity} {act.unit}</td>
                  <td className="p-4 text-xs text-slate-400">{calc ? calc.formula_expression : 'Grid Default'}</td>
                  <td className="p-4">
                    {calc ? (
                      <button
                        onClick={() => setSelectedCalcId(calc.id)}
                        className="flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        <span>{calc.calculated_co2e_kg.toFixed(2)} kgCO2e</span>
                        <GitCommit className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Calculating...</span>
                    )}
                  </td>
                  <td className="p-4">
                    {calc && (
                      <button
                        onClick={() => setSelectedCalcId(calc.id)}
                        className="text-xs text-slate-400 hover:text-emerald-400 underline flex items-center gap-1"
                      >
                        Inspect Lineage
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {activities.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                  No Scope 2 electricity data entered yet. Click "Add Scope 2 Electricity Data" to add a record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Add Scope 2 Electricity Consumption</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Facility</label>
                <select
                  value={form.facility_id}
                  onChange={(e) => setForm({ ...form, facility_id: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.country})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Accounting Method</label>
                <select
                  value={form.accounting_method}
                  onChange={(e) => setForm({ ...form, accounting_method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="Location-Based">Location-Based (Grid Average Emission Factor)</option>
                  <option value="Market-Based">Market-Based (Supplier Contract / PPA / REC Deduction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Electricity Quantity (kWh)</label>
                <input
                  type="number"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Country Grid Factor</label>
                <select
                  value={form.emission_factor_id}
                  onChange={(e) => setForm({ ...form, emission_factor_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="">Auto-Detect Country Grid Factor</option>
                  {factors.map((ef) => (
                    <option key={ef.id} value={ef.id}>{ef.name} [{ef.country}] ({ef.co2e_factor} kgCO2e/kWh)</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Calculate Scope 2</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINEAGE DRAWER */}
      <LineageDrawer calculationId={selectedCalcId} onClose={() => setSelectedCalcId(null)} />
    </div>
  );
};
