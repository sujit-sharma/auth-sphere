import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '../api/client';
import type { AuthUser } from '../api/types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (...permissions: string[]) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(clear);
    // Restore the session from the httpOnly refresh cookie on page load.
    let cancelled = false;
    (async () => {
      if (await refreshAccessToken()) {
        try {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        } catch {
          /* fall through to logged-out */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clear]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const session = await authApi.login(email, password);
        setAccessToken(session.accessToken);
        setUser(session.user);
      },
      logout: async () => {
        await authApi.logout().catch(() => {});
        clear();
      },
      logoutAll: async () => {
        await authApi.logoutAll().catch(() => {});
        clear();
      },
      refreshUser: async () => setUser(await authApi.me()),
      hasPermission: (...p) => !!user && p.every((x) => user.permissions.includes(x)),
      hasRole: (...r) => !!user && r.some((x) => user.roles.includes(x)),
    }),
    [user, loading, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
