import React, { useState, useEffect } from 'react';
import { Building2, Layers, Factory, Users, Shield, Plus, Check, MapPin, Tag } from 'lucide-react';
import apiClient from '../../core/api/client';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orgs' | 'entities' | 'facilities' | 'users' | 'roles'>('orgs');
  
  // Data states
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Modals
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Form Inputs
  const [orgForm, setOrgForm] = useState({ name: '', code: '', country: 'USA', currency: 'USD' });
  const [entityForm, setEntityForm] = useState({ name: '', code: '', org_id: '', parent_entity_id: '', country: 'USA', equity_share_pct: 100 });
  const [facilityForm, setFacilityForm] = useState({ name: '', code: '', org_id: '', entity_id: '', facility_type: 'Manufacturing', city: '', country: 'USA' });
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', org_id: '', role_id: '', entity_ids: [] as string[], facility_ids: [] as string[] });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/organizations').catch(() => ({ data: [] })),
      apiClient.get('/admin/entities').catch(() => ({ data: [] })),
      apiClient.get('/admin/facilities').catch(() => ({ data: [] })),
      apiClient.get('/admin/users').catch(() => ({ data: [] })),
      apiClient.get('/admin/roles').catch(() => ({ data: [] })),
    ]).then(([orgRes, entRes, facRes, userRes, roleRes]) => {
      setOrganizations(orgRes.data || []);
      setEntities(entRes.data || []);
      setFacilities(facRes.data || []);
      setUsers(userRes.data || []);
      setRoles(roleRes.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/organizations', orgForm);
      setShowOrgModal(false);
      setOrgForm({ name: '', code: '', country: 'USA', currency: 'USD' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating organization');
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/entities', entityForm);
      setShowEntityModal(false);
      setEntityForm({ name: '', code: '', org_id: '', parent_entity_id: '', country: 'USA', equity_share_pct: 100 });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating entity');
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/facilities', facilityForm);
      setShowFacilityModal(false);
      setFacilityForm({ name: '', code: '', org_id: '', entity_id: '', facility_type: 'Manufacturing', city: '', country: 'USA' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating facility');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/users', userForm);
      setShowUserModal(false);
      setUserForm({ email: '', password: '', full_name: '', org_id: '', role_id: '', entity_ids: [], facility_ids: [] });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Administration Console</h1>
          <p className="text-slate-400 text-sm">Manage Multi-Tenant Organizations, Entities, Facilities, Roles, and User Scoping</p>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('orgs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'orgs' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Orgs
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'entities' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Entities
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'facilities' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" /> Facilities
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'roles' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> RBAC Roles
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. ORGANIZATIONS TAB */}
      {activeTab === 'orgs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Organizations ({organizations.length})</h2>
            <button
              onClick={() => setShowOrgModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add Organization
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{org.name}</h3>
                      <p className="text-xs text-slate-400">Code: <span className="text-emerald-400 font-mono">{org.code}</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Country: <strong className="text-slate-200">{org.country}</strong></span>
                  <span>Currency: <strong className="text-slate-200">{org.currency}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ENTITIES TAB */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Legal Entities ({entities.length})</h2>
            <button
              onClick={() => {
                if (organizations.length > 0) setEntityForm({ ...entityForm, org_id: organizations[0].id });
                setShowEntityModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add Entity
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entities.map((ent) => (
              <div key={ent.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{ent.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{ent.code}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <p>Legal Structure: <strong className="text-slate-200">{ent.legal_structure || 'LLC'}</strong></p>
                  <p>Equity Share: <strong className="text-slate-200">{ent.equity_share_pct}%</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FACILITIES TAB */}
      {activeTab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Physical Facilities ({facilities.length})</h2>
            <button
              onClick={() => {
                if (organizations.length > 0 && entities.length > 0) {
                  setFacilityForm({ ...facilityForm, org_id: organizations[0].id, entity_id: entities[0].id });
                }
                setShowFacilityModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add Facility
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facilities.map((fac) => (
              <div key={fac.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{fac.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{fac.code}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {fac.facility_type}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {fac.city}, {fac.country}</p>
                  <p>Floor Area: <strong className="text-slate-200">{fac.gross_floor_area_sqm ? `${fac.gross_floor_area_sqm} sqm` : 'N/A'}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Users & Access Scoping ({users.length})</h2>
            <button
              onClick={() => {
                if (organizations.length > 0 && roles.length > 0) {
                  setUserForm({ ...userForm, org_id: organizations[0].id, role_id: roles[0].id });
                }
                setShowUserModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Facility Scoping</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <p className="font-semibold text-slate-100">{u.full_name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u.role || 'SuperAdmin'}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {u.facility_ids && u.facility_ids.length > 0 ? (
                        <span className="text-amber-400 font-mono">Scoped ({u.facility_ids.length} Facility)</span>
                      ) : (
                        <span className="text-slate-400">All Facilities (Org-Wide)</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">System RBAC Roles ({roles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="glass-card p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{r.name}</h3>
                    <p className="text-xs text-emerald-400">System Defined Role</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Organization</h3>
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <input
                type="text"
                placeholder="Organization Name (e.g. Global Decarb Corp)"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Organization Code (e.g. GLOBAL_DECARB)"
                value={orgForm.code}
                onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowOrgModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEntityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Legal Entity</h3>
            <form onSubmit={handleCreateEntity} className="space-y-3">
              <select
                value={entityForm.org_id}
                onChange={(e) => setEntityForm({ ...entityForm, org_id: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Entity Name (e.g. North America Operations)"
                value={entityForm.name}
                onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Entity Code (e.g. NA_OPS)"
                value={entityForm.code}
                onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEntityModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Entity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFacilityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Facility</h3>
            <form onSubmit={handleCreateFacility} className="space-y-3">
              <select
                value={facilityForm.entity_id}
                onChange={(e) => setFacilityForm({ ...facilityForm, entity_id: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              >
                {entities.map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Facility Name (e.g. Texas Clean Tech Plant)"
                value={facilityForm.name}
                onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Facility Code (e.g. FAC_TEXAS)"
                value={facilityForm.code}
                onChange={(e) => setFacilityForm({ ...facilityForm, code: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="City (e.g. Austin)"
                value={facilityForm.city}
                onChange={(e) => setFacilityForm({ ...facilityForm, city: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowFacilityModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Scoped User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              />
              <select
                value={userForm.role_id}
                onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Scope to Specific Facility (Optional)</label>
                <select
                  multiple
                  value={userForm.facility_ids}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                    setUserForm({ ...userForm, facility_ids: opts });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 h-24"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>{fac.name} ({fac.code})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple facilities</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
