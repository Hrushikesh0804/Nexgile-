import React, { useState, useEffect } from 'react';
import { Database, Search, Edit3, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/client';

export const EmissionFactorsPage: React.FC = () => {
  const [factors, setFactors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    co2e_factor: 0,
    version_tag: '',
    source_library: ''
  });
  const [recalcNotice, setRecalcNotice] = useState<string | null>(null);

  const fetchFactors = () => {
    let url = '/carbon/emission-factors';
    const params = new URLSearchParams();
    if (selectedScope) params.append('scope', selectedScope);
    if (selectedCountry) params.append('country', selectedCountry);
    if (params.toString()) url += `?${params.toString()}`;

    apiClient.get(url)
      .then((res: any) => setFactors(res.data || []))
      .catch(() => setFactors([]));
  };

  useEffect(() => {
    fetchFactors();
  }, [selectedScope, selectedCountry]);

  const handleEditClick = (factor: any) => {
    setSelectedFactor(factor);
    setEditForm({
      name: factor.name,
      co2e_factor: factor.co2e_factor,
      version_tag: factor.version_tag,
      source_library: factor.source_library
    });
    setShowEditModal(true);
  };

  const handleUpdateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactor) return;

    try {
      await apiClient.put(`/carbon/emission-factors/${selectedFactor.id}`, editForm);
      setShowEditModal(false);
      setRecalcNotice(`Factor '${selectedFactor.name}' updated to version ${editForm.version_tag}! Automated recalculation triggered for all affected calculations.`);
      fetchFactors();
      setTimeout(() => setRecalcNotice(null), 8000);
    } catch (err: any) {
      alert(err.message || 'Failed to update factor version');
    }
  };

  const filteredFactors = factors.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.factor_key.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase()) ||
    f.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Calculation Governance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Emission Factor Library & Version Governance</h1>
          <p className="text-slate-400 text-sm">Version-controlled factors (DEFRA, eGRID, IPCC, EXIOBASE) with automatic recalculation tracing</p>
        </div>
      </div>

      {recalcNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{recalcNotice}</span>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by country, factor name, key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="">All Scopes</option>
            <option value="Scope 1">Scope 1</option>
            <option value="Scope 2">Scope 2</option>
            <option value="Scope 3">Scope 3</option>
          </select>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="">All Countries</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Japan">Japan</option>
            <option value="China">China</option>
            <option value="India">India</option>
            <option value="Brazil">Brazil</option>
            <option value="Australia">Australia</option>
            <option value="Singapore">Singapore</option>
            <option value="Mexico">Mexico</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="Netherlands">Netherlands</option>
          </select>
        </div>
      </div>

      {/* EMISSION FACTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredFactors.map((f) => (
          <div key={f.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {f.scope}
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded">
                  {f.version_tag}
                </span>
              </div>

              <h3 className="font-bold text-slate-100 text-sm">{f.name}</h3>
              <p className="text-xs text-slate-400">{f.category} ({f.country})</p>

              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{f.co2e_factor}</p>
                  <p className="text-[10px] text-slate-500">kgCO2e per {f.unit}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{f.source_library}</span>
              </div>
            </div>

            <button
              onClick={() => handleEditClick(f)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Update Version Factor
            </button>
          </div>
        ))}
      </div>

      {/* EDIT & RECALCULATE MODAL */}
      {showEditModal && selectedFactor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Revise Emission Factor</h3>
                <p className="text-xs text-slate-400">Factor Key: {selectedFactor.factor_key}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateFactor} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Factor Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">New CO2e Factor Value (kgCO2e per {selectedFactor.unit})</label>
                <input
                  type="number"
                  step="any"
                  value={editForm.co2e_factor}
                  onChange={(e) => setEditForm({ ...editForm, co2e_factor: parseFloat(e.target.value) })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Version Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. v2025.1"
                    value={editForm.version_tag}
                    onChange={(e) => setEditForm({ ...editForm, version_tag: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Source Library</label>
                  <input
                    type="text"
                    value={editForm.source_library}
                    onChange={(e) => setEditForm({ ...editForm, source_library: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                ⚠️ Updating this factor will automatically generate new calculation versions for all affected historical calculations without overwriting previous data.
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Update & Recalculate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
