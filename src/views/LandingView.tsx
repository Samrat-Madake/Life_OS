import React, { useState } from "react";
import { useStore } from "../store";

export function LandingView({ onToast }: { onToast: (msg: string) => void }) {
  const { theme, setTheme, login, register } = useStore();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      if (authMode === "login") {
        await login(email, password);
        onToast("Welcome back! Redirecting to dashboard...");
      } else {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name.trim(), email, password);
        onToast("Account created successfully! Welcome to LifeOS.");
      }
    } catch (error: any) {
      setErr(error.message || "Authentication failed. Please check credentials or server connection.");
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setErr(null);
  };

  // Outcrowd / ChronoTask subtle signature canvas dotted pattern
  const dotPattern: React.CSSProperties = {
    backgroundImage: "radial-gradient(var(--border-strong) 1.2px, transparent 1.2px)",
    backgroundSize: "22px 22px"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        padding: "clamp(12px, 3vw, 20px) clamp(10px, 2.5vw, 20px) 48px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* 1. HERO CANVAS SECTION (Reference Image 4) */}
        <div
          className="card"
          style={{
            ...dotPattern,
            borderRadius: 32,
            background: "var(--card)",
            border: "1px solid var(--border)",
            padding: "clamp(18px, 3.5vw, 28px) clamp(16px, 3.5vw, 32px) clamp(36px, 5vw, 56px)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow)"
          }}
        >
          {/* Top Navbar */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 20,
              borderBottom: "1px solid var(--border)",
              position: "relative"
            }}
          >
            {/* Logo with 4-dot brand mark */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 14, height: 14 }}>
                  <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                  <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                  <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                  <div style={{ borderRadius: "50%", background: "var(--success)" }} />
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>LifeOS</span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>
              <a href="#features" style={{ transition: "color .15s" }}>Features</a>
              <a href="#showcase" style={{ transition: "color .15s" }}>Overview</a>
              <a href="#workflow" style={{ transition: "color .15s" }}>Workflow</a>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{ fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "6px 14px" }}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <button
                id="landing-signin-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => openAuth("login")}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                Sign In
              </button>
              <button
                id="landing-getstarted-btn"
                className="btn btn-primary btn-sm"
                onClick={() => openAuth("register")}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "8px 20px",
                  boxShadow: "0 4px 14px rgba(124, 108, 255, 0.35)"
                }}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Header Controls (< 768px) */}
            <div className="mobile-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openAuth("register")}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "6px 14px"
                }}
              >
                Start
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                style={{
                  width: 36,
                  height: 36,
                  padding: 0,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 18 }}>
                  <span style={{ display: "block", height: 2, background: "currentColor", borderRadius: 1, transition: "transform .2s", transform: mobileMenuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                  <span style={{ display: "block", height: 2, background: "currentColor", borderRadius: 1, opacity: mobileMenuOpen ? 0 : 1, transition: "opacity .2s" }} />
                  <span style={{ display: "block", height: 2, background: "currentColor", borderRadius: 1, transition: "transform .2s", transform: mobileMenuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
                </div>
              </button>
            </div>
          </header>

          {/* Mobile Navigation Dropdown (< 768px) */}
          {mobileMenuOpen && (
            <div
              className="mobile-only"
              style={{
                padding: "16px 4px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animation: "pop .18s ease"
              }}
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev2)" }}
              >
                Features
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev2)" }}
              >
                Overview Mockup
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev2)" }}
              >
                Daily Workflow
              </a>
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, fontSize: 13, fontWeight: 600 }}
                  onClick={() => { setMobileMenuOpen(false); openAuth("login"); }}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, fontSize: 12, fontWeight: 600 }}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </div>
          )}

          {/* Central Hero Body */}
          <div
            style={{
              paddingTop: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 2
            }}
          >
            {/* Center 3D Floating Brand Emblem (From Image 4) */}
            {/* <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 22,
                background: "var(--bg-elev)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 18px 36px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.15)",
                display: "grid",
                placeItems: "center",
                marginBottom: 24
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: 26, height: 26 }}>
                <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                <div style={{ borderRadius: "50%", background: "var(--success)" }} />
              </div>
            </div> */}

            {/* Main Two-Tone Headline */}
            <h1
              style={{
                fontSize: "clamp(38px, 5.5vw, 64px)",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.035em",
                maxWidth: 820
              }}
            >
              Think, plan, and track<br />
              <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>all in one place</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(15px, 2vw, 17px)",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                maxWidth: 580,
                marginTop: 18
              }}
            >
              A clean, unified operating system designed to manage tasks, build consistent habits, and track personal finances without distraction.
            </p>

            {/* Hero CTA Button */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                id="hero-register-btn"
                className="btn btn-primary"
                onClick={() => openAuth("register")}
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "12px 34px",
                  boxShadow: "0 8px 24px rgba(124, 108, 255, 0.4)"
                }}
              >
                Get Started Free
              </button>
              <button
                id="hero-signin-btn"
                className="btn"
                onClick={() => openAuth("login")}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 999,
                  padding: "12px 28px",
                  background: "var(--bg-elev2)"
                }}
              >
                Sign In
              </button>
            </div>

            {/* Client-Side Encryption Trust Pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--text-faint)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
              <span>Client-Side Encrypted (AES-256-GCM) • Zero-Knowledge Architecture</span>
            </div>
          </div>

          {/* Floating Showcase Cards Surrounding the Hero (Recreated from Image 4) */}
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              gap: 16,
              position: "relative",
              zIndex: 2
            }}
          >
            {/* Top-Left Style Floating Card: Daily Focus Note */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: 20,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.06em" }}>
                  Daily Priority Note
                </span>
                {/* Mini floating 3D badge */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: "var(--accent)",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    boxShadow: "0 4px 10px rgba(124, 108, 255, 0.4)"
                  }}
                >
                  ✓
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
                Focus on high-leverage execution. Eliminate cognitive friction and accomplish more with clarity.
              </p>
            </div>

            {/* Top-Right Style Floating Card: Schedule & Reminder */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: 20,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  Upcoming Priority
                </span>
                <span className="badge" style={{ fontSize: 10, background: "rgba(124, 108, 255, 0.15)", color: "var(--accent)" }}>
                  Due Today
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Review Monthly Budget & Investments</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Time: 14:00 - 15:30</div>
            </div>

            {/* Bottom-Left Style Floating Card: Tasks with Progress */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: 20,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  Active Tasks
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>3 / 4 Done</span>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span>Q4 Project Roadmap</span>
                  <span style={{ color: "var(--accent)" }}>75%</span>
                </div>
                <div className="progress-track" style={{ marginTop: 6, height: 6 }}>
                  <div className="progress-fill" style={{ width: "75%", background: "var(--accent)" }} />
                </div>
              </div>
            </div>

            {/* Bottom-Right Style Floating Card: Habit & Module Tracker */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: 20,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 10
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  Consistency Streak
                </span>
                <span className="badge" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)" }}>
                  14 Days Active
                </span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {[1, 1, 1, 1, 1, 1, 1].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 20,
                      borderRadius: 6,
                      background: d ? "linear-gradient(135deg, var(--accent), var(--accent-2))" : "var(--border)"
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Deep Work & Morning Routine</div>
            </div>
          </div>
        </div>

        {/* 2. SOLVE CHALLENGES & FULL APP DASHBOARD SHOWCASE (Reference Image 2) */}
        <section id="workflow" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, marginTop: 8 }}>
          {/* Section Header */}
          <div style={{ textAlign: "center", maxWidth: 640 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.2
              }}
            >
              Solve your daily workflow challenges
            </h2>
          </div>

          {/* 3-Step Process Line (From Image 2 top) */}
          <div
            style={{
              width: "100%",
              maxWidth: 940,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              gap: 20,
              textAlign: "center"
            }}
          >
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  margin: "0 auto 12px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--accent)"
                }}
              >
                01
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Prioritize with Precision</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Tag tasks with Eisenhower priorities (P1, P2, P3) and break big goals into clear, actionable subtasks.
              </p>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  margin: "0 auto 12px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--accent-2)"
                }}
              >
                02
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Build Lasting Habits</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Track daily routines, maintain streaks, and reinforce momentum through visual consistency heatmaps.
              </p>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  margin: "0 auto 12px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--success)"
                }}
              >
                03
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Gain Financial Clarity</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Monitor monthly savings, track category budgets, and control recurring subscriptions with one click.
              </p>
            </div>
          </div>

          {/* Large Showcase Device Frame with Radiant Brand Gradient (From Image 2) */}
          <div
            id="showcase"
            style={{
              width: "100%",
              borderRadius: 36,
              background: "linear-gradient(135deg, #7c6cff 0%, #5eead4 100%)",
              padding: "clamp(12px, 3vw, 36px)",
              boxShadow: "0 28px 60px rgba(124, 108, 255, 0.25)",
              position: "relative"
            }}
          >
            {/* Floating 3D Badge on Left Border (From Image 2) */}
            <div
              className="desktop-only"
              style={{
                position: "absolute",
                top: 40,
                left: -14,
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 20,
                transform: "rotate(-8deg)",
                zIndex: 10
              }}
            >
              26
            </div>

            {/* Floating 3D Badge on Right Border (From Image 2) */}
            <div
              className="desktop-only"
              style={{
                position: "absolute",
                top: 80,
                right: -14,
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #22c55e, #5eead4)",
                color: "#fff",
                boxShadow: "0 14px 28px rgba(34, 197, 94, 0.35)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 20,
                transform: "rotate(6deg)",
                zIndex: 10
              }}
            >
              ✓
            </div>

            {/* The Inner App Dashboard Mockup (ChronoTask / LifeOS interface) */}
            <div
              style={{
                borderRadius: 24,
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Dashboard Top Header Bar */}
              <div
                style={{
                  height: 54,
                  borderBottom: "1px solid var(--border)",
                  padding: "0 clamp(12px, 2.5vw, 20px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-elev)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, width: 12, height: 12 }}>
                    <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--success)" }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>LifeOS Dashboard</span>
                  <span className="desktop-only" style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>Monday, October 26</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: "rgba(124, 108, 255, 0.15)", color: "var(--accent)", fontWeight: 700 }}>
                    E2EE Encrypted
                  </span>
                  <span className="badge desktop-only" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)" }}>
                    System Synced
                  </span>
                  <span className="badge desktop-only" style={{ background: "var(--bg-elev2)" }}>
                    Workspace Active
                  </span>
                </div>
              </div>

              {/* Mobile Mockup Horizontal Tab Bar (< 768px) */}
              <div
                className="mobile-only"
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-elev)",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  WebkitOverflowScrolling: "touch"
                }}
              >
                {[
                  { name: "Overview", active: true },
                  { name: "Tasks", badge: "12" },
                  { name: "Habits", badge: "7" },
                  { name: "Finance", badge: "₹" },
                  { name: "Goals", badge: "4" },
                  { name: "Focus Timer" }
                ].map(item => (
                  <div
                    key={item.name}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: item.active ? 700 : 500,
                      background: item.active ? "var(--accent)" : "var(--bg-elev2)",
                      color: item.active ? "#fff" : "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0
                    }}
                  >
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          background: item.active ? "rgba(255,255,255,0.25)" : "var(--border)",
                          padding: "1px 6px",
                          borderRadius: 999
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Dashboard Layout: Sidebar + Main Content Grid */}
              <div className="dashboard-mockup-body" style={{ display: "flex", minHeight: 460 }}>
                {/* Mini Sidebar */}
                <div
                  className="desktop-only"
                  style={{
                    width: 180,
                    borderRight: "1px solid var(--border)",
                    padding: "18px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    background: "var(--bg-elev)"
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", padding: "0 8px 4px" }}>
                    Navigation
                  </div>
                  {[
                    { name: "Overview", active: true },
                    { name: "Tasks", badge: "12" },
                    { name: "Habits", badge: "7" },
                    { name: "Finance", badge: "₹" },
                    { name: "Goals", badge: "4" },
                    { name: "Focus Timer" }
                  ].map(item => (
                    <div
                      key={item.name}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: item.active ? 700 : 500,
                        background: item.active ? "var(--bg-elev2)" : "transparent",
                        color: item.active ? "var(--accent)" : "var(--text)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{item.name}</span>
                      {item.badge && (
                        <span style={{ fontSize: 10, background: "var(--border)", padding: "1px 6px", borderRadius: 999 }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dashboard Main Canvas Area */}
                <div style={{ flex: 1, padding: "clamp(14px, 2.5vw, 20px)", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Greeting */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: "clamp(18px, 2.5vw, 20px)", fontWeight: 800 }}>Good morning, Alex</h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Here is your productivity flow for today.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 8, fontSize: 12 }}>
                      New Task
                    </button>
                  </div>

                  {/* Widget Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14 }}>
                    {/* Widget 1: To-do List */}
                    <div style={{ padding: 16, borderRadius: 14, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                        <span>To-do List</span>
                        <span style={{ color: "var(--text-muted)" }}>Today</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--accent)", display: "inline-block" }} />
                          <span>Launch Q4 Product Roadmap</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--accent)", display: "inline-block" }} />
                          <span>Review Monthly Budget & Cash Flow</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid var(--border-strong)", display: "inline-block" }} />
                          <span>Complete 45m Focus Session</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 2: Time Tracker */}
                    <div style={{ padding: 16, borderRadius: 14, background: "var(--bg-elev2)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                        Time Tracker
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent)" }}>
                        04:21:58
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
                        <span className="badge" style={{ background: "var(--accent)", color: "#fff", cursor: "pointer" }}>Running</span>
                        <span className="badge" style={{ background: "var(--border)", cursor: "pointer" }}>Reset</span>
                      </div>
                    </div>

                    {/* Widget 3: Activity Overview */}
                    <div style={{ padding: 16, borderRadius: 14, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Weekly Activity</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Deep Work Hours</span>
                          <span style={{ fontWeight: 700, color: "var(--accent)" }}>29 / 40 hrs</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Tasks Completed</span>
                          <span style={{ fontWeight: 700, color: "var(--success)" }}>8 / 12 tasks</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Habits On Track</span>
                          <span style={{ fontWeight: 700, color: "var(--accent-2)" }}>6 / 7 active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Strip: Financial Subscription Tracker */}
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: "var(--bg-elev2)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Monthly Savings Rate</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--success)" }}>+48.5% (₹41,250 Saved)</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Netflix 4K • ₹649 / mo</span>
                      <span className="badge" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)", fontWeight: 700 }}>
                        Paid This Month
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURE CARDS GRID (Reference Image 1: "Keep everything in one place") */}
        <section id="features" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, marginTop: 24 }}>
          {/* Eyebrow Pill */}
          <div
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              border: "1px solid var(--border-strong)",
              background: "var(--bg-elev2)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.04em"
            }}
          >
            Features
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center", maxWidth: 600 }}>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Keep everything in one place
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-muted)", marginTop: 8 }}>
              Forget complex, fragmented productivity tools.
            </p>
          </div>

          {/* 2x2 Showcase Card Grid (Recreated from Image 1) */}
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
              gap: 20
            }}
          >
            {/* Feature Card 1: Seamless Execution */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "clamp(20px, 3.5vw, 28px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 24
              }}
            >
              {/* Card Visual Preview */}
              <div
                style={{
                  borderRadius: 16,
                  background: "var(--bg-elev2)",
                  padding: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--danger)", fontWeight: 700 }}>
                    P1 Priority
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Due Today</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Ship LifeOS Command Center</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>3 of 4 subtasks completed</div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: "75%", background: "var(--accent)" }} />
                </div>
              </div>

              {/* Text Description */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Seamless Task Execution</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  Organize tasks effortlessly with Eisenhower tagging, subtask checklists, and instant search to execute without friction.
                </p>
              </div>
            </div>

            {/* Feature Card 2: Time Management & Focus (with Donut Workload Ring) */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "clamp(20px, 3.5vw, 28px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 24
              }}
            >
              {/* Card Visual Preview with Bar Chart & Circular Donut Gauge */}
              <div
                style={{
                  borderRadius: 16,
                  background: "var(--bg-elev2)",
                  padding: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Weekly Focus</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>25:00</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Deep Work Session</div>
                </div>

                {/* Bar chart mockup */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 46 }}>
                  <div style={{ width: 12, height: 28, borderRadius: 4, background: "var(--accent-2)" }} />
                  <div style={{ width: 12, height: 44, borderRadius: 4, background: "var(--accent)" }} />
                  <div style={{ width: 12, height: 22, borderRadius: 4, background: "var(--accent-3)" }} />
                </div>

                {/* Donut Workload Ring (from Image 1) */}
                <div style={{ position: "relative", width: 56, height: 56, display: "grid", placeItems: "center" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="28" cy="28" r="22" stroke="var(--border)" strokeWidth="5" fill="none" />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      stroke="var(--warn)"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - 0.75)}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span style={{ position: "absolute", fontSize: 11, fontWeight: 800 }}>75%</span>
                </div>
              </div>

              {/* Text Description */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Time Management Tools</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  Optimize your time with integrated Pomodoro timers, distraction-free audio soundscapes, and daily completion logs.
                </p>
              </div>
            </div>

            {/* Feature Card 3: Smart Finance & Budgets */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "clamp(20px, 3.5vw, 28px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 24
              }}
            >
              {/* Card Visual Preview */}
              <div
                style={{
                  borderRadius: 16,
                  background: "var(--bg-elev2)",
                  padding: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Monthly Savings</div>
                  <span className="badge" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)" }}>+48.5%</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Income: 85,000 • Expenses: 43,750</div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: "52%", background: "var(--success)" }} />
                </div>
              </div>

              {/* Text Description */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Financial Clarity & Subscriptions</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  Monitor cash flow, stay within category spending budgets, and track recurring subscriptions in one glance.
                </p>
              </div>
            </div>

            {/* Feature Card 4: Habit Momentum & Streaks */}
            <div
              className="card"
              style={{
                borderRadius: 24,
                padding: "clamp(20px, 3.5vw, 28px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 24
              }}
            >
              {/* Card Visual Preview */}
              <div
                style={{
                  borderRadius: 16,
                  background: "var(--bg-elev2)",
                  padding: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Morning Run & Routine</div>
                  <span className="badge" style={{ background: "rgba(124, 108, 255, 0.15)", color: "var(--accent)" }}>
                    14 Day Streak
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {[1, 1, 1, 1, 1, 1, 1].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 18,
                        borderRadius: 4,
                        background: d ? "var(--accent)" : "var(--border)"
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Description */}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Habit Streaks & Goals</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  Build lasting personal momentum with multi-day streaks, visual consistency blocks, and milestone checkpoints.
                </p>
              </div>
            </div>

            {/* Feature Card 5: Dedicated Spotlight - Client-Side Encryption */}
            <div
              className="card"
              style={{
                gridColumn: "1 / -1",
                borderRadius: 28,
                padding: "clamp(20px, 3.5vw, 32px)",
                background: "var(--card)",
                border: "1px solid rgba(124, 108, 255, 0.4)",
                boxShadow: "0 20px 48px rgba(124, 108, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: 26,
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Subtle ambient security glow */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 320,
                  height: 320,
                  background: "radial-gradient(circle, rgba(124, 108, 255, 0.14) 0%, transparent 70%)",
                  pointerEvents: "none"
                }}
              />

              {/* Header & Badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                <div style={{ maxWidth: 720 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: "rgba(124, 108, 255, 0.15)",
                        border: "1px solid rgba(124, 108, 255, 0.4)",
                        color: "var(--accent)",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase"
                      }}
                    >
                      Zero-Knowledge Architecture
                    </span>
                    <span
                      className="badge"
                      style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)", fontWeight: 700 }}
                    >
                      AES-256-GCM Active
                    </span>
                  </div>
                  <h3 style={{ fontSize: "clamp(22px, 3.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
                    Client-Side Encryption by Default
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 8 }}>
                    Your personal tasks, habits, and financial records are encrypted directly on your local device before touching the network. Your encryption key is derived locally and never sent to our servers. Only you hold the decryption keys.
                  </p>
                </div>

                {/* Tactile 3D Clay Shield / Key badge */}
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background: "var(--bg-elev2)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 14px 28px rgba(0,0,0,0.14), inset 0 1px 2px rgba(255,255,255,0.2)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    color: "var(--accent)",
                    letterSpacing: "0.04em"
                  }}
                >
                  AES
                </div>
              </div>

              {/* Cryptographic Architecture Flow Preview */}
              <div
                style={{
                  borderRadius: 18,
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  padding: "clamp(14px, 2.5vw, 24px)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                  gap: 16
                }}
              >
                {/* Step 1: Plaintext on Local Device */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    01 • Your Device (Plaintext)
                  </div>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                    <div style={{ color: "var(--text)", fontWeight: 600 }}>"task": "Q4 Roadmap"</div>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>"finance": "₹85,000"</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>Decrypted locally on your machine</div>
                </div>

                {/* Step 2: Client Encryption Engine */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    02 • Client Encryption Engine
                  </div>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(124, 108, 255, 0.08)", border: "1px solid rgba(124, 108, 255, 0.28)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                    <div style={{ color: "var(--accent)", fontWeight: 700 }}>AES-256-GCM + PBKDF2</div>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Key: Never Leaves Device</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Zero-knowledge client handshake</div>
                </div>

                {/* Step 3: Cloud Database Ciphertext */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    03 • Cloud Database (Ciphertext)
                  </div>
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
                    <div style={{ color: "var(--text-faint)" }}>7f9e1a8c04e2...b8d3</div>
                    <div style={{ color: "var(--text-faint)", marginTop: 2 }}>Unreadable to cloud servers</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Zero server-side access to plaintext</div>
                </div>
              </div>

              {/* Security Guarantee Badges */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                  <span>End-to-End Encrypted (E2EE)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                  <span>Zero Server Logs or Telemetry</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
                  <span>Private Keys Kept Locally</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", marginTop: 4 }}>
            and a lot more features...
          </div>
        </section>

        {/* 4. FOOTER CANVAS SECTION (Reference Image 3) */}
        <footer
          className="card"
          style={{
            ...dotPattern,
            borderRadius: 32,
            background: "var(--card)",
            border: "1px solid var(--border)",
            padding: "clamp(24px, 4vw, 48px) clamp(16px, 3.5vw, 36px) 32px",
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 36
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 28
            }}
          >
            {/* Left Brand Col */}
            <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--bg-elev2)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 14, height: 14 }}>
                    <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--success)" }} />
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>LifeOS</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                Stay organized and boost your productivity
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Your private, unified command center for personal growth, daily execution, and financial clarity.
              </p>
            </div>

            {/* Decorative Cluster of 3D Soft Floating Tiles (From Image 3) */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 18,
                  transform: "rotate(-6deg)"
                }}
              >
                26
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow: "0 10px 24px rgba(124, 108, 255, 0.35)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 16,
                  transform: "rotate(4deg)"
                }}
              >
                ✓
              </div>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  color: "var(--accent-2)",
                  transform: "rotate(-4deg)"
                }}
              >
                25m
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "var(--bg-elev2)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--warn)",
                  transform: "rotate(8deg)"
                }}
              >
                ₹
              </div>
            </div>

            {/* Navigation Columns */}
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", fontSize: 13 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: "0.06em" }}>
                  Product
                </span>
                <span style={{ color: "var(--text-muted)" }}>Tasks & Priorities</span>
                <span style={{ color: "var(--text-muted)" }}>Habit Streaks</span>
                <span style={{ color: "var(--text-muted)" }}>Finance Tracker</span>
                <span style={{ color: "var(--text-muted)" }}>Pomodoro Focus</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: "0.06em" }}>
                  Workspace
                </span>
                <button
                  onClick={() => openAuth("login")}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("register")}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                >
                  Create Account
                </button>
                {/* <span style={{ color: "var(--text-muted)" }}>MongoDB Sync</span>
                <span style={{ color: "var(--text-muted)" }}>Security & Privacy</span> */}
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 12,
              color: "var(--text-muted)"
            }}
          >
            <div>© 2026 LifeOS. All rights reserved.</div>
            <div style={{ display: "flex", gap: 16 }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Authentication Modal / Page Overlay */}
      {authMode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthMode(null);
          }}
        >
          <div
            className="card"
            style={{
              width: "min(420px, 100%)",
              padding: "clamp(20px, 4vw, 26px)",
              borderRadius: 24,
              background: "var(--card)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              border: "1px solid var(--border-strong)",
              animation: "pop .16s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "var(--bg-elev2)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 14, height: 14 }}>
                    <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--success)" }} />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 18 }}>
                    {authMode === "login" ? "Welcome back" : "Create your account"}
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {authMode === "login" ? "Sign in to access your dashboard" : "Start your clean LifeOS workspace"}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setAuthMode(null)}
                style={{ fontSize: 12, padding: "4px 8px" }}
              >
                Close
              </button>
            </div>

            {/* Toggle Switch */}
            <div style={{ display: "flex", gap: 6, marginTop: 18, padding: 4, background: "var(--bg-elev2)", borderRadius: 12 }}>
              <button
                id="auth-tab-login"
                type="button"
                className={`btn btn-sm ${authMode === "login" ? "btn-primary" : "btn-ghost"}`}
                style={{ flex: 1, fontWeight: 700, borderRadius: 8 }}
                onClick={() => { setAuthMode("login"); setErr(null); }}
              >
                Sign In
              </button>
              <button
                id="auth-tab-register"
                type="button"
                className={`btn btn-sm ${authMode === "register" ? "btn-primary" : "btn-ghost"}`}
                style={{ flex: 1, fontWeight: 700, borderRadius: 8 }}
                onClick={() => { setAuthMode("register"); setErr(null); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
              {authMode === "register" && (
                <label style={{ fontSize: 12, fontWeight: 600 }}>
                  Full Name
                  <input
                    id="auth-name-input"
                    className="input"
                    type="text"
                    required
                    placeholder="Alex Carter"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus={typeof window !== "undefined" && window.innerWidth > 768}
                  />
                </label>
              )}

              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Email Address
                <input
                  id="auth-email-input"
                  className="input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus={typeof window !== "undefined" && window.innerWidth > 768 && authMode === "login"}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Password
                <input
                  id="auth-password-input"
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
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#ef444418",
                    border: "1px solid #ef444435",
                    color: "var(--danger)",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {err}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAuthMode(null)}
                >
                  Cancel
                </button>
                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                  style={{ fontWeight: 700, padding: "8px 20px", borderRadius: 8 }}
                >
                  {loading
                    ? "Authenticating…"
                    : authMode === "login"
                      ? "Sign In"
                      : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
