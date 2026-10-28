import type { AppState, AuthUser, QuoteItem, QuoteCardStyle } from "./models";
import {
  generateSalt,
  deriveKeyFromPassword,
  setCurrentKey,
  getCurrentKey,
  clearCurrentKey,
  encryptState,
  decryptState
} from "./utils/crypto";

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith("/api") ? rawApiUrl.replace(/\/$/, "") : `${rawApiUrl.replace(/\/$/, "")}/api`)
  : "http://localhost:5000/api";

export function getToken(): string | null {
  return localStorage.getItem("lifeos:token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("lifeos:token", token);
  else {
    localStorage.removeItem("lifeos:token");
    clearCurrentKey();
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
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
    // 1. Generate client-side salt and derive encryption key
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(password, salt);
    await setCurrentKey(key);

    // 2. Register with backend (providing salt so it can be restored on future logins)
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, encryptionSalt: salt })
    }, 25000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data as { token: string; user: AuthUser };
  },

  async login(email: string, password: string) {
    // 1. Authenticate with server
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }, 25000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    // 2. Derive encryption key using user's salt and password
    const user = data.user as AuthUser;
    const salt = user.encryptionSalt || email; // fallback to email if legacy
    const key = await deriveKeyFromPassword(password, salt);
    await setCurrentKey(key);

    return data as { token: string; user: AuthUser };
  },

  async getMe(): Promise<{ user: AuthUser } | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }, 10000);
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
      }, 15000);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status === 404) setToken(null);
        return null;
      }
      const data = await res.json();

      // Check if server returned an encrypted vault payload
      if (data && data.encryptedPayload && data.iv) {
        const key = await getCurrentKey();
        if (!key) {
          console.warn("[E2EE] Encrypted cloud data received, but local session encryption key is missing.");
          return null;
        }
        try {
          return await decryptState(data.encryptedPayload, data.iv, key);
        } catch (decryptErr) {
          console.error("[E2EE] Failed to decrypt state payload:", decryptErr);
          throw new Error("Failed to decrypt cloud data. Check your credentials.");
        }
      }

      // Legacy unencrypted response fallback
      return data as AppState;
    } catch (err) {
      console.error("[CloudFetch] Error fetching state:", err);
      return null;
    }
  },

  async syncCloudState(state: AppState): Promise<{ ok: boolean; error?: string }> {
    const token = getToken();
    if (!token) return { ok: false, error: "Not authenticated" };

    try {
      let bodyData: any;
      const key = await getCurrentKey();

      if (key) {
        // Zero-Knowledge Encrypted State Vault: Encrypt before sending over the wire
        const { encryptedPayload, iv } = await encryptState(state, key);
        bodyData = { encryptedPayload, iv, version: 1 };
      } else {
        // Fallback for unencrypted legacy sessions
        bodyData = state;
      }

      const res = await fetchWithTimeout(`${API_BASE}/data/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      }, 15000);

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
  },

  async checkHealth(): Promise<{ ok: boolean; dbConnected: boolean; message: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 15000);
      if (!res.ok) return { ok: false, dbConnected: false, message: `Status ${res.status}` };
      const data = await res.json();
      return {
        ok: data.status === "ok",
        dbConnected: data.dbState === "connected",
        message: data.status === "ok" ? "Online" : "Starting..."
      };
    } catch (err: any) {
      return { ok: false, dbConnected: false, message: err?.message || "Offline" };
    }
  },

  async getQuotes(category?: string, search?: string): Promise<QuoteItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (search && search.trim()) params.append("search", search.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      
      const res = await fetchWithTimeout(`${API_BASE}/quotes${queryStr}`, {}, 12000);
      if (!res.ok) throw new Error("Failed to load quotes");
      return (await res.json()) as QuoteItem[];
    } catch (err) {
      console.error("[Quotes] Fetch error:", err);
      return [];
    }
  },

  async createQuote(payload: {
    text: string;
    author?: string;
    category?: string;
    cardStyle?: QuoteCardStyle;
  }): Promise<QuoteItem> {
    const res = await fetchWithTimeout(`${API_BASE}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 15000);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to post quote");
    return data as QuoteItem;
  },

  async deleteQuote(id: string): Promise<boolean> {
    const res = await fetchWithTimeout(`${API_BASE}/quotes/${id}`, {
      method: "DELETE"
    }, 15000);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to delete quote");
    }
    return true;
  }
};
