import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { nav } from "./constants";
import { Empty } from "./CommonUI";

export function CommandPalette({ onClose, onNav }: { onClose: () => void; onNav: (v: string) => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const items = useMemo(() => {
    const base = [
      ...nav.map(n => ({ label: `Go to ${n.label}`, sub: "Navigation", module: n.id })),
      ...state.tasks.map(t => ({ label: t.title, sub: `Task • ${t.category} • ${t.status}`, module: "tasks" })),
      ...state.habits.map(h => ({ label: h.name, sub: `Habit • ${h.category}`, module: "habits" })),
      ...state.goals.map(g => ({ label: g.title, sub: "Goal", module: "goals" })),
      ...state.events.map(e => ({ label: e.title, sub: `Event • ${e.date} ${e.start}–${e.end}`, module: "calendar" })),
    ];
    const s = q.trim().toLowerCase();
    if (!s) return base.slice(0, 12);
    return base.filter(i => (i.label + " " + i.sub).toLowerCase().includes(s));
  }, [state.tasks, state.habits, state.goals, state.events, q]);

  const active = Math.max(0, Math.min(idx, items.length - 1));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setIdx(0);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => (i + 1) % Math.max(1, items.length)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => (i - 1 + Math.max(1, items.length)) % Math.max(1, items.length)); }
    if (e.key === "Enter") { e.preventDefault(); const it = items[active]; if (it) { onNav(it.module); onClose(); } }
  };

  const activate = (it: { module: string }) => { onNav(it.module); onClose(); };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "start center",
        padding: "clamp(10px, 12vh, 100px) 12px 16px",
        zIndex: 60
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          width: "min(560px, 100%)",
          overflow: "hidden",
          animation: "pop .16s ease",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ opacity: .7, fontSize: 16 }}>🔍</span>
          <input
            ref={inputRef}
            className="input"
            placeholder="Search tasks, habits, goals, events, pages…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            style={{ border: "none", background: "transparent", padding: 0, boxShadow: "none", flex: 1, fontSize: 15 }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="btn btn-ghost btn-sm"
              style={{ padding: "2px 8px", fontSize: 12 }}
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px 8px", fontSize: 12, fontWeight: 700 }}
          >
            Close
          </button>
        </div>
        <div style={{ maxHeight: "min(360px, 50vh)", overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); activate(it); }}
              onKeyDown={onKey}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: i === active ? "var(--accent)" : "var(--bg-elev)",
                color: i === active ? "white" : "var(--text)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: i === active ? "rgba(255,255,255,.8)" : "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginTop: 2
                  }}
                >
                  {it.sub}
                </span>
              </div>
              <span className="kbd desktop-only" style={{ opacity: i === active ? 1 : .5 }}>↵</span>
            </button>
          ))}
          {items.length === 0 && <div style={{ padding: 14 }}><Empty text="No results found." /></div>}
        </div>
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>Jump to any module or item instantly</span>
          <span className="desktop-only">Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  );
}
