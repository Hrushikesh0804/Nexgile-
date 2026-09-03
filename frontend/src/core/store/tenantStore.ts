import { create } from 'zustand';

export interface OrganizationOption {
  id: string;
  name: string;
  code: string;
}

export interface EntityOption {
  id: string;
  name: string;
  code: string;
}

interface TenantState {
  organizations: OrganizationOption[];
  entities: EntityOption[];
  selectedOrgId: string | null;
  selectedEntityId: string | null;
  setOrganizations: (orgs: OrganizationOption[]) => void;
  setEntities: (entities: EntityOption[]) => void;
  setSelectedOrgId: (orgId: string | null) => void;
  setSelectedEntityId: (entityId: string | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  organizations: [],
  entities: [],
  selectedOrgId: null,
  selectedEntityId: null,
  setOrganizations: (organizations) => set({ organizations }),
  setEntities: (entities) => set({ entities }),
  setSelectedOrgId: (selectedOrgId) => set({ selectedOrgId }),
  setSelectedEntityId: (selectedEntityId) => set({ selectedEntityId }),
}));
