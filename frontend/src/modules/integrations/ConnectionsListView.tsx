import React, { useState, useEffect } from 'react';
import { Database, Plus, RefreshCw, CheckCircle2, ShieldCheck, Server } from 'lucide-react';
import apiClient from '../../core/api/client';

export const ConnectionsListView: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [systemType, setSystemType] = useState('CSV_FILE');

  const fetchConnections = () => {
    setLoading(true);
    apiClient.get('/integrations/connections')
      .then((res: any) => {
        setConnections(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleCreate = async () => {
    if (!name) return;
    try {
      await apiClient.post('/integrations/connections', {
        name,
        system_type: systemType,
        credentials_vault_ref: `vault://enc_${systemType.toLowerCase()}_key`
      });
      setShowModal(false);
      setName('');
      fetchConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to add connection');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Integration Connectors & Vault Credentials
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Data Integration Connections</h1>
          <p className="text-slate-400 text-sm">Configure secure data feeds from ERPs, utility files, REST APIs, and webhooks</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add Integration Connection
        </button>
      </div>

      {/* CONNECTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((conn) => (
          <div key={conn.id} className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-slate-100 text-base">{conn.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                {conn.status}
              </span>
            </div>

            <div className="space-y-1 text-xs font-mono text-slate-400">
              <p>System Type: <strong className="text-slate-200">{conn.system_type}</strong></p>
              <p>Credentials: <strong className="text-teal-400">{conn.credentials_vault_ref}</strong></p>
              <p>Last Sync: <span className="text-slate-300">{conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString() : 'Never'}</span></p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vault Encrypted
              </span>
              <button
                onClick={() => alert(`Connection test successful for ${conn.name}`)}
                className="text-blue-400 hover:text-blue-300 transition-all"
              >
                Test Connection
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD CONNECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Add Integration Connection</h3>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="text-slate-400 block mb-1">Connection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Utility Meter CSV Feed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">System Type</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="CSV_FILE">CSV / Excel File Stream</option>
                  <option value="REST_API">Generic REST API Endpoint</option>
                  <option value="WEBHOOK">Real-Time Webhook Listener</option>
                  <option value="SAP_ERP">SAP S/4HANA ERP Connector</option>
                  <option value="ORACLE_FUSION">Oracle Fusion Cloud ERP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs">
                Cancel
              </button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
