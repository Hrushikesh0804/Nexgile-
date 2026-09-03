import React from 'react';
import { Award, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

export const TCFDWorkspaceView: React.FC = () => {
  const tcfdPillars = [
    { title: 'Governance', status: 'COMPLIANT', desc: 'Board oversight of climate-related risks and management role in evaluating climate performance.' },
    { title: 'Strategy', status: 'COMPLIANT', desc: 'Climate-related risks and opportunities identified over short, medium, and long-term horizons (1.5C Net-Zero).' },
    { title: 'Risk Management', status: 'COMPLIANT', desc: 'Processes for identifying, assessing, and managing climate risks integrated into enterprise ERM.' },
    { title: 'Metrics & Targets', status: 'COMPLIANT', desc: 'Scopes 1, 2, 3 GHG metrics and Science Based Targets (SBTi 2030) trajectory performance.' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          TCFD Framework
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">TCFD 4-Pillar Climate Disclosure</h1>
        <p className="text-slate-400 text-sm">Governance, Strategy, Risk Management, and Metrics & Targets backed by audit evidence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tcfdPillars.map((p) => (
          <div key={p.title} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-base">{p.title} Pillar</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {p.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
