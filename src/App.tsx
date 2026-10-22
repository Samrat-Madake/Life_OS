import { useEffect, useState } from "react";
import { useStore } from "./store";
import { uid } from "./utils";
import { nav, type View } from "./components/constants";
import { CommandPalette } from "./components/CommandPalette";
import { OverviewView } from "./views/OverviewView";
import { TasksView } from "./views/TasksView";
import { HabitsView } from "./views/HabitsView";
import { FinanceView } from "./views/FinanceView";
import { FocusStudio } from "./views/FocusStudio";
import { CalendarView } from "./views/CalendarView";
import { GoalsView } from "./views/GoalsView";

export default function App() {
  const { theme, setTheme, state, reset } = useStore();
  const [view, setView] = useState<View>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        aria-label="Sidebar"
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
        className={mobileOpen ? "mobile-open" : ""}
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
          {!collapsed && <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 700, letterSpacing: .06 + "em" }}>SYSTEM</div>}
          <button
            className="btn btn-sm"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            onClick={() => { reset(); addToast("Demo data restored"); }}
            title="Reset Demo Data"
          >
            ↺ {!collapsed && "Reset Demo Data"}
          </button>
          {!collapsed && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>v1.0 • Local-first • {state.tasks.length} tasks</div>}
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <header
          style={{
            height: "var(--topbar-h)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(10,10,15,.75)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 14px"
          }}
        >
          <button className="btn btn-ghost" style={{ display: "none" }} aria-label="menu" onClick={() => setMobileOpen(v => !v)}>
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, letterSpacing: -.02 + "em" }}>{nav.find(n => n.id === view)?.label}</div>
            <span className="badge" style={{ background: "var(--bg-elev2)", color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn" onClick={() => setPalette(true)} style={{ gap: 8 }}>
              <span style={{ opacity: .7 }}>⌘</span> Search <span className="kbd">Ctrl K</span>
            </button>
            <div style={{ position: "relative" }}>
              <input className="input" placeholder="Quick filter…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 180 }} aria-label="Quick filter" />
              {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 6, top: 6 }} className="btn btn-ghost btn-sm">✕</button>}
            </div>
            <button className="btn" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
              {theme === "dark" ? "☀ Light" : "◑ Dark"}
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main style={{ padding: 16, maxWidth: 1280, width: "100%", margin: "0 auto" }}>
          {view === "overview" && <OverviewView q={q} onNav={setView} />}
          {view === "tasks" && <TasksView q={q} onToast={addToast} />}
          {view === "habits" && <HabitsView q={q} onToast={addToast} />}
          {view === "finance" && <FinanceView q={q} />}
          {view === "focus" && <FocusStudio onToast={addToast} />}
          {view === "calendar" && <CalendarView q={q} />}
          {view === "goals" && <GoalsView q={q} />}
        </main>

        {/* Mobile sidebar overlay */}
        {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 15 }} />}

        {/* Command palette */}
        {palette && <CommandPalette onClose={() => setPalette(false)} onNav={(v) => { setView(v as View); setPalette(false); }} />}

        {/* Toasts */}
        {toasts.map((t, i) => (
          <div
            key={t.id}
            role="status"
            style={{
              position: "fixed",
              bottom: 16 + i * 52,
              right: 16,
              background: "var(--card)",
              border: "1px solid var(--border)",
              padding: "10px 14px",
              borderRadius: 10,
              boxShadow: "var(--shadow)",
              fontWeight: 700,
              fontSize: 13,
              animation: "slideUp .2s ease",
              zIndex: 40
            }}
          >
            {t.message}
          </div>
        ))}

        <style>{`@media(max-width:900px){ aside{ position:fixed !important; left:0; transform: translateX(-100%); } aside.mobile-open{ transform: translateX(0); width: var(--sidebar-w) !important; } header button[aria-label="menu"]{ display:inline-flex !important; } }`}</style>
      </div>
    </div>
  );
}
