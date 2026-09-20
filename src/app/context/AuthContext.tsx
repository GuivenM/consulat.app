import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError, getToken, setToken } from '../../lib/api';

export type AdminRole = 'super_admin' | 'admin' | 'moderateur' | 'tresorier' | 'agent';

export interface AdminUser {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  role: AdminRole;
  role_label: string;
  photo: string | null;
  initiales: string;
  telephone: string | null;
}

interface LoginResponse {
  user: AdminUser;
  token: string;
  permissions: Record<string, unknown>;
}

interface AuthContextValue {
  user: AdminUser | null;
  permissions: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  activerCompte: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  motDePasseOublie: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  hasRole: (...roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.get<{ user: AdminUser; permissions: Record<string, unknown> }>(
        '/v1/auth/me'
      );
      setUser(data.user);
      setPermissions(data.permissions);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password, remember });
    setToken(data.token);
    setUser(data.user);
    setPermissions(data.permissions);
  }, []);

  const activerCompte = useCallback(
    async (token: string, password: string, passwordConfirmation: string) => {
      const data = await api.post<LoginResponse>('/auth/activer-compte-admin', {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setToken(data.token);
      setUser(data.user);
      setPermissions(data.permissions);
    },
    []
  );

  const motDePasseOublie = useCallback(async (email: string) => {
    const data = await api.post<{ message: string }>('/auth/mot-de-passe-oublie', { email });
    return data.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/v1/auth/logout');
    } catch (e) {
      // même si l'appel échoue (token déjà invalide), on nettoie la session locale
      if (!(e instanceof ApiError)) throw e;
    } finally {
      setToken(null);
      setUser(null);
      setPermissions(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: AdminRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, permissions, isLoading, isAuthenticated: !!user, login, activerCompte, motDePasseOublie, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
