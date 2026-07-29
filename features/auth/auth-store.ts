import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser, PermissionKey } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
  
  // Actions
  setAuth: (user: AuthUser, token?: string) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  hasRole: (roleName: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isDarkMode: false,

      setAuth: (user, token) => {
        set({
          user,
          token: token || 'mock-jwt-token-session',
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      toggleDarkMode: () => {
        const nextMode = !get().isDarkMode;
        set({ isDarkMode: nextMode });
        if (typeof document !== 'undefined') {
          if (nextMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      hasPermission: (permission: PermissionKey) => {
        const user = get().user;
        if (!user) return false;
        // Super Admin / IT/MIS has all permissions
        if (user.roleId === 'role_superadmin' || user.roleName?.includes('Super Admin') || user.roleName?.includes('IT/MIS')) return true;
        return user.permissions ? user.permissions.includes(permission) : false;
      },

      hasRole: (roleName: string) => {
        const user = get().user;
        if (!user) return false;
        const target = roleName.toLowerCase();
        const current = (user.roleName || '').toLowerCase();
        const id = (user.roleId || '').toLowerCase();

        if (target.includes('superadmin') || target.includes('it') || target.includes('mis')) {
          return id === 'role_superadmin' || current.includes('super admin') || current.includes('it/mis');
        }
        if (target.includes('supervisor') || target.includes('regional director') || target.includes('director')) {
          return id === 'role_supervisor' || current.includes('supervisor') || current.includes('regional director');
        }
        if (target.includes('admin') || target.includes('hr') || target.includes('administrative unit')) {
          return id === 'role_hradmin' || id === 'role_superadmin' || current.includes('admin') || current.includes('administrative unit');
        }
        if (target.includes('employee') || target.includes('staff')) {
          return id === 'role_employee' || current.includes('employee') || current.includes('staff');
        }
        return current === target || id === target;
      },
    }),
    {
      name: 'philfida-auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : ({} as Storage))),
    }
  )
);
