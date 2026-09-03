import React, { useState, useEffect } from 'react';
import { DollarSign, Sliders, ShieldCheck, Plus } from 'lucide-react';
import apiClient from '../../core/api/client';

export const InternalCarbonPricingView: React.FC = () => {
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/carbon-finance/pricing')
      .then((res: any) => setPrices(res.data || []))
      .catch(() => setPrices([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Internal Carbon Pricing (ICP)
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Internal Carbon Price Scenarios & Shadow Pricing</h1>
        <p className="text-slate-400 text-sm">Apply internal carbon prices ($ / tCO2e) to evaluate capital investments and internal carbon fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prices.map((p) => (
          <div key={p.id} className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-3 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">{p.scenario_name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {p.price_type}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-3xl font-bold text-purple-300 font-mono">
                ${p.price_per_tco2e_usd} <span className="text-xs text-slate-400 font-normal">/ tCO2e</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">Coverage: <strong className="text-slate-200">{p.scope_coverage}</strong></p>
              <p className="text-[10px] text-slate-500">Effective Fiscal Year: {p.effective_year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
