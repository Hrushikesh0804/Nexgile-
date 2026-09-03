import React, { useState, useEffect } from 'react';
import { Coins, RefreshCw, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import apiClient from '../../core/api/client';

export const CarbonBudgetsView: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBudgets = () => {
    apiClient.get('/carbon-finance/budgets')
      .then((res: any) => setBudgets(res.data || []))
      .catch(() => setBudgets([]));
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSyncBudget = async (budgetId: string) => {
    try {
      await apiClient.post(`/carbon-finance/budgets/${budgetId}/sync`);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Corporate Carbon Budgeting
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Carbon Budgets Allocation & Consumption</h1>
          <p className="text-slate-400 text-sm">Track carbon allowance allocations vs actual consumed emissions linked to reduction initiatives</p>
        </div>
      </div>

      {/* BUDGET CARDS LIST */}
      <div className="space-y-4">
        {budgets.map((b) => {
          const allocated_t = b.allocated_co2e_kg / 1000.0;
          const consumed_t = b.consumed_co2e_kg / 1000.0;
          const pct = Math.min(100, Math.round((consumed_t / allocated_t) * 100));

          return (
            <div key={b.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-base">FY{b.fiscal_year} Carbon Budget Allowance</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'EXCEEDED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Allocated Allowance: <strong className="text-slate-200">{allocated_t} tCO2e</strong> | Consumed To Date: <strong className="text-emerald-400">{consumed_t} tCO2e</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleSyncBudget(b.id)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync Initiative Progress
                </button>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Consumption Level</span>
                  <span className="font-bold text-emerald-400">{pct}% Consumed</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
