import React, { useState, useEffect } from 'react';
import { Globe, Plus, Award, ShieldCheck, RefreshCw } from 'lucide-react';
import apiClient from '../../core/api/client';

export const CBAMWorkspaceView: React.FC = () => {
  const [declarations, setDeclarations] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/compliance/cbam')
      .then((res: any) => setDeclarations(res.data || []))
      .catch(() => setDeclarations([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
          EU Carbon Border Adjustment Mechanism (CBAM)
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">CBAM Quarterly Import Declarations</h1>
        <p className="text-slate-400 text-sm">Track embedded carbon emissions in imported goods with actual primary vs default fallback flags</p>
      </div>

      <div className="space-y-4">
        {declarations.map((cbam) => (
          <div key={cbam.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base">{cbam.quarterly_period} CBAM Declaration</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {cbam.data_origin}
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">Certificates Purchased: {cbam.certificates_purchased}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800">
              <p>Embedded Carbon: <strong className="text-emerald-400">{cbam.embedded_emissions_tco2e} tCO2e</strong></p>
              <p>Carbon Tariff Liability: <strong className="text-amber-400">€{cbam.adjustment_eur?.toLocaleString()}</strong></p>
            </div>
          </div>
        ))}

        {declarations.length === 0 && (
          <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
            No quarterly CBAM declarations recorded for current period.
          </div>
        )}
      </div>
    </div>
  );
};
