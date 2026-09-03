import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface Props {
  title: string;
  moduleNumber: number;
  description: string;
  icon: LucideIcon;
  features: string[];
}

export const PlaceholderModulePage: React.FC<Props> = ({
  title,
  moduleNumber,
  description,
  icon: Icon,
  features
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
              Module {moduleNumber}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-lg font-bold text-slate-200">Platform Blueprint Ready</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Key Module Capabilities (Module {moduleNumber})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feat, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-3 text-sm text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 glow-emerald" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
