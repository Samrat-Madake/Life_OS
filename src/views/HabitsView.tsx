import { useMemo, useState } from "react";
import { useStore } from "../store";
import { streakForHabit, todayISO, uid } from "../utils";
import { Empty } from "../components/CommonUI";

function Achievement({ unlocked, label }: { unlocked: boolean; label: string }) {
  return (
    <span className="badge" style={{ background: unlocked ? "#22c55e18" : "var(--bg-elev2)", color: unlocked ? "var(--success)" : "var(--text-muted)", borderColor: unlocked ? "#22c55e30" : "var(--border)" }}>
      {unlocked ? "✓" : "○"} {label}
    </span>
  );
}

function HabitForm({ initial, onClose, onSave }: { initial: any | null; onClose: () => void; onSave: (p: any) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "Health");
  const [frequency, setFrequency] = useState(initial?.frequency || "daily");
  const [targetPerWeek, setTarget] = useState(initial?.targetPerWeek || 5);
  const [icon, setIcon] = useState(initial?.icon || "⭐");
  const [color, setColor] = useState(initial?.color || "#7c6cff");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(520px,100%)", padding: 16, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit habit" : "New habit"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Name *
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Morning Run" />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Category
              <input className="input" value={category} onChange={e => setCategory(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Frequency
              <select className="select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Target / week
              <input className="input" type="number" min={1} max={7} value={targetPerWeek} onChange={e => setTarget(Number(e.target.value))} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Icon
              <input className="input" value={icon} onChange={e => setIcon(e.target.value)} />
            </label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Color
            <input className="input" type="color" value={color} onChange={e => setColor(e.target.value)} />
          </label>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => {
              if (!name.trim()) { setErr("Name required"); return; }
              onSave({ name: name.trim(), category, frequency, targetPerWeek: Number(targetPerWeek) || 1, icon: icon || "⭐", color });
            }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HabitsView({ q, onToast }: { q: string; onToast: (m: string) => void }) {
  const { state, toggleHabit, addHabit, updateHabit, deleteHabit } = useStore();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const combinedQ = (q + " " + query).trim().toLowerCase();
  const habits = useMemo(() => state.habits.filter(h => !combinedQ || (h.name + " " + h.category).toLowerCase().includes(combinedQ)), [state.habits, combinedQ]);
  const today = todayISO();

  // XP/level
  const totalCompletions = state.habitLogs.length;
  const xp = totalCompletions * 10;
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = level * 100 - xp % 100;

  // heatmap for last 84 days
  const heatDays = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const c = state.habitLogs.filter(l => l.date === iso).length;
      arr.push({ date: iso, count: c });
    }
    return arr;
  }, [state.habitLogs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontWeight: 900 }}>Habits</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>＋ New habit</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="input" placeholder="Search habits…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 12 }}>
            {habits.map(h => {
              const logs = state.habitLogs.filter(l => l.habitId === h.id).map(l => l.date);
              const { current, longest } = streakForHabit(logs, h.frequency);
              const doneToday = state.habitLogs.some(l => l.habitId === h.id && l.date === today);
              const weekCount = (() => {
                const s = new Date();
                s.setHours(12, 0, 0, 0);
                s.setDate(s.getDate() - 6);
                let c = 0;
                for (let i = 0; i < 7; i++) {
                  const d = new Date(s);
                  d.setDate(s.getDate() + i);
                  const iso = d.toISOString().slice(0, 10);
                  if (logs.includes(iso)) c++;
                }
                return c;
              })();

              return (
                <div key={h.id} className="card" style={{ padding: 12, background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: h.color, display: "grid", placeItems: "center", color: "white", fontWeight: 800 }}>{h.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{h.category} • {h.frequency} • {h.targetPerWeek}/wk</div>
                    </div>
                    <button
                      aria-label="Toggle today"
                      onClick={() => { toggleHabit(h.id, today); onToast(doneToday ? "Habit unchecked" : "Habit logged"); }}
                      className="btn"
                      style={{ padding: "6px 10px", background: doneToday ? h.color : "var(--bg-elev2)", color: doneToday ? "white" : "var(--text)", borderColor: doneToday ? h.color : "var(--border)" }}
                    >
                      {doneToday ? "✓ Done" : "○ Mark"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <span className="badge" style={{ background: "#22c55e18", color: "#22c55e", borderColor: "#22c55e30" }}>Current {current}</span>
                    <span className="badge" style={{ background: "var(--bg-elev2)" }}>Longest {longest}</span>
                    <span className="badge" style={{ background: "var(--bg-elev2)" }}>This week {weekCount}/{h.targetPerWeek}</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: Math.min(100, Math.round(weekCount / h.targetPerWeek * 100)) + "%", background: h.color }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(h); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => { if (confirm(`Delete habit “${h.name}”?`)) deleteHabit(h.id); }}>Delete</button>
                  </div>
                  {/* 7-day toggles */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const d = new Date();
                      d.setHours(12, 0, 0, 0);
                      d.setDate(d.getDate() - (6 - idx));
                      const iso = d.toISOString().slice(0, 10);
                      const done = logs.includes(iso);
                      const isToday = iso === today;
                      return (
                        <button
                          key={iso}
                          title={iso}
                          onClick={() => { toggleHabit(h.id, iso); onToast(done ? "Habit unchecked" : "Habit logged"); }}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 8,
                            border: "1px solid " + (done ? h.color : isToday ? "var(--accent)" : "var(--border)"),
                            background: done ? h.color : "var(--bg-elev2)",
                            color: done ? "white" : isToday ? "var(--text)" : "var(--text-muted)",
                            fontWeight: 800,
                            fontSize: 11
                          }}
                        >
                          {d.toLocaleDateString("en-IN", { weekday: "narrow" })}<br />{d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {habits.length === 0 && <div style={{ marginTop: 12 }}><Empty text="No habits match." /></div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Level & XP</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#7c6cff,#f472b6)", display: "grid", placeItems: "center", color: "white", fontWeight: 900, fontSize: 18 }}>Lv {level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{xp} XP</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{xpToNext} XP to next level • {totalCompletions} completions</div>
                <div className="progress-track" style={{ marginTop: 8 }}><div className="progress-fill" style={{ width: ((xp % 100) / 100 * 100) + "%", background: "var(--accent)" }} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap"}}>
              <Achievement unlocked={totalCompletions >= 10} label="Starter — 10 completions" />
              <Achievement unlocked={habits.some(h => streakForHabit(state.habitLogs.filter(l => l.habitId === h.id).map(l => l.date), h.frequency).current >= 7)} label="Week Warrior — 7-day streak" />
              <Achievement unlocked={xp >= 500} label="500 XP" />
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>84-day heatmap</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 4, marginTop: 10 }}>
              {heatDays.map(d => {
                const intensity = d.count === 0 ? 0 : d.count === 1 ? 1 : d.count === 2 ? 2 : 3;
                const bg = intensity === 0 ? "var(--bg-elev2)" : intensity === 1 ? "#7c6cff55" : intensity === 2 ? "#7c6cff99" : "#7c6cff";
                return <div key={d.date} title={`${d.date}: ${d.count}`} style={{ height: 18, borderRadius: 4, background: bg, border: "1px solid var(--border)" }} />
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Darker = more habits completed that day.</div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Weekly completion</h3>
            <div style={{ display: "flex", alignItems: "end", gap: 6, height: 90, marginTop: 10 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setHours(12, 0, 0, 0);
                d.setDate(d.getDate() - (6 - i));
                const iso = d.toISOString().slice(0, 10);
                const count = state.habitLogs.filter(l => l.date === iso).length;
                const max = Math.max(1, ...Array.from({ length: 7 }).map((__, k) => { const dd = new Date(); dd.setDate(new Date().getDate() - (6 - k)); return state.habitLogs.filter(l => l.date === dd.toISOString().slice(0, 10)).length; }));
                return (
                  <div key={iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: "100%", height: Math.round(count / max * 70) + 10, background: "var(--accent)", borderRadius: 8, opacity: .85 }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <HabitForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing) updateHabit(editing.id, patch);
            else addHabit({ id: uid(), createdAt: new Date().toISOString().slice(0, 10), ...patch });
            setShowForm(false);
          }}
        />
      )}

      <style>{`@media(max-width:1000px){ div[style*="1.2fr .8fr"]{ grid-template-columns:1fr !important; } div[style*="repeat(2,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
