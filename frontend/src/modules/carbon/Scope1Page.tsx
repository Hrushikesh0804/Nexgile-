import React, { useState, useEffect } from 'react';
import { Plus, Upload, Flame, Truck, Factory, ShieldAlert, GitCommit } from 'lucide-react';
import apiClient from '../../core/api/client';
import { LineageDrawer } from './LineageDrawer';

export const Scope1Page: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const [form, setForm] = useState({
    facility_id: '',
    category: 'Stationary Combustion',
    activity_type: 'Natural Gas',
    quantity: 1000,
    unit: 'kWh',
    emission_factor_id: ''
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const fetchData = () => {
    Promise.all([
      apiClient.get('/admin/facilities').catch(() => ({ data: [] })),
      apiClient.get('/carbon/activity-data?scope=Scope%201').catch(() => ({ data: [] })),
      apiClient.get('/carbon/calculations').catch(() => ({ data: [] })),
      apiClient.get('/carbon/emission-factors?scope=Scope%201').catch(() => ({ data: [] })),
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
        scope: 'Scope 1',
        category: form.category,
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
      alert(err.message || 'Error saving Scope 1 entry');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !form.facility_id) return;
    const formData = new FormData();
    formData.append('facility_id', form.facility_id);
    formData.append('file', csvFile);

    try {
      await apiClient.post('/carbon/activity-data/csv-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowCsvModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'CSV Import failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Direct Emissions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Scope 1 Carbon Accounting</h1>
          <p className="text-slate-400 text-sm">Stationary Combustion, Mobile Fuel, Process Emissions, and Fugitive Gases</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> CSV Bulk Upload
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Scope 1 Activity
          </button>
        </div>
      </div>

      {/* CATEGORY SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Stationary Fuel</p>
            <p className="text-lg font-bold text-slate-100">Boilers & Heaters</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Mobile Fleet</p>
            <p className="text-lg font-bold text-slate-100">Company Vehicles</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Industrial Process</p>
            <p className="text-lg font-bold text-slate-100">Chemical Synthesis</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Fugitive Leaks</p>
            <p className="text-lg font-bold text-slate-100">HVAC Refrigerants</p>
          </div>
        </div>
      </div>

      {/* ACTIVITY DATA & CALCULATED EMISSIONS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm">Scope 1 Activity Log & Lineage-Backed Calculations</h2>
          <span className="text-xs text-slate-400">Click any CO2e value to view Lineage Trail</span>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Category</th>
              <th className="p-4">Activity / Fuel</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Calculated CO2e</th>
              <th className="p-4">Status</th>
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
                        title="Click to view full calculation lineage trail"
                      >
                        <span>{calc.calculated_co2e_kg.toFixed(2)} kgCO2e</span>
                        <GitCommit className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Calculating...</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {act.status}
                    </span>
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
                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                  No Scope 1 activity data recorded yet. Click "Add Scope 1 Activity" above to create an entry.
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
            <h3 className="text-lg font-bold text-slate-100">Add Scope 1 Activity Data</h3>
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
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="Stationary Combustion">Stationary Combustion (Boilers, Generators)</option>
                  <option value="Mobile Combustion">Mobile Combustion (Company Vehicles, Fleet)</option>
                  <option value="Industrial Processes">Industrial Processes</option>
                  <option value="Fugitive Emissions">Fugitive Emissions (Refrigerant Leaks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Activity / Fuel Type</label>
                <input
                  type="text"
                  placeholder="e.g. Natural Gas, Diesel, R-410A"
                  value={form.activity_type}
                  onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
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
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  >
                    <option value="kWh">kWh</option>
                    <option value="liter">liter</option>
                    <option value="m3">m3</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Emission Factor Version</label>
                <select
                  value={form.emission_factor_id}
                  onChange={(e) => setForm({ ...form, emission_factor_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="">Auto-Select Active Factor from Library</option>
                  {factors.map((ef) => (
                    <option key={ef.id} value={ef.id}>{ef.name} ({ef.co2e_factor} kgCO2e/{ef.unit})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Calculate & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Bulk Import Scope 1 CSV</h3>
            <form onSubmit={handleCsvUpload} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Facility</label>
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
                <label className="block text-xs text-slate-400 mb-1">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCsvModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Import CSV</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINEAGE DRAWER INSPECTOR */}
      <LineageDrawer calculationId={selectedCalcId} onClose={() => setSelectedCalcId(null)} />
    </div>
  );
};
