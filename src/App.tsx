import { useEffect, useState } from "react";
import { useStore } from "./store";
import { uid } from "./utils";
import { nav, type View } from "./components/constants";
import { CommandPalette } from "./components/CommandPalette";
import { AuthModal } from "./components/AuthModal";
import { OverviewView } from "./views/OverviewView";
import { TasksView } from "./views/TasksView";
import { HabitsView } from "./views/HabitsView";
import { FinanceView } from "./views/FinanceView";
import { FocusStudio } from "./views/FocusStudio";
import { CalendarView } from "./views/CalendarView";
import { GoalsView } from "./views/GoalsView";
import { LandingView } from "./views/LandingView";

export default function App() {
  const { theme, setTheme, state, user, authLoading, logout, isSyncing, syncError } = useStore();
  const [view, setView] = useState<View>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [q, setQ] = useState("");
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = uid();
    setToasts(a => [...a, { id, message }]);
    setTimeout(() => setToasts(a => a.filter(x => x.id !== id)), 2500);
  };

  // keyboard palette
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(v => !v);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // mobile auto collapse
  useEffect(() => {
    const m = window.matchMedia("(max-width: 900px)");
    const apply = () => setCollapsed(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  // Auth Loading Screen while checking token
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "linear-gradient(135deg, #7c6cff, #5eead4)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 900,
              fontSize: 22,
              boxShadow: "0 8px 24px rgba(124, 108, 255, 0.4)",
              animation: "pop .4s ease infinite alternate"
            }}
          >
            L
          </div>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>LifeOS</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  // Auth Guard: Unauthenticated visitors see the Landing Page & Login/Register flow
  if (!user) {
    return (
      <>
        <LandingView onToast={addToast} />
        {/* Toast Notifications */}
        {toasts.map((t, i) => (
          <div
            key={t.id}
            role="status"
            className="lifeos-toast"
            style={{
              bottom: 16 + i * 52
            }}
          >
            {t.message}
          </div>
        ))}
      </>
    );
  }

  // Authenticated Dashboard: Full Workspace Available
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop Sidebar (Hidden on mobile via CSS) */}
      <aside
        aria-label="Sidebar"
        className={`desktop-sidebar ${collapsed ? "collapsed" : ""}`}
        style={{
          width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-w)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          background: "var(--bg-soft)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width .2s ease",
          zIndex: 20,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "var(--topbar-h)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "0 14px" : "0 16px",
            borderBottom: "1px solid var(--border)"
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg,#7c6cff,#5eead4)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 14
            }}
          >
            L
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -.02 + "em" }}>LifeOS</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Personal Command Center</div>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" aria-label="Toggle sidebar" onClick={() => setCollapsed(v => !v)}>
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </div>

        <nav style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" }}>
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => { setView(n.id); setMobileOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 12px" : "10px 12px",
                borderRadius: 10,
                border: "1px solid " + (view === n.id ? "var(--border-strong)" : "transparent"),
                background: view === n.id ? "var(--bg-elev2)" : "transparent",
                color: view === n.id ? "var(--text)" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 7,
                  background: view === n.id ? "var(--accent)" : "var(--bg-elev2)",
                  color: view === n.id ? "white" : "var(--text-muted)",
                  fontSize: 12
                }}
              >
                {n.icon}
              </span>
              {!collapsed && <span>{n.label}</span>}
              {!collapsed && view === n.id && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 99, background: "var(--accent)" }} />}
            </button>
          ))}
          {!collapsed && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: 12 }}>Pro tip</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                Press <span className="kbd">Ctrl</span> + <span className="kbd">K</span> to jump anywhere instantly.
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10, width: "100%" }} onClick={() => setPalette(true)}>
                Open palette
              </button>
            </div>
          )}
        </nav>

        <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          {!collapsed && <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 700, letterSpacing: .06 + "em" }}>ACCOUNT & CLOUD</div>}
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: collapsed ? "6px 0" : "8px 10px",
                borderRadius: 8,
                background: "var(--bg-elev)",
                justifyContent: collapsed ? "center" : "flex-start"
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 10, color: isSyncing ? "var(--accent)" : syncError ? "#ef4444" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    {isSyncing ? "● Encrypting & Syncing..." : syncError ? "⚠ Offline" : "Synced"}
                  </div>
                </div>
              )}
              {!collapsed && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { logout(); addToast("Signed out"); }}
                  title="Sign out"
                  style={{ padding: "2px 6px", fontSize: 11 }}
                >
                  🚪
                </button>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
              onClick={() => setShowAuthModal(true)}
              title="Sign In / Register"
            >
              ☁ {!collapsed && "Sign In / Sync"}
            </button>
          )}

          {!collapsed && (
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {user ? `Cloud: ${user.email}` : "v1.0 • Local-first"} • {state.tasks.length} tasks
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Adaptive Topbar */}
        <header
          style={{
            height: "var(--topbar-h)",
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--topbar-bg)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "0 16px"
          }}
        >
          {/* Left: Mobile hamburger + Current View Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              className="btn btn-ghost mobile-only"
              style={{ padding: "6px 8px", fontSize: 16 }}
              aria-label="Open navigation drawer"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              {nav.find(n => n.id === view)?.label}
            </div>
            <span className="badge desktop-only" style={{ background: "var(--bg-elev2)", color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            {user && (
              <span
                className="badge desktop-only"
                style={{
                  background: isSyncing
                    ? "rgba(99, 102, 241, 0.2)"
                    : syncError
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(16, 185, 129, 0.15)",
                  color: isSyncing ? "var(--accent)" : syncError ? "#ef4444" : "#10b981",
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
                title={syncError || (isSyncing ? "Syncing..." : "Saved to MongoDB Cloud")}
              >
                <span>{isSyncing ? "↻" : syncError ? "⚠" : "✅"}</span>
                <span>{isSyncing ? "Syncing..." : syncError ? "Offline" : "Synced"}</span>
              </span>
            )}
          </div>

          {/* Desktop Header Controls */}
          <div className="desktop-header-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn" onClick={() => setPalette(true)} style={{ gap: 8 }}>
              <span style={{ opacity: .7 }}>⌘</span> Search <span className="kbd">Ctrl K</span>
            </button>
            <div style={{ position: "relative" }}>
              <input className="input" placeholder="Quick filter…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 180 }} aria-label="Quick filter" />
              {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 6, top: 6 }} className="btn btn-ghost btn-sm">✕</button>}
            </div>
            <button className="btn" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            {user ? (
              <button
                className="btn btn-sm"
                onClick={() => { logout(); addToast("Signed out"); }}
                title={`Signed in as ${user.name} (${user.email}). Click to sign out.`}
                style={{ gap: 6 }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAuthModal(true)}
                style={{ gap: 6 }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Header Controls */}
          <div className="mobile-header-controls" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPalette(true)}
              title="Search"
              aria-label="Search"
              style={{ padding: "6px 8px", fontSize: 14 }}
            >
              🔍
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              aria-label="Toggle theme"
              style={{ padding: "6px 8px", fontSize: 14 }}
            >
              {theme === "dark" ? "☀" : "◑"}
            </button>
            {user ? (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer"
                }}
                aria-label="Open account drawer"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAuthModal(true)}
                style={{ fontSize: 12, padding: "5px 10px" }}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Content Views */}
        <main className="main-content" style={{ padding: 16, maxWidth: 1280, width: "100%", margin: "0 auto" }}>
          {view === "overview" && <OverviewView q={q} onNav={setView} />}
          {view === "tasks" && <TasksView q={q} onToast={addToast} />}
          {view === "habits" && <HabitsView q={q} onToast={addToast} />}
          {view === "finance" && <FinanceView q={q} />}
          {view === "focus" && <FocusStudio onToast={addToast} />}
          {view === "calendar" && <CalendarView q={q} />}
          {view === "goals" && <GoalsView q={q} />}
        </main>

        {/* Mobile Off-Canvas Slide-Out Drawer */}
        {mobileOpen && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 60
            }}
          >
            <div
              className="mobile-drawer-sheet"
              onClick={e => e.stopPropagation()}
              style={{
                width: "min(320px, 86vw)",
                height: "100%",
                background: "var(--card)",
                borderRight: "1px solid var(--border)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                animation: "drawerSlideIn .22s cubic-bezier(0.16, 1, 0.3, 1)",
                overflowY: "auto"
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, width: 14, height: 14 }}>
                    <div style={{ borderRadius: "50%", background: "var(--accent)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-2)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--accent-3)" }} />
                    <div style={{ borderRadius: "50%", background: "var(--success)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>LifeOS</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Command Center</div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, padding: "4px 8px" }}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Navigation List */}
              <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", padding: "6px 8px" }}>
                  Workspace Views
                </div>
                {nav.map(n => {
                  const isActive = view === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => { setView(n.id); setMobileOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 14px",
                        borderRadius: 10,
                        border: "1px solid " + (isActive ? "var(--border-strong)" : "transparent"),
                        background: isActive ? "var(--bg-elev2)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text)",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 8,
                          background: isActive ? "var(--accent)" : "var(--bg-elev2)",
                          color: isActive ? "white" : "var(--text-muted)",
                          fontSize: 13
                        }}
                      >
                        {n.icon}
                      </span>
                      <span>{n.label}</span>
                      {isActive && (
                        <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                      )}
                    </button>
                  );
                })}

                {/* Quick Search Button in Drawer */}
                <button
                  className="btn"
                  onClick={() => { setMobileOpen(false); setPalette(true); }}
                  style={{ marginTop: 12, justifyContent: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10 }}
                >
                  <span>🔍</span> Quick Search / Palette
                </button>
              </nav>

              {/* Account & Security Section in Drawer */}
              <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12, background: "var(--bg-elev)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase" }}>Theme</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    {theme === "dark" ? "☀ Light Mode" : "◑ Dark Mode"}
                  </button>
                </div>

                {user ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 14,
                          fontWeight: 800
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
                      Client-Side Encrypted (E2EE)
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { logout(); setMobileOpen(false); addToast("Signed out"); }}
                      style={{ justifyContent: "center", marginTop: 4, color: "var(--danger)" }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => { setMobileOpen(false); setShowAuthModal(true); }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Sign In / Sync
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sticky Bottom Navigation Bar */}
        <nav
          className="mobile-bottom-nav"
          aria-label="Mobile Navigation Bar"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(var(--mobile-nav-h, 60px) + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: "var(--topbar-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 40
          }}
        >
          {[
            { id: "overview" as View, label: "Overview", icon: "◍" },
            { id: "tasks" as View, label: "Tasks", icon: "✓" },
            { id: "habits" as View, label: "Habits", icon: "◐" },
            { id: "finance" as View, label: "Finance", icon: "₹" },
          ].map(item => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setMobileOpen(false); }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  height: "100%",
                  background: "transparent",
                  border: "none",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px 0",
                  transition: "color .15s"
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: isActive ? "rgba(124, 108, 255, 0.15)" : "transparent",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    fontWeight: 800
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
              </button>
            );
          })}
          {/* More trigger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              height: "100%",
              background: "transparent",
              border: "none",
              color: ["focus", "calendar", "goals"].includes(view) || mobileOpen ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              padding: "6px 0",
              transition: "color .15s"
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: ["focus", "calendar", "goals"].includes(view) || mobileOpen ? "rgba(124, 108, 255, 0.15)" : "transparent",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                fontWeight: 800
              }}
            >
              ☰
            </span>
            <span style={{ fontSize: 10, fontWeight: ["focus", "calendar", "goals"].includes(view) || mobileOpen ? 800 : 600 }}>More</span>
          </button>
        </nav>

        {/* Command palette */}
        {palette && <CommandPalette onClose={() => setPalette(false)} onNav={(v) => { setView(v as View); setPalette(false); }} />}

        {/* Authentication Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onToast={addToast}
          />
        )}

        {/* Toasts */}
        {toasts.map((t, i) => (
          <div
            key={t.id}
            role="status"
            className="lifeos-toast"
            style={{
              bottom: "calc(var(--mobile-nav-h, 60px) + 16px + " + (i * 52) + "px)"
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
