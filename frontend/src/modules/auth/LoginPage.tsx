import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import apiClient from '../../core/api/client';
import { useAuthStore } from '../../core/store/authStore';

const DEMO_ROLES = [
  { label: 'SuperAdmin (Platform Admin)', email: 'admin@nexgile.com', role: 'SuperAdmin' },
  { label: 'Chief Sustainability Officer (CSO)', email: 'cso@nexgile.com', role: 'CSO' },
  { label: 'Sustainability Analyst', email: 'analyst@nexgile.com', role: 'SustainabilityAnalyst' },
  { label: 'Facility Manager (Austin Plant)', email: 'facility@nexgile.com', role: 'FacilityManager' },
  { label: 'Procurement Manager (Scope 3)', email: 'procurement@nexgile.com', role: 'ProcurementUser' },
  { label: 'Finance Director (Carbon Budgets)', email: 'finance@nexgile.com', role: 'FinanceUser' },
  { label: 'External Vendor / Supplier', email: 'supplier@nexgile.com', role: 'Supplier' },
  { label: 'Independent External Auditor', email: 'auditor@nexgile.com', role: 'Auditor' },
  { label: 'Decarb Strategy Consultant', email: 'consultant@nexgile.com', role: 'Consultant' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@nexgile.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [selectedRole, setSelectedRole] = useState('SuperAdmin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRoleSelect = (roleEmail: string, roleName: string) => {
    setEmail(roleEmail);
    setPassword('AdminPass123!');
    setSelectedRole(roleName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await apiClient.post('/admin/auth/login', { email, password });
      if (res.data && res.data.access_token) {
        setAuth(res.data.access_token, res.data.user);
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Ensure backend server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F17] p-4 relative overflow-hidden">
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-2xl mx-auto mb-3 shadow-lg glow-emerald">
            DX
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Nexgile DecarbX</h2>
          <p className="text-sm text-slate-400 mt-1">Environmental Intelligence & Governance Platform</p>
        </div>

        {/* DEMO PERSONA QUICK SELECTOR */}
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-2">
            <UserCheck className="w-4 h-4" />
            <span>Select Demo User Persona:</span>
          </div>
          <select
            value={email}
            onChange={(e) => {
              const matched = DEMO_ROLES.find(r => r.email === e.target.value);
              if (matched) handleRoleSelect(matched.email, matched.role);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
          >
            {DEMO_ROLES.map((r) => (
              <option key={r.role} value={r.email}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="admin@nexgile.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Audit-grade Lineage & Multi-Tenant Scoped Security</span>
        </div>
      </div>
    </div>
  );
};

