import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token);
    Cookies.set('auth_token', token, { expires: 7 });
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    Cookies.remove('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  DISPATCHER: 'DISPATCHER',
  DRIVER: 'DRIVER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  OPERATIONS_MANAGER: 'Gerente de Operaciones',
  DISPATCHER: 'Despachador',
  DRIVER: 'Conductor',
  ACCOUNTANT: 'Contaduría',
  VIEWER: 'Visor',
};

export function getRoleBadge(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'badge-purple',
    ADMIN: 'badge-blue',
    OPERATIONS_MANAGER: 'badge-green',
    DISPATCHER: 'badge-yellow',
    DRIVER: 'badge-orange',
    ACCOUNTANT: 'badge-gray',
    VIEWER: 'badge-gray',
  };
  return map[role] || 'badge-gray';
}
