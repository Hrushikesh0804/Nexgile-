import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calculator, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ProjectEconomicsView: React.FC = () => {
  const [econs, setEcons] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/carbon-finance/economics')
      .then((res: any) => setEcons(res.data || []))
      .catch(() => setEcons([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Financial Investment Analysis
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Project Economics & Decarbonization ROI</h1>
        <p className="text-slate-400 text-sm">Net Present Value (NPV), Internal Rate of Return (IRR), and Payback Period tied to Module 4 reduction initiatives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {econs.map((e) => (
          <div key={e.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100 text-sm">Decarbonization Initiative ROI Analysis</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Initiative ID: {e.initiative_id.substring(0, 8)}...</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Net Present Value</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">${e.npv_usd?.toLocaleString()}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Internal Rate of Return</p>
                <p className="text-lg font-bold text-teal-400 font-mono">{e.irr_pct}%</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Payback Period</p>
                <p className="text-lg font-bold text-amber-400 font-mono">{e.payback_period_years} yrs</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
