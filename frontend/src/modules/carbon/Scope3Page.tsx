import React, { useState, useEffect } from 'react';
import { Layers, Plus, DollarSign, Activity, Users, GitCommit } from 'lucide-react';
import apiClient from '../../core/api/client';
import { LineageDrawer } from './LineageDrawer';

const SCOPE3_CATEGORIES = [
  "Category 1: Purchased Goods & Services",
  "Category 2: Capital Goods",
  "Category 3: Fuel & Energy Related Activities",
  "Category 4: Upstream Transportation & Distribution",
  "Category 5: Waste Generated in Operations",
  "Category 6: Business Travel",
  "Category 7: Employee Commuting",
  "Category 8: Upstream Leased Assets",
  "Category 9: Downstream Transportation & Distribution",
  "Category 10: Processing of Sold Products",
  "Category 11: Use of Sold Products",
  "Category 12: End-of-Life Treatment of Sold Products",
  "Category 13: Downstream Leased Assets",
  "Category 14: Franchises",
  "Category 15: Investments"
];

export const Scope3Page: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    facility_id: '',
    category: SCOPE3_CATEGORIES[0],
    calculation_method: 'SPEND_BASED', // SPEND_BASED vs ACTIVITY_BASED vs SUPPLIER_PRIMARY
    activity_type: 'Purchased Raw Materials',
    quantity: 10000,
    unit: 'USD',
    emission_factor_id: ''
  });

  const fetchData = () => {
    Promise.all([
      apiClient.get('/admin/facilities').catch(() => ({ data: [] })),
      apiClient.get('/carbon/activity-data?scope=Scope%203').catch(() => ({ data: [] })),
      apiClient.get('/carbon/calculations').catch(() => ({ data: [] })),
      apiClient.get('/carbon/emission-factors?scope=Scope%203').catch(() => ({ data: [] })),
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
        scope: 'Scope 3',
        category: form.category,
        activity_type: `${form.activity_type} (${form.calculation_method})`,
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
      alert(err.message || 'Error saving Scope 3 entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Value Chain Emissions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Scope 3 Value Chain Accounting</h1>
          <p className="text-slate-400 text-sm">Full 15 GHG Protocol Categories: Spend-Based EEIO, Activity-Based, and Supplier Primary Data</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Scope 3 Activity
        </button>
      </div>

      {/* METHODOLOGY BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Method 1</p>
            <p className="text-sm font-bold text-slate-100">Spend-Based (EEIO Multipliers)</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Method 2</p>
            <p className="text-sm font-bold text-slate-100">Activity-Based (Mass / Distance)</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Method 3</p>
            <p className="text-sm font-bold text-slate-100">Supplier Primary Data</p>
          </div>
        </div>
      </div>

      {/* SCOPE 3 TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm">Scope 3 Activity & Value Chain Emissions Log</h2>
          <span className="text-xs text-slate-400">Click any CO2e value to view Lineage Trail</span>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Scope 3 Category</th>
              <th className="p-4">Activity / Description</th>
              <th className="p-4">Quantity / Spend</th>
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
                  <td className="p-4 text-xs text-slate-300">{act.activity_type}</td>
                  <td className="p-4 font-mono text-xs text-slate-200">{act.quantity} {act.unit}</td>
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
                  No Scope 3 activity data entered yet. Click "Add Scope 3 Activity" above to create an entry.
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
            <h3 className="text-lg font-bold text-slate-100">Add Scope 3 Activity Data</h3>
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
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Scope 3 Category (1–15)</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                >
                  {SCOPE3_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Calculation Method</label>
                <select
                  value={form.calculation_method}
                  onChange={(e) => {
                    const method = e.target.value;
                    const defaultUnit = method === 'SPEND_BASED' ? 'USD' : 'kg';
                    setForm({ ...form, calculation_method: method, unit: defaultUnit });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="SPEND_BASED">Spend-Based (EEIO Factors)</option>
                  <option value="ACTIVITY_BASED">Activity-Based (Mass / Distance / Energy)</option>
                  <option value="SUPPLIER_PRIMARY">Supplier Primary Data</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity / Spend</label>
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
                  <label className="block text-xs text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Calculate Scope 3</button>
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
