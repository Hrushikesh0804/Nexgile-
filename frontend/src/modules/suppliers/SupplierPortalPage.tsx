import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, CheckCircle2, FileText, Upload, LogOut, ArrowRight } from 'lucide-react';
import apiClient from '../../core/api/client';
import { useAuthStore } from '../../core/store/authStore';

export const SupplierPortalPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any | null>(null);

  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({
    scope1_co2e: 45.0,
    scope2_co2e: 28.5,
    renewable_pct: 35.0
  });

  const [evidenceName, setEvidenceName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const fetchPortalData = () => {
    apiClient.get('/suppliers/questionnaires')
      .then((res: any) => {
        setQuestionnaires(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedQuestionnaire(res.data[0]);
        }
      })
      .catch(() => {});

    apiClient.get('/suppliers/submissions')
      .then((res: any) => setSubmissions(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionnaire) return;

    setSubmitting(true);
    try {
      await apiClient.post('/suppliers/submissions', {
        questionnaire_id: selectedQuestionnaire.id,
        answers: formAnswers,
        evidence_attachments: evidenceName ? [{ file_name: evidenceName, uploaded_at: new Date().toISOString() }] : []
      });
      setSubmitting(false);
      setSubmittedNotice(true);
      fetchPortalData();
    } catch (err: any) {
      setSubmitting(false);
      alert(err.message || 'Submission failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* RESTRICTED SUPPLIER PORTAL TOP HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg">
            DX
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">DecarbX Supplier Portal</h1>
            <p className="text-xs text-slate-400">Restricted External Vendor Interface | Authenticated as <strong className="text-emerald-400">{user?.full_name}</strong></p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      {/* PORTAL MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {submittedNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Thank you! Your Scope 3 GHG Disclosure response has been submitted and sent to admin for validation.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT SIDEBAR: ACTIVE QUESTIONNAIRE CAMPAIGNS */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Disclosure Campaigns
            </h2>

            <div className="space-y-2">
              {questionnaires.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionnaire(q)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedQuestionnaire?.id === q.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-xs text-slate-100">{q.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Status: <span className="text-emerald-400 font-bold">{q.status}</span></p>
                </button>
              ))}
            </div>
          </div>

          {/* MAIN FORM: GUIDED MULTI-STEP QUESTIONNAIRE FLOW */}
          <div className="md:col-span-2 space-y-6">
            {selectedQuestionnaire ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Questionnaire Response
                  </span>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">{selectedQuestionnaire.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedQuestionnaire.description}</p>
                </div>

                <form onSubmit={handleSubmitQuestionnaire} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Scope 1 Direct GHG Emissions (tCO2e) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formAnswers.scope1_co2e}
                      onChange={(e) => setFormAnswers({ ...formAnswers, scope1_co2e: parseFloat(e.target.value) })}
                      required
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Scope 2 Location-Based Energy Emissions (tCO2e) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formAnswers.scope2_co2e}
                      onChange={(e) => setFormAnswers({ ...formAnswers, scope2_co2e: parseFloat(e.target.value) })}
                      required
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      % Electricity Sourced from Renewable Energy
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formAnswers.renewable_pct}
                      onChange={(e) => setFormAnswers({ ...formAnswers, renewable_pct: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Third-Party Audit Certificate / ISO Verification Document *
                    </label>
                    <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>{evidenceName || 'Attach Third-Party Audit Evidence (PDF)'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEvidenceName("ISO_14064_Audit_Certificate_2025.pdf")}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700"
                      >
                        {evidenceName ? 'Attached' : 'Browse File'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Submitting...' : 'Submit Disclosure Package'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
                No active questionnaires available for your vendor profile.
              </div>
            )}

            {/* PREVIOUS SUBMISSION HISTORY */}
            {submissions.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Your Submitted History ({submissions.length})</h3>
                <div className="space-y-2">
                  {submissions.map((s) => (
                    <div key={s.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">Submission ID: {s.id.substring(0, 8)}...</p>
                        <p className="text-[10px] text-slate-500">{new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.validation_status} ({s.completeness_score}% Score)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
