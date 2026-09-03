import React, { useState } from 'react';
import { Sparkles, ShieldAlert, FileText, RefreshCw, Sliders, Target } from 'lucide-react';
import { ForecastingView } from './ForecastingView';
import { AnomaliesQueueView } from './AnomaliesQueueView';
import { DocumentOCRView } from './DocumentOCRView';
import { WhatIfBuilderView } from './WhatIfBuilderView';
import { SensitivityView } from './SensitivityView';
import { ReductionPlanningView } from './ReductionPlanningView';

export const AIAnalyticsModulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecasting' | 'anomalies' | 'ocr' | 'whatif' | 'sensitivity' | 'reduction'>('forecasting');

  return (
    <div className="space-y-6">
      {/* MODULE TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('forecasting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'forecasting' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Time-Series Forecasting
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'anomalies' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> AI Anomalies Queue
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ocr' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Utility Invoice OCR
        </button>

        <button
          onClick={() => setActiveTab('whatif')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'whatif' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> What-If Lever Simulator
        </button>

        <button
          onClick={() => setActiveTab('sensitivity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sensitivity' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Monte Carlo Sensitivity
        </button>

        <button
          onClick={() => setActiveTab('reduction')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reduction' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" /> MACC Reduction Planning
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'forecasting' && <ForecastingView />}
      {activeTab === 'anomalies' && <AnomaliesQueueView />}
      {activeTab === 'ocr' && <DocumentOCRView />}
      {activeTab === 'whatif' && <WhatIfBuilderView />}
      {activeTab === 'sensitivity' && <SensitivityView />}
      {activeTab === 'reduction' && <ReductionPlanningView />}
    </div>
  );
};
