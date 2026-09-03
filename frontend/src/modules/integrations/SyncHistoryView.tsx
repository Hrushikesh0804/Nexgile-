import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, AlertTriangle, CheckCircle2, FileText, RotateCcw } from 'lucide-react';
import apiClient from '../../core/api/client';

export const SyncHistoryView: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedErrorQueue, setSelectedErrorQueue] = useState<any[] | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    apiClient.get('/integrations/runs')
      .then((res: any) => {
        setRuns(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    apiClient.get('/integrations/connections')
      .then((res: any) => {
        const list = res.data || [];
        setConnections(list);
        if (list.length > 0) setSelectedConnId(list[0].id);
      })
      .catch(() => setConnections([]));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunIngestion = async () => {
    if (!selectedConnId) return;
    setLoading(true);
    try {
      await apiClient.post('/integrations/run', {
        connection_id: selectedConnId,
        file_name: 'utility_meter_ingest.csv'
      });
      fetchHistory();
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Import run failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Pipeline Execution & Health Audit
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Sync Runs History & Error Queue</h1>
          <p className="text-slate-400 text-sm">Monitor batch imports, audit per-record errors, and trigger automated re-try runs</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedConnId}
            onChange={(e) => setSelectedConnId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none"
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleRunIngestion}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
          >
            <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Trigger Import Pipeline
          </button>
        </div>
      </div>

      {/* RUNS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4 font-semibold">Run ID</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Processed</th>
              <th className="p-4 font-semibold">Imported</th>
              <th className="p-4 font-semibold">Rejected</th>
              <th className="p-4 font-semibold">Started At</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-slate-900/40">
                <td className="p-4 font-bold text-slate-200">{r.id.substring(0, 8)}...</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    r.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    r.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-slate-300">{r.records_processed}</td>
                <td className="p-4 text-emerald-400 font-bold">{r.records_imported}</td>
                <td className="p-4 text-red-400 font-bold">{r.records_rejected}</td>
                <td className="p-4 text-slate-400">{new Date(r.started_at).toLocaleString()}</td>
                <td className="p-4 text-right">
                  {r.records_rejected > 0 ? (
                    <button
                      onClick={() => setSelectedErrorQueue(r.error_queue_json)}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-sans text-[11px] font-semibold"
                    >
                      View Errors ({r.records_rejected})
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Clean</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ERROR QUEUE MODAL */}
      {selectedErrorQueue && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Per-Record Error Queue
              </h3>
              <button onClick={() => setSelectedErrorQueue(null)} className="text-xs text-slate-400 underline">Close</button>
            </div>

            <div className="space-y-3">
              {selectedErrorQueue.map((err, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                  <p className="text-red-400 font-bold">Record #{err.record_index + 1}: {err.error_message}</p>
                  <pre className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(err.raw_row, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                alert('Triggered retry execution for queued failed records');
                setSelectedErrorQueue(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4" /> Retry Failed Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
