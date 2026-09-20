import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ressortissantApi,
  ApiError,
  getRessortissantToken,
  setRessortissantToken,
} from '../../lib/ressortissantApi';

export interface RessortissantUser {
  id: number;
  numero_registre: string | null;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  photo: string | null;
  ville: string | null;
  quartier: string | null;
  statut: 'actif' | 'inactif' | 'suspendu';
  inscription_verifiee: boolean;
  derniere_connexion: string | null;
}

interface AuthResponse {
  ressortissant: RessortissantUser;
  token: string;
}

interface RessortissantAuthContextValue {
  ressortissant: RessortissantUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  inscrire: (donnees: Record<string, unknown>) => Promise<string>;
  verifierEmail: (token: string) => Promise<void>;
  renvoyerVerification: (email: string) => Promise<string>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  motDePasseOublie: (email: string) => Promise<string>;
  reinitialiserMotDePasse: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RessortissantAuthContext = createContext<RessortissantAuthContextValue | undefined>(undefined);

export function RessortissantAuthProvider({ children }: { children: React.ReactNode }) {
  const [ressortissant, setRessortissant] = useState<RessortissantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getRessortissantToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await ressortissantApi.get<{ ressortissant: RessortissantUser }>('/v1/ressortissant/auth/me');
      setRessortissant(data.ressortissant);
    } catch {
      setRessortissantToken(null);
      setRessortissant(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const inscrire = useCallback(async (donnees: Record<string, unknown>) => {
    const data = await ressortissantApi.post<{ message: string }>('/v1/ressortissant/auth/inscrire', donnees);
    return data.message;
  }, []);

  const verifierEmail = useCallback(async (token: string) => {
    const data = await ressortissantApi.post<AuthResponse>('/v1/ressortissant/auth/verifier-email', { token });
    setRessortissantToken(data.token);
    setRessortissant(data.ressortissant);
  }, []);

  const renvoyerVerification = useCallback(async (email: string) => {
    const data = await ressortissantApi.post<{ message: string }>('/v1/ressortissant/auth/renvoyer-verification', { email });
    return data.message;
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const data = await ressortissantApi.post<AuthResponse>('/v1/ressortissant/auth/login', {
      email,
      password,
      remember,
    });
    setRessortissantToken(data.token);
    setRessortissant(data.ressortissant);
  }, []);

  const motDePasseOublie = useCallback(async (email: string) => {
    const data = await ressortissantApi.post<{ message: string }>('/v1/ressortissant/auth/mot-de-passe-oublie', { email });
    return data.message;
  }, []);

  const reinitialiserMotDePasse = useCallback(
    async (token: string, password: string, passwordConfirmation: string) => {
      await ressortissantApi.post('/v1/ressortissant/auth/reinitialiser-mot-de-passe', {
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await ressortissantApi.post('/v1/ressortissant/auth/logout');
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    } finally {
      setRessortissantToken(null);
      setRessortissant(null);
    }
  }, []);

  return (
    <RessortissantAuthContext.Provider
      value={{
        ressortissant,
        isLoading,
        isAuthenticated: !!ressortissant,
        inscrire,
        verifierEmail,
        renvoyerVerification,
        login,
        motDePasseOublie,
        reinitialiserMotDePasse,
        logout,
        refresh: loadMe,
      }}
    >
      {children}
    </RessortissantAuthContext.Provider>
  );
}

export function useRessortissantAuth() {
  const ctx = useContext(RessortissantAuthContext);
  if (!ctx) throw new Error('useRessortissantAuth doit être utilisé dans un RessortissantAuthProvider');
  return ctx;
}
