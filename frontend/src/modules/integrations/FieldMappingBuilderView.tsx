import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Save, Layers } from 'lucide-react';
import apiClient from '../../core/api/client';

export const FieldMappingBuilderView: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [mappings, setMappings] = useState<any[]>([]);
  const [customPairs, setCustomPairs] = useState<{ src: string; tgt: string }[]>([
    { src: 'kwh_used', tgt: 'quantity' },
    { src: 'fuel_type', tgt: 'activity_type' },
    { src: 'scope_type', tgt: 'scope' },
    { src: 'unit_type', tgt: 'unit' }
  ]);

  useEffect(() => {
    apiClient.get('/integrations/connections')
      .then((res: any) => {
        const list = res.data || [];
        setConnections(list);
        if (list.length > 0) setSelectedConnId(list[0].id);
      })
      .catch(() => setConnections([]));

    apiClient.get('/integrations/mappings')
      .then((res: any) => setMappings(res.data || []))
      .catch(() => setMappings([]));
  }, []);

  const handleAddPair = () => {
    setCustomPairs([...customPairs, { src: '', tgt: 'quantity' }]);
  };

  const handleSaveMapping = async () => {
    if (!selectedConnId) return;
    const mappingObj: Record<string, string> = {};
    customPairs.forEach(p => {
      if (p.src.trim()) mappingObj[p.src.trim()] = p.tgt;
    });

    try {
      await apiClient.post('/integrations/mappings', {
        connection_id: selectedConnId,
        target_entity: 'ActivityData',
        mapping_json: mappingObj
      });
      alert('Field mapping rule saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save field mapping');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Source to Target Entity Field Mapping Engine
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Field Mapping Builder</h1>
        <p className="text-slate-400 text-sm">Map external source columns into core ActivityData, EmissionFactor, and Supplier target model fields</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 bg-slate-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Select Integration Connection</label>
            <select
              value={selectedConnId}
              onChange={(e) => setSelectedConnId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-teal-500"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.system_type})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveMapping}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Save Field Mapping Rule
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-200 text-sm">Target Entity: <strong className="text-teal-400">ActivityData Table</strong></h3>

          <div className="space-y-2">
            {customPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Source Column Name (e.g. kwh_used)"
                  value={pair.src}
                  onChange={(e) => {
                    const newP = [...customPairs];
                    newP[idx].src = e.target.value;
                    setCustomPairs(newP);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                />

                <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />

                <select
                  value={pair.tgt}
                  onChange={(e) => {
                    const newP = [...customPairs];
                    newP[idx].tgt = e.target.value;
                    setCustomPairs(newP);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-teal-300 font-mono focus:outline-none"
                >
                  <option value="quantity">ActivityData.quantity (Float)</option>
                  <option value="activity_type">ActivityData.activity_type (String)</option>
                  <option value="scope">ActivityData.scope (String)</option>
                  <option value="unit">ActivityData.unit (String)</option>
                  <option value="category">ActivityData.category (String)</option>
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddPair}
            className="flex items-center gap-1 text-xs text-teal-400 font-semibold hover:underline pt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field Pair Row
          </button>
        </div>
      </div>
    </div>
  );
};
