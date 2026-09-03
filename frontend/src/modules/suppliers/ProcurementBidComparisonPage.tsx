import React, { useState } from 'react';
import { Coins, Award, TrendingDown, RefreshCw, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ProcurementBidComparisonPage: React.FC = () => {
  const [bids, setBids] = useState<any[]>([
    { supplier_id: 'SUP-001', supplier_name: 'Acme Eco-Materials Corp', bid_price_usd: 125000.0, disclosed_pcf_co2e_kg: 38.5 },
    { supplier_id: 'SUP-002', supplier_name: 'Standard Industrial Metals Ltd', bid_price_usd: 110000.0, disclosed_pcf_co2e_kg: 92.0 },
    { supplier_id: 'SUP-003', supplier_name: 'Global Metal Alloys Group', bid_price_usd: 118000.0, disclosed_pcf_co2e_kg: 65.0 }
  ]);

  const [result, setResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleRunBidComparison = async () => {
    setEvaluating(true);
    try {
      const res: any = await apiClient.post('/suppliers/procurement/bid-comparison', bids);
      setResult(res.data);
      setEvaluating(false);
    } catch (err: any) {
      setEvaluating(false);
      alert(err.message || 'Bid evaluation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sustainable Procurement Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Carbon-Weighted Bid Comparison</h1>
          <p className="text-slate-400 text-sm">Evaluating Procurement Tenders with PCF Carbon Intensity Penalties (ISO 14067 Standard)</p>
        </div>

        <button
          onClick={handleRunBidComparison}
          disabled={evaluating}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
        >
          <Coins className="w-4 h-4" /> {evaluating ? 'Evaluating...' : 'Run Carbon-Weighted Bid Evaluation'}
        </button>
      </div>

      {/* INPUT BIDS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-400" /> Supplier Tender Proposals ({bids.length} Vendors)
        </h2>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Supplier Name</th>
              <th className="p-4">Raw Tender Price ($ USD)</th>
              <th className="p-4">Disclosed Product Carbon Footprint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {bids.map((b, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-100">{b.supplier_name}</td>
                <td className="p-4 font-mono font-bold text-slate-200">${b.bid_price_usd.toLocaleString()}</td>
                <td className="p-4 font-mono text-emerald-400 font-bold">{b.disclosed_pcf_co2e_kg} kgCO2e/unit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EVALUATION RESULTS */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-500/30 space-y-6 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                Procurement Decision Output
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">Carbon-Adjusted Tender Rankings</h3>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Recommended Winner</p>
              <p className="text-base font-bold text-emerald-400">
                {result.bids.find((b: any) => b.supplier_id === result.recommended_winner_supplier_id)?.supplier_name}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {result.bids.map((evalBid: any, idx: number) => {
              const isWinner = evalBid.supplier_id === result.recommended_winner_supplier_id;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isWinner
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{evalBid.supplier_name}</span>
                      {isWinner && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Recommended Eco Winner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Raw Price: <strong className="text-slate-200">${evalBid.bid_price_usd.toLocaleString()}</strong> | Disclosed PCF: <strong className="text-emerald-400">{evalBid.disclosed_pcf_co2e_kg} kgCO2e</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Carbon Intensity Penalty: <span className="text-amber-400 font-bold">+{evalBid.carbon_penalty_pct}%</span></p>
                    <p className="text-xl font-bold text-slate-100 mt-0.5 font-mono">
                      ${evalBid.carbon_weighted_bid_price_usd.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Adjusted USD</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 italic pt-2">{result.carbon_weighting_notes}</p>
        </div>
      )}
    </div>
  );
};
