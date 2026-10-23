import { useMemo } from "react";
import { useStore } from "../store";
import { fmtINR, isOverdue, todayISO, minutesToHM, streakForHabit } from "../utils";
import type { View } from "../components/constants";
import { MetricCard, Empty } from "../components/CommonUI";
import { TaskRow } from "../components/TaskComponents";

export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const colors = ["#7c6cff", "#22c55e", "#f59e0b", "#06b6d4", "#f472b6", "#a78bfa", "#ef4444", "#5eead4"];
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
      <svg width={120} height={120} viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
        <circle cx={21} cy={21} r={15.9} fill="transparent" stroke="var(--bg-elev2)" strokeWidth={6} />
        {data.map((d, i) => {
          const pct = d.value / total * 100;
          const dash = `${pct} ${100 - pct}`;
          const offset = 25 - acc; // start at top
          acc += pct;
          return <circle key={d.label} cx={21} cy={21} r={15.9} fill="transparent" stroke={colors[i % colors.length]} strokeWidth={6} strokeDasharray={dash} strokeDashoffset={offset} style={{ transform: "rotate(-90deg)", transformOrigin: "21px 21px" }} />
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 4, background: colors[i % colors.length] }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{d.label}</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{fmtINR(d.value)}</span>
            <span style={{ fontWeight: 800 }}>{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
        {data.length === 0 && <Empty text="No spending this month." />}
      </div>
    </div>
  );
}

export function OverviewView({ q, onNav }: { q: string; onNav: (v: View) => void }) {
  const { state } = useStore();
  const today = todayISO();
  const todaysTasks = state.tasks.filter(t => (t.dueDate === today && t.status !== "done") || (t.status !== "done" && isOverdue(t.dueDate)));
  const completedToday = state.tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === today).length;
  const habitStreaks = state.habits.map(h => {
    const logs = state.habitLogs.filter(l => l.habitId === h.id).map(l => l.date);
    return streakForHabit(logs, h.frequency);
  });
  const avgStreak = habitStreaks.length ? Math.round(habitStreaks.reduce((a, b) => a + b.current, 0) / habitStreaks.length) : 0;
  const focusMinutes = state.focusSessions.filter(s => s.completed).reduce((a, s) => a + s.durationMinutes, 0);
  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthSpend = state.transactions.filter(t => t.type === "expense" && t.date.slice(0, 7) === month).reduce((a, t) => a + t.amountPaise, 0);
  const monthIncome = state.transactions.filter(t => t.type === "income" && t.date.slice(0, 7) === month).reduce((a, t) => a + t.amountPaise, 0);
  const upcoming = [...state.events].filter(e => e.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5);
  const goalProgress = state.goals.map(g => {
    const done = g.milestones.filter(m => m.completed).length;
    const pct = g.milestones.length ? Math.round(done / g.milestones.length * 100) : (g.targetValue ? Math.min(100, Math.round((g.currentValue || 0) / (g.targetValue) * 100)) : 0);
    return { g, pct };
  });

  const activities = [
    ...state.tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === today).map(t => ({ time: t.completedAt!.slice(11, 16), label: `Completed “${t.title}”`, kind: "task" as const })),
    ...state.focusSessions.filter(s => s.startedAt.slice(0, 10) === today && s.completed).map(s => ({ time: s.startedAt.slice(11, 16), label: `Focus ${s.durationMinutes}m ${s.taskTitle ? `• ${s.taskTitle}` : ""}`, kind: "focus" as const })),
    ...state.habitLogs.filter(l => l.date === today).slice(0, 4).map(l => { const h = state.habits.find(x => x.id === l.habitId); return { time: "09:00", label: `Habit • ${h?.name || l.habitId}`, kind: "habit" as const } }),
    ...state.transactions.filter(t => t.date === today).map(t => ({ time: "12:00", label: `${t.type === "income" ? "+" : "-"} ${fmtINR(t.amountPaise)} • ${t.category}`, kind: "finance" as const })),
  ].slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <MetricCard label="Today's focus" value={minutesToHM(focusMinutes)} sub={`${state.focusSessions.filter(s => s.completed).length} sessions`} accent="var(--accent)" />
        <MetricCard label="Tasks due" value={String(todaysTasks.length)} sub={`${completedToday} completed today`} accent="var(--success)" />
        <MetricCard label="Habit streak" value={`${avgStreak} days`} sub="avg current streak" accent="var(--accent-2)" />
        <MetricCard label="Spent this month" value={fmtINR(monthSpend)} sub={`Income ${fmtINR(monthIncome)} • Net ${fmtINR(monthIncome - monthSpend)}`} accent={monthSpend > monthIncome * 0.8 ? "var(--danger)" : "var(--warn)"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr .85fr", gap: 12 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>Today's priority</h3>
              <button className="btn btn-sm" onClick={() => onNav("tasks")}>Open tasks</button>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {todaysTasks.slice(0, 5).map(t => <TaskRow key={t.id} t={t} compact />)}
              {todaysTasks.length === 0 && <Empty text="No urgent tasks — enjoy the calm." />}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Spending by category (this month)</h3>
            <Donut data={(() => {
              const map = new Map<string, number>();
              state.transactions.filter(t => t.type === "expense" && t.date.slice(0, 7) === month).forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.amountPaise));
              return [...map.entries()].map(([k, v]) => ({ label: k, value: v }));
            })()} />
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Goals progress</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {goalProgress.map(({ g, pct }) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: g.color, display: "grid", placeItems: "center", color: "white", fontWeight: 800 }}>⬢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{g.title}</div>
                    <div className="progress-track" style={{ marginTop: 6 }}><div className="progress-fill" style={{ width: pct + "%", background: g.color }} /></div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>{pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Upcoming events</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {upcoming.map(e => (
                <div key={e.id} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 4, borderRadius: 99, background: e.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.date} • {e.start}–{e.end}</div>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && <Empty text="No upcoming events." />}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Activity timeline</h3>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 34, textAlign: "right", fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>{a.time}</div>
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: a.kind === "task" ? "var(--success)" : a.kind === "focus" ? "var(--accent)" : a.kind === "habit" ? "var(--accent-2)" : "var(--warn)" }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                </div>
              ))}
              {activities.length === 0 && <Empty text="Complete a task or habit to see activity here." />}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Quick actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={() => onNav("tasks")}>＋ New task</button>
              <button className="btn" onClick={() => onNav("focus")}>◎ Start focus</button>
              <button className="btn" onClick={() => onNav("finance")}>＋ Add transaction</button>
              <button className="btn" onClick={() => onNav("calendar")}>＋ New event</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:1000px){ div[style*="grid-template-columns:repeat(4"]{ grid-template-columns:1fr 1fr !important; } div[style*="1.35fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
