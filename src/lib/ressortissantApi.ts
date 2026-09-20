// Client HTTP pour l'espace consulaire (ressortissants). Séparé de lib/api.ts
// (admin) et lib/memberApi.ts (espace membre AJDCB) : Ressortissant est un
// modèle Sanctum à part entière, avec son propre token — les trois espaces
// peuvent coexister dans le même navigateur sans se déconnecter l'un l'autre.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api';
const TOKEN_KEY = 'consulat_ressortissant_token';

export function getRessortissantToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setRessortissantToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  email_non_verifie?: boolean;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getRessortissantToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setRessortissantToken(null);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = await res.json();
  } catch {
    // réponse non-JSON — laissé à l'appelant
  }

  if (!res.ok) {
    const error = new ApiError(body?.message || `Erreur ${res.status}`, res.status, body?.errors);
    // Cas particulier de RessortissantAuthController::login : 403 avec un
    // indicateur dédié pour proposer le renvoi de l'email de vérification
    // plutôt qu'un simple message d'erreur.
    (error as ApiError & { emailNonVerifie?: boolean }).emailNonVerifie = body?.email_non_verifie;
    throw error;
  }

  return (body?.data ?? (body as unknown)) as T;
}

export const ressortissantApi = {
  get: <T,>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  postForm: <T,>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};
