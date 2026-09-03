import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Factory, 
  Package, 
  Users, 
  Sparkles, 
  TrendingDown, 
  FileCheck, 
  Coins, 
  ShieldCheck, 
  FileSearch, 
  Database, 
  Settings, 
  LogOut, 
  Building2, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTenantStore } from '../store/tenantStore';
import apiClient from '../api/client';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Carbon Accounting', path: '/carbon', icon: Factory },
  { name: 'Products & LCA', path: '/products', icon: Package },
  { name: 'Suppliers & Scope 3', path: '/suppliers', icon: Users },
  { name: 'AI Analytics', path: '/ai-analytics', icon: Sparkles },
  { name: 'Reduction Planning', path: '/reduction-planning', icon: TrendingDown },
  { name: 'Compliance', path: '/compliance', icon: FileCheck },
  { name: 'Carbon Finance', path: '/carbon-finance', icon: Coins },
  { name: 'Data Quality', path: '/data-quality', icon: ShieldCheck },
  { name: 'Evidence / Audit', path: '/evidence-audit', icon: FileSearch },
  { name: 'Integrations', path: '/integrations', icon: Database },
  { name: 'Administration', path: '/admin', icon: Settings },
];

export const Shell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    organizations, 
    entities, 
    selectedOrgId, 
    selectedEntityId, 
    setOrganizations, 
    setEntities, 
    setSelectedOrgId, 
    setSelectedEntityId 
  } = useTenantStore();

  useEffect(() => {
    // Fetch Organizations & Entities for top switcher
    apiClient.get('/admin/organizations')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setOrganizations(res.data);
          if (!selectedOrgId) setSelectedOrgId(res.data[0].id);
        }
      })
      .catch(() => {});

    apiClient.get('/admin/entities')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setEntities(res.data);
          if (!selectedEntityId) setSelectedEntityId(res.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0B0F17] overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col z-20">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg glow-emerald">
            DX
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-lg leading-tight tracking-tight">Nexgile</h1>
            <p className="text-xs text-emerald-400 font-medium">DecarbX Platform</p>
          </div>
        </div>

        {/* NAV ROUTE LINKS */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || 'SuperAdmin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR WITH ORG & ENTITY SWITCHER */}
        <header className="h-16 glass-panel border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {/* Organization Selector */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Org:</span>
              <select
                value={selectedOrgId || ''}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Selector */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Entity:</span>
              <select
                value={selectedEntityId || ''}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Entities</option>
                {entities.map((ent) => (
                  <option key={ent.id} value={ent.id} className="bg-slate-900 text-slate-200">
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Lineage Engine Active
            </span>
          </div>
        </header>

        {/* ROUTE CONTENT PAGE */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0F17]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
