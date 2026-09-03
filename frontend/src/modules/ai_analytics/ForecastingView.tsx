import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingDown, Calendar, ShieldCheck, RefreshCw } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ForecastingView: React.FC = () => {
  const [forecast, setForecast] = useState<any | null>(null);
  const [targetYear, setTargetYear] = useState(2030);
  const [loading, setLoading] = useState(false);

  const fetchForecast = (year: number) => {
    setLoading(true);
    apiClient.post('/ai-analytics/forecast', { target_year: year })
      .then((res: any) => {
        setForecast(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchForecast(targetYear);
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Time-Series Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Emissions & Energy Time-Series Forecasting</h1>
          <p className="text-slate-400 text-sm">Predictive projections over historical calculations with P5-P95 confidence bands</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Target Horizon:</span>
          <select
            value={targetYear}
            onChange={(e) => {
              const yr = parseInt(e.target.value);
              setTargetYear(yr);
              fetchForecast(yr);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value={2026}>2026 Target</option>
            <option value={2028}>2028 Target</option>
            <option value={2030}>2030 Net-Zero Target</option>
            <option value={2035}>2035 Horizon</option>
          </select>
        </div>
      </div>

      {/* FORECAST SUMMARY METRICS */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border-2 border-indigo-500/30 space-y-1 relative overflow-hidden bg-slate-900/60">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl">
              Scenario Forecast
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Projected {forecast.target_year} CO2e</p>
            <p className="text-3xl font-bold text-indigo-400">
              {(forecast.forecasted_co2e_kg / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Model: {forecast.model_type}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Target Achievement Probability</p>
            <p className="text-3xl font-bold text-emerald-400">{forecast.target_achievement_prob}%</p>
            <p className="text-[10px] text-emerald-400">High Confidence Trajectory</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">P5 Lower Bound (Optimistic)</p>
            <p className="text-2xl font-bold text-teal-400">
              {(forecast.uncertainty_lower_co2e / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
            </p>
            <p className="text-[10px] text-slate-500">5th Percentile Stochastic Min</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">P95 Upper Bound (Pessimistic)</p>
            <p className="text-2xl font-bold text-amber-400">
              {(forecast.uncertainty_upper_co2e / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO2e</span>
            </p>
            <p className="text-[10px] text-slate-500">95th Percentile Upper Risk Bound</p>
          </div>
        </div>
      )}

      {/* VISUAL TIME-SERIES PROJECTION CHART */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Historical Actuals vs AI Forecast Trajectory (2021 – {targetYear})
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Scenario Forecast (Zero Actual Mutation)
          </span>
        </div>

        {/* TIME-SERIES STYLED GRAPH BARS */}
        <div className="p-6 bg-slate-900/80 rounded-xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-6 gap-3 items-end h-48 pt-4">
            <div className="space-y-1 text-center">
              <span className="text-[10px] text-slate-400 font-mono">185 tCO2e</span>
              <div className="bg-emerald-500/80 h-32 rounded-t-lg shadow-lg"></div>
              <span className="text-xs text-slate-300 font-bold block">2021</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] text-slate-400 font-mono">172 tCO2e</span>
              <div className="bg-emerald-500/80 h-28 rounded-t-lg shadow-lg"></div>
              <span className="text-xs text-slate-300 font-bold block">2022</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] text-slate-400 font-mono">160 tCO2e</span>
              <div className="bg-emerald-500/80 h-24 rounded-t-lg shadow-lg"></div>
              <span className="text-xs text-slate-300 font-bold block">2023</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] text-slate-400 font-mono">152 tCO2e</span>
              <div className="bg-emerald-500/80 h-22 rounded-t-lg shadow-lg"></div>
              <span className="text-xs text-slate-300 font-bold block">2024</span>
            </div>
            <div className="space-y-1 text-center opacity-80">
              <span className="text-[10px] text-indigo-300 font-mono font-bold">135 tCO2e</span>
              <div className="bg-gradient-to-t from-indigo-600 to-purple-500 h-18 rounded-t-lg border-2 border-dashed border-indigo-400"></div>
              <span className="text-xs text-indigo-300 font-bold block">2026 (Fcst)</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] text-indigo-400 font-mono font-bold">
                {forecast ? (forecast.forecasted_co2e_kg / 1000).toFixed(0) : '118'} tCO2e
              </span>
              <div className="bg-gradient-to-t from-indigo-600 to-purple-400 h-14 rounded-t-lg border-2 border-indigo-400"></div>
              <span className="text-xs text-indigo-400 font-bold block">{targetYear} (Target)</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded" /> Historical Actual Emissions</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded" /> Holt-Winters AI Forecast Line</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-400/30 rounded border border-dashed border-indigo-400" /> P5-P95 Uncertainty Band</span>
          </div>
        </div>
      </div>
    </div>
  );
};
