import React, { useState } from 'react';
import { LayoutDashboard, Layers, Coins, DollarSign, Award, TrendingUp } from 'lucide-react';
import { ExecutiveDashboardView } from './ExecutiveDashboardView';
import { OperationalDrillDownView } from './OperationalDrillDownView';
import { CarbonBudgetsView } from '../carbon_finance/CarbonBudgetsView';
import { InternalCarbonPricingView } from '../carbon_finance/InternalCarbonPricingView';
import { OffsetRegistryView } from '../carbon_finance/OffsetRegistryView';
import { ProjectEconomicsView } from '../carbon_finance/ProjectEconomicsView';

export const DashboardsFinanceModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'executive' | 'drilldown' | 'budgets' | 'pricing' | 'offsets' | 'economics'>('executive');

  return (
    <div className="space-y-6">
      {/* MODULE TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('executive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'executive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Executive Net-Zero Dashboard
        </button>

        <button
          onClick={() => setActiveTab('drilldown')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'drilldown' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Operational Multi-Tier Drill-Down
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'budgets' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" /> Carbon Budgets
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'pricing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Internal Carbon Pricing
        </button>

        <button
          onClick={() => setActiveTab('offsets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'offsets' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" /> Offsets & Retirement Registry
        </button>

        <button
          onClick={() => setActiveTab('economics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'economics' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Project Economics & ROI
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'executive' && <ExecutiveDashboardView />}
      {activeTab === 'drilldown' && <OperationalDrillDownView />}
      {activeTab === 'budgets' && <CarbonBudgetsView />}
      {activeTab === 'pricing' && <InternalCarbonPricingView />}
      {activeTab === 'offsets' && <OffsetRegistryView />}
      {activeTab === 'economics' && <ProjectEconomicsView />}
    </div>
  );
};
