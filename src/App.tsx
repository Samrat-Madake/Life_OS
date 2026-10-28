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
import { QuotesView } from "./views/QuotesView";

export function NavIcon({ id, size = 18 }: { id: View; size?: number }) {
  switch (id) {
    case "overview":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "tasks":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "habits":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
        </svg>
      );
    case "finance":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2.5" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="16" cy="15" r="1.5" fill="currentColor" />
        </svg>
      );
    case "focus":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "calendar":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "goals":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    case "quotes":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      );
    default:
      return <span>◍</span>;
  }
}

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
          width: collapsed ? 68 : 240,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          background: "var(--bg-soft)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 20,
          overflow: "hidden"
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: "var(--topbar-h)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "0" : "0 14px",
            borderBottom: "1px solid var(--border)"
          }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "linear-gradient(135deg, #7c6cff, #5eead4)",
                display: "grid",
                placeItems: "center",
                color: "white",
                fontWeight: 900,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(124, 108, 255, 0.3)",
                transition: "transform 0.15s"
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              L
            </button>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "linear-gradient(135deg, #7c6cff, #5eead4)",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontWeight: 900,
                    fontSize: 14,
                    boxShadow: "0 3px 10px rgba(124, 108, 255, 0.3)"
                  }}
                >
                  L
                </div>
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>LifeOS</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>Command Center</div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 7,
                  color: "var(--text-muted)",
                  fontSize: 18,
                  lineHeight: 1
                }}
              >
                ‹
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            padding: collapsed ? "12px 6px" : "12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flex: 1,
            overflowY: "auto"
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text-faint)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "4px 10px 6px"
              }}
            >
              Workspace
            </div>
          )}

          {nav.map(n => {
            const isActive = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setView(n.id);
                  setMobileOpen(false);
                }}
                title={collapsed ? n.label : undefined}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  borderRadius: 9,
                  border: "none",
                  background: isActive ? "rgba(124, 108, 255, 0.12)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13.5,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-elev)";
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                {/* Active indicator bar on left when unfolded */}
                {isActive && !collapsed && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 7,
                      bottom: 7,
                      width: 3.5,
                      borderRadius: "0 4px 4px 0",
                      background: "var(--accent)"
                    }}
                  />
                )}

                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: isActive ? "var(--accent)" : "currentColor",
                    transition: "transform 0.15s"
                  }}
                >
                  <NavIcon id={n.id} size={18} />
                </span>

                {!collapsed && (
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.label}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Search Shortcut Pill */}
          {!collapsed && (
            <button
              onClick={() => setPalette(true)}
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 9,
                border: "1px dashed var(--border-strong)",
                background: "var(--bg-elev)",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔍</span>
                <span>Search</span>
              </div>
              <span className="kbd" style={{ fontSize: 10 }}>Ctrl K</span>
            </button>
          )}
        </nav>

        {/* Footer Account Section */}
        <div
          style={{
            padding: collapsed ? "10px 6px" : "12px 12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            background: "var(--bg-soft)"
          }}
        >
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "4px 0" : "8px 10px",
                borderRadius: 10,
                background: collapsed ? "transparent" : "var(--bg-elev)",
                justifyContent: collapsed ? "center" : "flex-start",
                border: collapsed ? "none" : "1px solid var(--border)"
              }}
            >
              {/* Avatar Initial with Status Dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12.5,
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(124, 108, 255, 0.3)"
                  }}
                  title={collapsed ? `${user.name} (${user.email})` : undefined}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: syncError ? "var(--danger)" : "var(--success)",
                    border: "1.5px solid var(--bg-soft)"
                  }}
                />
              </div>

              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text)"
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: syncError ? "var(--danger)" : isSyncing ? "var(--accent)" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {isSyncing ? "Syncing…" : syncError ? "Offline" : "Cloud Synced"}
                  </div>
                </div>
              )}

              {!collapsed && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    logout();
                    addToast("Signed out");
                  }}
                  title="Sign out"
                  style={{
                    padding: "4px 6px",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    borderRadius: 6
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              style={{ justifyContent: "center", width: "100%", fontSize: 12 }}
              onClick={() => setShowAuthModal(true)}
              title="Sign In / Register"
            >
              ☁ {!collapsed && "Sign In"}
            </button>
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
          {view === "quotes" && <QuotesView q={q} onToast={addToast} />}
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
                          width: 28,
                          height: 28,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 8,
                          background: isActive ? "rgba(124, 108, 255, 0.15)" : "var(--bg-elev2)",
                          color: isActive ? "var(--accent)" : "var(--text-muted)",
                          fontSize: 13
                        }}
                      >
                        <NavIcon id={n.id} size={18} />
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
                    color: isActive ? "var(--accent)" : "currentColor"
                  }}
                >
                  <NavIcon id={item.id} size={16} />
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
              color: ["focus", "calendar", "goals", "quotes"].includes(view) || mobileOpen ? "var(--accent)" : "var(--text-muted)",
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
                background: ["focus", "calendar", "goals", "quotes"].includes(view) || mobileOpen ? "rgba(124, 108, 255, 0.15)" : "transparent",
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
