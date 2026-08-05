import { create } from 'zustand';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

// Checks persistent storage (remembered sessions) first, then session-only storage
// (kept only for the current browser tab/window, cleared on close).
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

function persistToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    Cookies.set(TOKEN_KEY, token, { expires: 7 });
  } else {
    // No `expires` -> session cookie, cleared when the browser closes.
    sessionStorage.setItem(TOKEN_KEY, token);
    Cookies.set(TOKEN_KEY, token);
  }
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  Cookies.remove(TOKEN_KEY);
}

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
  setAuth: (user: User, token: string, remember?: boolean) => void;
  // Restores an already-persisted session (e.g. on page load) without re-writing storage,
  // so a session-only login isn't silently upgraded to a remembered one.
  hydrate: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: false,

  setAuth: (user, token, remember = true) => {
    persistToken(token, remember);
    set({ user, token, isAuthenticated: true });
  },

  hydrate: (user, token) => {
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    clearStoredToken();
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
