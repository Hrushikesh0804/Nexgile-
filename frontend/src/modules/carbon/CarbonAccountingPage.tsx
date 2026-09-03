import React, { useState, useEffect } from 'react';
import { Flame, Zap, Layers, Database, GitCommit, Factory } from 'lucide-react';
import apiClient from '../../core/api/client';
import { Scope1Page } from './Scope1Page';
import { Scope2Page } from './Scope2Page';
import { Scope3Page } from './Scope3Page';
import { EmissionFactorsPage } from './EmissionFactorsPage';
import { CalculationsPage } from './CalculationsPage';

export const CarbonAccountingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scope1' | 'scope2' | 'scope3' | 'factors' | 'calculations'>('scope1');
  const [summary, setSummary] = useState({
    total_co2e_kg: 0,
    scope1_co2e_kg: 0,
    scope2_co2e_kg: 0,
    scope3_co2e_kg: 0,
    category_breakdown: {} as Record<string, number>
  });

  useEffect(() => {
    apiClient.get('/carbon/summary')
      .then((res: any) => {
        if (res.data) setSummary(res.data);
      })
      .catch(() => {});
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* COMPANY-WIDE EMISSIONS SUMMARY WIDGET */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Corporate Footprint</p>
          <p className="text-3xl font-bold text-white">
            {(summary.total_co2e_kg / 1000).toFixed(2)} <span className="text-sm font-normal text-slate-400">tCO2e</span>
          </p>
          <p className="text-[10px] text-emerald-400 font-medium">100% Lineage Backed</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Scope 1 Direct
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {(summary.scope1_co2e_kg / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
          </p>
          <p className="text-[10px] text-slate-400">Stationary & Mobile Combustion</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Scope 2 Electricity
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {(summary.scope2_co2e_kg / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
          </p>
          <p className="text-[10px] text-slate-400">Location-Based Grid Average</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Scope 3 Value Chain
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {(summary.scope3_co2e_kg / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
          </p>
          <p className="text-[10px] text-slate-400">Upstream & Downstream Categories</p>
        </div>
      </div>

      {/* MODULE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scope1')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scope1' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" /> Scope 1 (Direct)
        </button>
        <button
          onClick={() => setActiveTab('scope2')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scope2' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" /> Scope 2 (Grid Energy)
        </button>
        <button
          onClick={() => setActiveTab('scope3')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'scope3' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-400" /> Scope 3 (Value Chain)
        </button>
        <button
          onClick={() => setActiveTab('factors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'factors' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-400" /> Emission Factors Library
        </button>
        <button
          onClick={() => setActiveTab('calculations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'calculations' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-4 h-4 text-emerald-400" /> Calculations & Lineage
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'scope1' && <Scope1Page />}
      {activeTab === 'scope2' && <Scope2Page />}
      {activeTab === 'scope3' && <Scope3Page />}
      {activeTab === 'factors' && <EmissionFactorsPage />}
      {activeTab === 'calculations' && <CalculationsPage />}
    </div>
  );
};
