import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_active: bool;
  is_superadmin: boolean;
  default_org_id?: string;
  role?: string;
  entity_ids: string[];
  facility_ids: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth: (token: string, user: UserProfile) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
