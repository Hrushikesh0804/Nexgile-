import React, { useState } from 'react';
import { Database, Layers, RefreshCw, FileCheck } from 'lucide-react';
import { ConnectionsListView } from './ConnectionsListView';
import { FieldMappingBuilderView } from './FieldMappingBuilderView';
import { SyncHistoryView } from './SyncHistoryView';
import { ReconciliationDashboardView } from './ReconciliationDashboardView';

export const IntegrationsModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connections' | 'mappings' | 'history' | 'reconciliation'>('connections');

  return (
    <div className="space-y-6">
      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'connections' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" /> Connections & Vault
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'mappings' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Field Mapping Builder
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'history' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Sync Runs & Error Queue
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reconciliation' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Reconciliation Audit
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'connections' && <ConnectionsListView />}
      {activeTab === 'mappings' && <FieldMappingBuilderView />}
      {activeTab === 'history' && <SyncHistoryView />}
      {activeTab === 'reconciliation' && <ReconciliationDashboardView />}
    </div>
  );
};
