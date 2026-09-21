// Client HTTP léger pour l'API Consulat (Laravel + Sanctum, auth par token Bearer).
// L'URL de base vient de VITE_API_URL (voir .env.example). En dev, elle pointe
// généralement vers http://localhost:8000/api.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api';
const TOKEN_KEY = 'consulat_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // 401 = token expiré/invalide : on nettoie la session locale.
  if (res.status === 401) {
    setToken(null);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = await res.json();
  } catch {
    // réponse non-JSON (ex: CSV export) — laissé à l'appelant
  }

  if (!res.ok) {
    throw new ApiError(
      body?.message || `Erreur ${res.status}`,
      res.status,
      body?.errors
    );
  }

  return (body?.data ?? (body as unknown)) as T;
}

// Téléchargement de fichier (export CSV, etc.) — la réponse n'est pas du JSON,
// donc on bypasse `request()` et on déclenche directement le téléchargement
// dans le navigateur à partir du blob reçu.
export async function downloadFile(path: string, filenameFallback = 'export.csv') {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // pas de corps JSON (ex: erreur serveur brute) — on garde le message par défaut
    }
    throw new ApiError(message, res.status);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || filenameFallback;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Ouverture d'un fichier privé (pièce d'un dossier) dans un nouvel onglet.
// Même contrainte que downloadFile : un <a href> classique n'enverrait pas
// le Bearer token, donc on récupère le blob nous-mêmes puis on l'ouvre.
export async function openFile(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // pas de corps JSON — on garde le message par défaut
    }
    throw new ApiError(message, res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Révocation différée : le nouvel onglet a besoin du temps de charger le
  // blob avant qu'on lui retire son URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const api = {
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
  patch: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
  // Laravel ne parse pas le multipart en PUT natif : on POST avec un champ
  // _method pour le "method spoofing", nécessaire dès qu'un fichier (photo) est envoyé.
  postForm: <T,>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') => {
    if (method === 'PUT') formData.append('_method', 'PUT');
    return request<T>(path, { method: 'POST', body: formData });
  },
};