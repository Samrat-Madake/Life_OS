import { useMemo, useState } from "react";
import { useStore } from "../store";
import { streakForHabit, todayISO, uid } from "../utils";
import { Empty, ColorPicker } from "../components/CommonUI";

function Achievement({ unlocked, label }: { unlocked: boolean; label: string }) {
  return (
    <span className="badge" style={{ background: unlocked ? "#22c55e18" : "var(--bg-elev2)", color: unlocked ? "var(--success)" : "var(--text-muted)", borderColor: unlocked ? "#22c55e30" : "var(--border)" }}>
      {unlocked ? "✓" : "○"} {label}
    </span>
  );
}

const HABIT_ICONS = [
  { icon: "⭐", label: "⭐ Star (General)" },
  { icon: "🏃", label: "🏃 Exercise / Fitness" },
  { icon: "💧", label: "💧 Drink Water" },
  { icon: "📚", label: "📚 Reading / Study" },
  { icon: "🧘", label: "🧘 Meditation" },
  { icon: "🥗", label: "🥗 Healthy Diet" },
  { icon: "💻", label: "💻 Coding / Work" },
  { icon: "✍️", label: "✍️ Journal" },
  { icon: "💤", label: "💤 Sleep / Rest" }
];

function HabitForm({ initial, onClose, onSave }: { initial: any | null; onClose: () => void; onSave: (p: any) => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "Health");
  const [frequency, setFrequency] = useState(initial?.frequency || "daily");
  const [targetPerWeek, setTarget] = useState(initial?.targetPerWeek || 5);
  const [icon, setIcon] = useState(initial?.icon || "⭐");
  const [color, setColor] = useState(initial?.color || "#7c6cff");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}>
      <div className="card" style={{ width: "min(520px,100%)", padding: 16, animation: "pop .18s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit habit" : "New habit"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Name *
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Morning Run" />
          </label>
          <div className="form-two-col">
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
          <div className="form-two-col">
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Target / week
              <input className="input" type="number" min={1} max={7} value={targetPerWeek} onChange={e => setTarget(Number(e.target.value))} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Icon
              <select className="select" value={icon} onChange={e => setIcon(e.target.value)}>
                {HABIT_ICONS.map(item => (
                  <option key={item.icon} value={item.icon}>
                    {item.label}
                  </option>
                ))}
                {!HABIT_ICONS.some(item => item.icon === icon) && icon && (
                  <option value={icon}>{icon} Custom</option>
                )}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Color</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ minHeight: 38 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ minHeight: 38, padding: "0 18px" }} onClick={() => {
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
  const [inspectedDay, setInspectedDay] = useState<{ date: string; count: number } | null>(null);
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
      <div className="habits-main-grid">
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ fontWeight: 900 }}>Habits</h3>
            <button className="btn btn-primary btn-sm" style={{ minHeight: 36 }} onClick={() => { setEditing(null); setShowForm(true); }}>＋ New habit</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input className="input" placeholder="Search habits…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minHeight: 40 }} />
          </div>

          <div className="habits-cards-grid">
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
                <div key={h.id} className="card" style={{ padding: 14, background: "var(--bg-elev)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: h.color, display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                      {h.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                        {h.category} • {h.frequency} • {h.targetPerWeek}/wk
                      </div>
                    </div>
                    <button
                      aria-label={doneToday ? `Mark ${h.name} undone` : `Mark ${h.name} done`}
                      onClick={() => { toggleHabit(h.id, today); onToast(doneToday ? "Habit unchecked" : "Habit logged"); }}
                      className="btn"
                      style={{
                        padding: "8px 12px",
                        minHeight: 38,
                        minWidth: 70,
                        background: doneToday ? h.color : "var(--bg-elev2)",
                        color: doneToday ? "white" : "var(--text)",
                        borderColor: doneToday ? h.color : "var(--border)",
                        fontWeight: 800,
                        touchAction: "manipulation",
                        flexShrink: 0
                      }}
                    >
                      {doneToday ? "✓ Done" : "○ Mark"}
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: "#22c55e18", color: "#22c55e", borderColor: "#22c55e30" }}>
                      🔥 {current} streak
                    </span>
                    <span className="badge" style={{ background: "var(--bg-elev2)" }}>
                      Best: {longest}
                    </span>
                    <span className="badge" style={{ background: "var(--bg-elev2)" }}>
                      Week: {weekCount}/{h.targetPerWeek}
                    </span>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: Math.min(100, Math.round(weekCount / h.targetPerWeek * 100)) + "%", background: h.color }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" style={{ minHeight: 32 }} onClick={() => { setEditing(h); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)", minHeight: 32 }} onClick={() => { if (confirm(`Delete habit “${h.name}”?`)) deleteHabit(h.id); }}>Delete</button>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>7-day view</span>
                  </div>

                  {/* 7-day Day Toggles: >= 38px touch targets with clear active states */}
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
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
                          title={`${iso}${done ? " (Completed)" : ""}${isToday ? " - Today" : ""}`}
                          onClick={() => { toggleHabit(h.id, iso); onToast(done ? "Habit unchecked" : "Habit logged"); }}
                          style={{
                            flex: 1,
                            minWidth: 38,
                            minHeight: 42,
                            padding: "6px 2px",
                            borderRadius: 10,
                            border: "2px solid " + (done ? h.color : isToday ? "var(--accent)" : "var(--border)"),
                            background: done ? h.color : isToday ? "var(--accent-glow)" : "var(--bg-elev2)",
                            color: done ? "white" : isToday ? "var(--text)" : "var(--text-muted)",
                            cursor: "pointer",
                            touchAction: "manipulation",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1.25,
                            boxShadow: done ? `0 2px 8px ${h.color}40` : "none",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, opacity: done ? 0.9 : 0.7 }}>
                            {d.toLocaleDateString("en-IN", { weekday: "narrow" })}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900 }}>
                            {d.getDate()}
                          </span>
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
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#7c6cff,#f472b6)", display: "grid", placeItems: "center", color: "white", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                Lv {level}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 900, fontSize: 14 }}>84-day heatmap</h3>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>12 weeks</span>
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginTop: 10, paddingBottom: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 4, minWidth: 280 }}>
                {heatDays.map(d => {
                  const intensity = d.count === 0 ? 0 : d.count === 1 ? 1 : d.count === 2 ? 2 : 3;
                  const bg = intensity === 0 ? "var(--bg-elev2)" : intensity === 1 ? "#7c6cff55" : intensity === 2 ? "#7c6cff99" : "#7c6cff";
                  const isSelected = inspectedDay?.date === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      aria-label={`${d.date}: ${d.count} habits completed`}
                      onClick={() => setInspectedDay(isSelected ? null : { date: d.date, count: d.count })}
                      style={{
                        height: 20,
                        borderRadius: 4,
                        background: bg,
                        border: isSelected ? "2px solid #fff" : "1px solid var(--border)",
                        cursor: "pointer",
                        padding: 0,
                        transform: isSelected ? "scale(1.15)" : "none",
                        transition: "transform 0.15s ease, border 0.15s ease",
                        outline: "none"
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {inspectedDay ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--bg-elev2)", border: "1px solid var(--border)", fontSize: 12 }}>
                <span>📍 <strong>{new Date(inspectedDay.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</strong>: {inspectedDay.count} habit{inspectedDay.count === 1 ? "" : "s"} completed</span>
                <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "0 6px", height: 24, fontSize: 11 }} onClick={() => setInspectedDay(null)}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                <span>👆 Tap any square to view details</span>
                <span>Recent →</span>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Weekly completion</h3>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "end", gap: 6, height: 90, marginTop: 10, minWidth: 220 }}>
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
    </div>
  );
}
