import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import apiClient from '../../core/api/client';

export const EUTaxonomyWorkspaceView: React.FC = () => {
  const [alignments, setAlignments] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/compliance/eu-taxonomy')
      .then((res: any) => setAlignments(res.data || []))
      .catch(() => setAlignments([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
          EU Sustainable Finance Taxonomy
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">EU Taxonomy Alignment & DNSH Checklist</h1>
        <p className="text-slate-400 text-sm">Technical screening criteria and Do No Significant Harm (DNSH) compliance for CapEx/OpEx green alignment</p>
      </div>

      <div className="space-y-4">
        {alignments.map((a) => (
          <div key={a.id} className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-4 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-base">{a.economic_activity_code}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Taxonomy Aligned (100%)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Aligned CapEx</p>
                <p className="text-base font-bold text-emerald-400">${a.capex_aligned_usd?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Aligned OpEx</p>
                <p className="text-base font-bold text-teal-400">${a.opex_aligned_usd?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Aligned Revenue</p>
                <p className="text-base font-bold text-purple-300">${a.revenue_aligned_usd?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
