import React, { useState, useEffect } from 'react';
import { ChevronRight, Building2, Factory, Layers, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/client';

interface BreadcrumbItem {
  level: string;
  id?: string;
  name: string;
}

export const OperationalDrillDownView: React.FC = () => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 'COMPANY', name: 'Acme International Corp' }
  ]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLevel = (level: string, id?: string) => {
    setLoading(true);
    const params: any = { parent_level: level };
    if (id) params.parent_id = id;

    apiClient.get('/dashboards/drilldown', { params })
      .then((res: any) => {
        setNodes(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLevel('COMPANY');
  }, []);

  const handleNodeClick = (node: any) => {
    if (!node.has_children) return;
    const newCrumbs = [...breadcrumbs, { level: node.level, id: node.id, name: node.name }];
    setBreadcrumbs(newCrumbs);
    fetchLevel(node.level, node.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newCrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newCrumbs);
    const target = newCrumbs[newCrumbs.length - 1];
    fetchLevel(target.level, target.id);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Hierarchical Multi-Tier Analytics
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Operational Multi-Tier Drill-Down</h1>
        <p className="text-slate-400 text-sm">Navigate from corporate entity down to individual facility meters and data points with quality assurance badges</p>
      </div>

      {/* INTERACTIVE BREADCRUMBS */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center flex-wrap gap-2 text-xs">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
            <button
              onClick={() => handleBreadcrumbClick(idx)}
              className={`font-semibold transition-all hover:text-teal-300 ${
                idx === breadcrumbs.length - 1 ? 'text-teal-400 font-bold underline' : 'text-slate-400'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* DRILLDOWN NODES LIST */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" /> Current Hierarchy Level: {breadcrumbs[breadcrumbs.length - 1].level}
          </h2>
          <span className="text-xs text-slate-400">Click a node to drill down into child tiers</span>
        </div>

        <div className="space-y-3">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`p-4 bg-slate-900/80 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                node.has_children ? 'hover:border-teal-500/50 cursor-pointer border-slate-800' : 'border-slate-800/80 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  {node.level === 'ENTITY' && <Building2 className="w-5 h-5" />}
                  {node.level === 'FACILITY' && <Factory className="w-5 h-5" />}
                  {node.level === 'DEPARTMENT' && <Layers className="w-5 h-5" />}
                  {node.level === 'COST_CENTER' && <Database className="w-5 h-5" />}
                  {node.level === 'DATA_POINT' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{node.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-300 border border-slate-700 uppercase">
                      {node.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data Quality Score: <strong className="text-emerald-400">{Math.round(node.quality_score * 100)}%</strong> | Confidence: <strong className="text-teal-400">{Math.round(node.confidence_score * 100)}%</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Footprint</p>
                  <p className="text-base font-bold font-mono text-emerald-400">{node.total_co2e_t} tCO2e</p>
                </div>

                {node.has_children && (
                  <span className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>
          ))}

          {nodes.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No deeper child nodes found at this tier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
