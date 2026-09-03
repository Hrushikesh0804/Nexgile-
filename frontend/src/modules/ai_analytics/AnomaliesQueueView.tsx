import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, RefreshCw, XCircle, FileText } from 'lucide-react';
import apiClient from '../../core/api/client';

export const AnomaliesQueueView: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);

  const fetchAnomalies = () => {
    apiClient.get('/ai-analytics/anomalies')
      .then((res: any) => setAnomalies(res.data || []))
      .catch(() => setAnomalies([]));
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await apiClient.post('/ai-analytics/anomalies/detect');
      setDetecting(false);
      fetchAnomalies();
    } catch (err: any) {
      setDetecting(false);
      alert(err.message || 'Detection failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Explainable AI Governance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">AI Anomaly Queue & Quality Assurance</h1>
          <p className="text-slate-400 text-sm">Statistical 3-sigma outlier detection with clear, field-level explainability for activity entries</p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={detecting}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
          {detecting ? 'Analyzing Data...' : 'Run Statistical Anomaly Scan'}
        </button>
      </div>

      {/* ANOMALIES LIST */}
      <div className="space-y-3">
        {anomalies.map((anom) => (
          <div key={anom.id} className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-3 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-slate-100 text-sm">AI Anomaly Flagged</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {anom.severity} Severity
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ID: {anom.id.substring(0, 8)}...</span>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono">
              {anom.explanation}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500">Target Table: <strong className="text-slate-300">{anom.target_table}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAnomalies(anomalies.filter((a) => a.id !== anom.id))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
                >
                  Dismiss Flag
                </button>
                <button
                  onClick={() => setAnomalies(anomalies.filter((a) => a.id !== anom.id))}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                >
                  Resolve via Meter Audit
                </button>
              </div>
            </div>
          </div>
        ))}

        {anomalies.length === 0 && (
          <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
            No statistical anomaly flags found in activity records. Click "Run Statistical Anomaly Scan" to inspect data quality.
          </div>
        )}
      </div>
    </div>
  );
};
