import React, { useState } from 'react';
import { Users, FileText, Network, Coins } from 'lucide-react';
import { SupplierCatalogPage } from './SupplierCatalogPage';
import { QuestionnaireBuilder } from './QuestionnaireBuilder';
import { SupplyNetworkGraphPage } from './SupplyNetworkGraphPage';
import { ProcurementBidComparisonPage } from './ProcurementBidComparisonPage';

export const SuppliersModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'builder' | 'network' | 'procurement'>('catalog');

  return (
    <div className="space-y-6">
      {/* INTERNAL MODULE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'catalog' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Supplier Catalog & Scorecards
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'builder' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" /> Questionnaire Campaign Builder
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'network' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4 text-teal-400" /> Supply Network Graph & Geo Map
        </button>
        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'procurement' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" /> Carbon-Weighted Bid Comparison
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'catalog' && <SupplierCatalogPage />}
      {activeTab === 'builder' && <QuestionnaireBuilder onSuccess={() => setActiveTab('catalog')} />}
      {activeTab === 'network' && <SupplyNetworkGraphPage />}
      {activeTab === 'procurement' && <ProcurementBidComparisonPage />}
    </div>
  );
};
