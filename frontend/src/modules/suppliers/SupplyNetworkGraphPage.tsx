import React, { useState, useEffect } from 'react';
import { Layers, Globe, Network, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';

export const SupplyNetworkGraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [], geographic_heatmap: {} });

  useEffect(() => {
    apiClient.get('/suppliers/network/graph')
      .then((res: any) => {
        if (res.data) setGraphData(res.data);
      })
      .catch(() => {});
  }, []);

  const geoEntries = Object.entries(graphData.geographic_heatmap || {});

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Scope 3 Ecosystem Topology
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Supply Network Graph & Geographic Footprint</h1>
        <p className="text-slate-400 text-sm">Visualizing Multi-tier Supplier Relationships (Tier 1 → Tier 2 → Tier 3) and Geographic Concentration</p>
      </div>

      {/* GRAPH VISUALIZATION CARD */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Network className="w-4 h-4 text-emerald-400" /> Multi-Tier Network Graph Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[220px]">
          {/* ORG CENTER NODE */}
          <div className="glass-card p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-center items-center text-center space-y-2 bg-emerald-500/10">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Enterprise Focal Point
            </span>
            <h3 className="font-bold text-slate-100 text-base">Nexgile DecarbX Platform</h3>
            <p className="text-xs text-slate-400">Reporting Boundary Aggregator</p>
          </div>

          {/* TIER 1 SUPPLIERS */}
          <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
              Tier 1 Direct Suppliers
            </span>
            <div className="space-y-2">
              {graphData.nodes?.filter((n: any) => n.tier === 'Tier 1')?.map((node: any) => (
                <div key={node.id} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs flex justify-between">
                  <span className="font-semibold text-slate-200">{node.label}</span>
                  <span className="text-[10px] text-slate-400">{node.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TIER 2 & TIER 3 SUPPLIERS */}
          <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-400 border border-slate-700">
              Tier 2 & Sub-Tier Supply Chain
            </span>
            <div className="space-y-2">
              {graphData.nodes?.filter((n: any) => n.tier !== 'Tier 1' && n.type === 'supplier')?.map((node: any) => (
                <div key={node.id} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs flex justify-between">
                  <span className="font-semibold text-slate-200">{node.label}</span>
                  <span className="text-[10px] text-slate-400">{node.tier}</span>
                </div>
              ))}
              {graphData.nodes?.filter((n: any) => n.tier !== 'Tier 1' && n.type === 'supplier').length === 0 && (
                <p className="text-xs text-slate-500">Sub-tier supplier cascading active via questionnaire onboarding.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GEOGRAPHIC HEATMAP / COUNTRY AGGREGATION */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" /> Geographic Emissions Aggregation by Country
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {geoEntries.map(([country, stats]: [string, any]) => (
            <div key={country} className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{country}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-bold">
                  {stats.supplier_count} Vendors
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {(stats.total_co2e_kg / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">tCO2e</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
