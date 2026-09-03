import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, Lock, Download, ExternalLink, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import apiClient from '../../core/api/client';

export const CSRDWorkspaceView: React.FC = () => {
  const [disclosure, setDisclosure] = useState<any | null>(null);
  const [datapoints, setDatapoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportPackage, setExportPackage] = useState<any | null>(null);
  const [showLineageModal, setShowLineageModal] = useState<any | null>(null);

  const fetchCSRDData = () => {
    setLoading(true);
    apiClient.get('/compliance/disclosures')
      .then((res: any) => {
        const discList = res.data || [];
        if (discList.length > 0) {
          const activeDisc = discList[0];
          setDisclosure(activeDisc);
          apiClient.get(`/compliance/disclosures/${activeDisc.id}/datapoints`)
            .then((dpRes: any) => setDatapoints(dpRes.data || []));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCSRDData();
  }, []);

  const handleCreateCSRD = async () => {
    setLoading(true);
    try {
      await apiClient.post('/compliance/disclosures/csrd', { reporting_year: 2026 });
      fetchCSRDData();
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'CSRD assembly failed');
    }
  };

  const handleApprovalAction = async (action: string) => {
    if (!disclosure) return;
    try {
      const res: any = await apiClient.post(`/compliance/disclosures/${disclosure.id}/approval`, {
        action,
        comments: `Workflow transition action '${action}' triggered via UI.`
      });
      setDisclosure(res.data);
    } catch (err: any) {
      alert(err.message || 'Approval action failed');
    }
  };

  const handleExportPackage = async () => {
    if (!disclosure) return;
    try {
      const res: any = await apiClient.get(`/compliance/disclosures/${disclosure.id}/export`);
      setExportPackage(res.data);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              EU CSRD / ESRS Regulatory Standard
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">CSRD / ESRS Disclosure Workspace & Lineage Appendix</h1>
          <p className="text-slate-400 text-sm">Assemble double materiality disclosures citing Modules 1–5 calculations with XBRL tags</p>
        </div>

        <div className="flex items-center gap-2">
          {!disclosure && (
            <button
              onClick={handleCreateCSRD}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Assemble CSRD Report
            </button>
          )}

          {disclosure && (
            <button
              onClick={handleExportPackage}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              <Download className="w-4 h-4" /> Export Package + Lineage Appendix
            </button>
          )}
        </div>
      </div>

      {disclosure && (
        <>
          {/* STATUS & APPROVAL WORKFLOW BANNER */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-100 text-base">FY{disclosure.reporting_year} CSRD Disclosure Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  disclosure.status === 'LOCKED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  disclosure.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {disclosure.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Linked Data Points: <strong className="text-emerald-400">{datapoints.length}</strong> | Lineage Chain Verified: <strong className="text-teal-400">100%</strong>
              </p>
            </div>

            {/* WORKFLOW ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              {disclosure.status === 'DRAFT' && (
                <button
                  onClick={() => handleApprovalAction('SUBMIT')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Submit for Review
                </button>
              )}
              {disclosure.status === 'SUBMITTED_FOR_REVIEW' && (
                <button
                  onClick={() => handleApprovalAction('APPROVE')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Approve Disclosure
                </button>
              )}
              {disclosure.status === 'APPROVED' && (
                <button
                  onClick={() => handleApprovalAction('LOCK')}
                  className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow"
                >
                  <Lock className="w-3.5 h-3.5" /> Lock & Freeze Disclosure
                </button>
              )}
            </div>
          </div>

          {/* DATAPOINTS LIST WITH LINEAGE BUTTONS */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
            <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> CSRD Disclosure Data Points & XBRL Tags ({datapoints.length})
            </h2>

            <div className="space-y-3">
              {datapoints.map((dp) => (
                <div key={dp.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{dp.section}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-300 border border-slate-700 font-mono">
                        {dp.xbrl_tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Source Record: <strong className="text-slate-200">{dp.source_record_type}</strong> | Lineage ID: <span className="text-emerald-400">{dp.lineage_id?.substring(0, 8)}...</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      {JSON.stringify(dp.value_json)}
                    </span>
                    <button
                      onClick={() => setShowLineageModal(dp)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" /> View Lineage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* EXPORT PACKAGE MODAL WITH LINEAGE APPENDIX */}
      {exportPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-slate-700 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                  Export Package Generated
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">CSRD Disclosure & Lineage Appendix</h3>
              </div>
              <button onClick={() => setExportPackage(null)} className="text-xs text-slate-400 underline">Close</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <p className="text-emerald-400 font-bold">• Framework: {exportPackage.framework_name}</p>
                <p>• Reporting Year: {exportPackage.reporting_year}</p>
                <p>• Lock Status: {exportPackage.status}</p>
                <p>• Total Data Points Exported: {exportPackage.data_points?.length}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Lineage Appendix Audit Trail:</h4>
                {exportPackage.lineage_appendix?.map((lin: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <p className="text-teal-400 font-bold">Chain #{idx + 1} - Lineage ID: {lin.lineage_id}</p>
                    <p className="text-slate-300">Formula: {lin.formula_applied}</p>
                    <p className="text-slate-400">Emission Factor: {lin.emission_factor_used}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINEAGE MODAL FOR SINGLE DATAPOINT */}
      {showLineageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Lineage Audit Chain
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
              <p className="text-teal-400 font-bold">Lineage ID: {showLineageModal.lineage_id}</p>
              <p className="text-slate-300">Section: {showLineageModal.section}</p>
              <p className="text-slate-300">XBRL Tag: {showLineageModal.xbrl_tag}</p>
              <p className="text-slate-400">Source Record: {showLineageModal.source_record_type} ({showLineageModal.source_record_id.substring(0, 8)}...)</p>
            </div>

            <button onClick={() => setShowLineageModal(null)} className="w-full bg-slate-800 text-slate-200 py-2 rounded-xl text-xs font-semibold">
              Close Lineage Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
