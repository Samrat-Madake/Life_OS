import type { AppState, AuthUser } from "./models";

const API_BASE = "http://localhost:5000/api";

export function getToken(): string | null {
  return localStorage.getItem("lifeos:token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("lifeos:token", token);
  else localStorage.removeItem("lifeos:token");
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export const api = {
  async register(name: string, email: string, password: string) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    }, 6000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data as { token: string; user: AuthUser };
  },

  async login(email: string, password: string) {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }, 6000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data as { token: string; user: AuthUser };
  },

  async getMe(): Promise<{ user: AuthUser } | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }, 3000);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) setToken(null);
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async fetchCloudState(): Promise<AppState | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/data/state`, {
        headers: { Authorization: `Bearer ${token}` }
      }, 3000);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) setToken(null);
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async syncCloudState(state: AppState): Promise<{ ok: boolean; error?: string }> {
    const token = getToken();
    if (!token) return { ok: false, error: "Not authenticated" };
    try {
      const res = await fetchWithTimeout(`${API_BASE}/data/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(state)
      });
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          return { ok: false, error: "Unauthorized (Session expired). Please sign in again." };
        }
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.message || `Server error (${res.status})` };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Network unreachable" };
    }
  }
};
