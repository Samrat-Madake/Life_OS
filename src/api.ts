import type { AppState, AuthUser } from "./models";

const API_BASE = "http://localhost:5000/api";

export function getToken(): string | null {
  return localStorage.getItem("lifeos:token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("lifeos:token", token);
  else localStorage.removeItem("lifeos:token");
}

export const api = {
  async register(name: string, email: string, password: string, initialData?: AppState) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, initialData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data as { token: string; user: AuthUser };
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data as { token: string; user: AuthUser };
  },

  async getMe(): Promise<{ user: AuthUser } | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setToken(null);
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
      const res = await fetch(`${API_BASE}/data/state`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async syncCloudState(state: AppState): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/data/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(state)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
