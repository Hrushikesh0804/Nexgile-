import React, { useState } from 'react';
import { Download, Upload, Clock, FileText, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/client';

export const BulkOperationsPage: React.FC = () => {
  const [exportType, setExportType] = useState('EVIDENCE_PACK');
  const [downloadInfo, setDownloadInfo] = useState<any | null>(null);

  const handleExport = async () => {
    try {
      const res: any = await apiClient.post('/hardening/bulk/export', { export_type: exportType });
      setDownloadInfo(res.data);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  const handleScheduleReport = async () => {
    try {
      await apiClient.post('/hardening/bulk/schedule', {
        report_name: 'Monthly CSRD Audit Package',
        report_type: 'CSRD_PACKAGE',
        cron_expression: '0 0 1 * *',
        recipients_json: ['sustainability@nexgile.com', 'auditor@big4.com'],
        export_format: 'PDF'
      });
      alert('Scheduled report registered & task wired via WorkflowService!');
    } catch (err: any) {
      alert(err.message || 'Schedule failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Bulk Import/Export & Scheduled Jobs
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Bulk Operations & Automated Reports</h1>
        <p className="text-slate-400 text-sm">Bulk export evidence packages, PCF exchange files, and schedule monthly automated email exports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BULK EXPORT CARD */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" /> Bulk Export Package Generator
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Export Package Type</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="EVIDENCE_PACK">Full Auditor Evidence Pack (JSON / ZIP)</option>
                <option value="PCF_EXCHANGE">PCF Product Carbon Footprints (CSV / JSON)</option>
                <option value="DISCLOSURE_TABLES">CSRD / ESRS Disclosure Tables (Excel / PDF)</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-semibold shadow transition-all"
            >
              <Download className="w-4 h-4" /> Generate Export Package
            </button>

            {downloadInfo && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <p className="text-emerald-400 font-bold">• Export Package Ready!</p>
                <p className="text-slate-300">Format: {downloadInfo.export_format} | Count: {downloadInfo.item_count} items</p>
                <a href="#" onClick={(e) => { e.preventDefault(); alert(`Downloading ${downloadInfo.export_type}...`); }} className="text-blue-400 underline font-sans font-semibold">
                  Download File ({downloadInfo.export_type.toLowerCase()}.json)
                </a>
              </div>
            )}
          </div>
        </div>

        {/* SCHEDULED REPORT CARD */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" /> Scheduled Automated Reports
          </h3>

          <div className="space-y-3 text-xs">
            <p className="text-slate-400">Schedule monthly automated email exports wired directly to Module 0 WorkflowService</p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
              <p className="text-purple-300 font-bold">Monthly CSRD Audit Package</p>
              <p className="text-slate-400">Cron: 0 0 1 * * (1st of month)</p>
              <p className="text-slate-400">Recipients: sustainability@nexgile.com, auditor@big4.com</p>
            </div>

            <button
              onClick={handleScheduleReport}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-semibold shadow transition-all"
            >
              <Clock className="w-4 h-4" /> Register Cron Schedule via WorkflowService
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
