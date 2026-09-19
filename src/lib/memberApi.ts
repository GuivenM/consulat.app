// Client HTTP pour l'espace membre (Laravel + Sanctum, auth par token
// Bearer). Volontairement séparé de lib/api.ts : les deux espaces (admin et
// membre) ont chacun leur propre token Sanctum, et un même navigateur peut
// en théorie porter les deux en même temps — une clé localStorage partagée
// ferait que se connecter à l'un déconnecterait l'autre.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api';
const TOKEN_KEY = 'consulat_membre_token';

export function getMembreToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setMembreToken(token: string | null) {
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
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getMembreToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // 401 = token expiré/invalide : on nettoie la session locale membre
  // uniquement (ne touche pas au token admin, qui vit dans une autre clé).
  if (res.status === 401) {
    setMembreToken(null);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = await res.json();
  } catch {
    // réponse non-JSON — laissé à l'appelant
  }

  if (!res.ok) {
    throw new ApiError(body?.message || `Erreur ${res.status}`, res.status, body?.errors);
  }

  return (body?.data ?? (body as unknown)) as T;
}

export const membreApi = {
  get: <T,>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  put: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
  // Laravel ne parse pas le multipart en PUT natif : on POST avec un champ
  // _method pour le "method spoofing", nécessaire dès qu'une photo est envoyée.
  postForm: <T,>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') => {
    if (method === 'PUT') formData.append('_method', 'PUT');
    return request<T>(path, { method: 'POST', body: formData });
  },
};
