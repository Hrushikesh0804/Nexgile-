import React, { useState } from 'react';
import { ShieldCheck, Globe, Scale, Award, Layers } from 'lucide-react';
import { FrameworkSelectorView } from './FrameworkSelectorView';
import { CSRDWorkspaceView } from './CSRDWorkspaceView';
import { CBAMWorkspaceView } from './CBAMWorkspaceView';
import { EUTaxonomyWorkspaceView } from './EUTaxonomyWorkspaceView';
import { TCFDWorkspaceView } from './TCFDWorkspaceView';

export const ComplianceModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'selector' | 'csrd' | 'cbam' | 'taxonomy' | 'tcfd'>('csrd');

  const handleSelectFramework = (fwName: string) => {
    if (fwName === 'csrd') setActiveTab('csrd');
    else if (fwName === 'cbam') setActiveTab('cbam');
    else if (fwName === 'taxonomy') setActiveTab('taxonomy');
    else if (fwName === 'tcfd') setActiveTab('tcfd');
    else setActiveTab('csrd');
  };

  return (
    <div className="space-y-6">
      {/* MODULE TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('selector')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'selector' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> All Frameworks Catalog
        </button>

        <button
          onClick={() => setActiveTab('csrd')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'csrd' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> CSRD / ESRS Workspace
        </button>

        <button
          onClick={() => setActiveTab('cbam')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'cbam' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" /> CBAM Import Tariff
        </button>

        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'taxonomy' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" /> EU Taxonomy Alignment
        </button>

        <button
          onClick={() => setActiveTab('tcfd')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'tcfd' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" /> TCFD Disclosure
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'selector' && <FrameworkSelectorView onSelectFramework={handleSelectFramework} />}
      {activeTab === 'csrd' && <CSRDWorkspaceView />}
      {activeTab === 'cbam' && <CBAMWorkspaceView />}
      {activeTab === 'taxonomy' && <EUTaxonomyWorkspaceView />}
      {activeTab === 'tcfd' && <TCFDWorkspaceView />}
    </div>
  );
};
