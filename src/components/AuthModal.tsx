import React, { useState } from "react";
import { useStore } from "../store";

export function AuthModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const { login, register } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onToast("Logged in successfully! Synced with MongoDB Cloud.");
      } else {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name.trim(), email, password);
        onToast("Account created! Welcome to your clean workspace.");
      }
      onClose();
    } catch (error: any) {
      setErr(error.message || "Authentication failed. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 70,
        padding: 16
      }}
    >
      <div className="card" style={{ width: "min(440px, 100%)", padding: 20, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 18 }}>
              {mode === "login" ? "Sign In to LifeOS" : "Create Cloud Account"}
            </h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {mode === "login"
                ? "Access your encrypted productivity workspace"
                : "Zero-Knowledge encrypted backup to MongoDB Atlas"}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            className={`btn ${mode === "login" ? "btn-primary" : ""}`}
            style={{ flex: 1 }}
            onClick={() => { setMode("login"); setErr(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn ${mode === "register" ? "btn-primary" : ""}`}
            style={{ flex: 1 }}
            onClick={() => { setMode("register"); setErr(null); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {mode === "register" && (
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Full Name
              <input
                className="input"
                type="text"
                required
                placeholder="e.g., Alex Carter"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>
          )}

          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Email Address
            <input
              className="input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Password
            <input
              className="input"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          {err && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "#ef444418", border: "1px solid #ef444430", color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>
              {err}
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, background: "rgba(124, 108, 255, 0.08)", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(124, 108, 255, 0.15)" }}>
            <span>🔒</span>
            <span><strong>End-to-End Encrypted:</strong> Not even MongoDB admins can read your data.</span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Connecting…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
