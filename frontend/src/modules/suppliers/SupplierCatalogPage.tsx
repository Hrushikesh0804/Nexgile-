import React, { useState, useEffect } from 'react';
import { Users, Plus, CheckCircle2, Award, FileSearch, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';

export const SupplierCatalogPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    code: '',
    contact_email: '',
    country: 'United States',
    tier: 'Tier 1',
    category: 'Raw Materials'
  });

  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchCatalogData = () => {
    Promise.all([
      apiClient.get('/suppliers').catch(() => ({ data: [] })),
      apiClient.get('/suppliers/submissions').catch(() => ({ data: [] })),
    ]).then(([supRes, subRes]) => {
      setSuppliers(supRes.data || []);
      setSubmissions(subRes.data || []);
    });
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const handleInviteSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/suppliers', inviteForm);
      setShowInviteModal(false);
      setInviteForm({ name: '', code: '', contact_email: '', country: 'United States', tier: 'Tier 1', category: 'Raw Materials' });
      fetchCatalogData();
    } catch (err: any) {
      alert(err.message || 'Error inviting supplier');
    }
  };

  const handleValidateSubmission = async (subId: string) => {
    setValidatingId(subId);
    try {
      await apiClient.post(`/suppliers/submissions/${subId}/validate`);
      setValidatingId(null);
      fetchCatalogData();
    } catch (err: any) {
      setValidatingId(null);
      alert(err.message || 'Validation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Scope 3 Supply Chain Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Supplier Catalog & Carbon Scorecards</h1>
          <p className="text-slate-400 text-sm">Vendor onboarding, GHG disclosure validation, and maturity scorecards</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Invite Vendor
        </button>
      </div>

      {/* SUPPLIERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {s.tier}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{s.country}</span>
              </div>

              <h3 className="font-bold text-slate-100 text-base">{s.name}</h3>
              <p className="text-xs text-slate-400">Category: <strong className="text-slate-200">{s.category}</strong></p>
              <p className="text-[10px] font-mono text-slate-500">{s.contact_email}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {s.status}
              </span>
              <span className="text-xs font-semibold text-slate-300">Scorecard Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* PENDING SUBMISSIONS FOR ADMIN VALIDATION */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4 p-5">
        <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pending GHG Submissions for Validation ({submissions.length})
        </h2>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Submission ID</th>
              <th className="p-4">Completeness</th>
              <th className="p-4">Data Confidence</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-800/30">
                <td className="p-4 font-mono text-xs text-slate-200">{sub.id.substring(0, 8)}...</td>
                <td className="p-4 font-bold text-emerald-400">{sub.completeness_score}%</td>
                <td className="p-4 font-bold text-teal-400">{sub.confidence_score}%</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.validation_status === 'VALIDATED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                    {sub.validation_status}
                  </span>
                </td>
                <td className="p-4">
                  {sub.validation_status !== 'VALIDATED' ? (
                    <button
                      onClick={() => handleValidateSubmission(sub.id)}
                      disabled={validatingId === sub.id}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50"
                    >
                      {validatingId === sub.id ? 'Validating...' : 'Validate Submission'}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INVITE SUPPLIER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Invite Vendor / Supplier</h3>
            <form onSubmit={handleInviteSupplier} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Eco-Materials Corp"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Vendor Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUP-ACME-001"
                  value={inviteForm.code}
                  onChange={(e) => setInviteForm({ ...inviteForm, code: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Email (Onboarding User)</label>
                <input
                  type="email"
                  placeholder="supplier@acme.com"
                  value={inviteForm.contact_email}
                  onChange={(e) => setInviteForm({ ...inviteForm, contact_email: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={inviteForm.country}
                    onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Supplier Tier</label>
                  <select
                    value={inviteForm.tier}
                    onChange={(e) => setInviteForm({ ...inviteForm, tier: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
