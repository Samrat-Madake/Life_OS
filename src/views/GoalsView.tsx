import { useMemo, useState } from "react";
import { useStore } from "../store";
import { fmtINR, todayISO, uid } from "../utils";
import { Empty, ColorPicker } from "../components/CommonUI";

function GoalForm({ initial, onClose, onSave }: { initial: any | null; onClose: () => void; onSave: (p: any) => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [deadline, setDeadline] = useState(initial?.deadline || todayISO());
  const [color, setColor] = useState(initial?.color || "#7c6cff");
  const [milestones, setMilestones] = useState<{ id: string; title: string; completed: boolean; dueDate: string }[]>(initial?.milestones?.map((m: any) => ({ id: m.id, title: m.title, completed: m.completed, dueDate: m.dueDate || "" })) || [{ id: uid(), title: "", completed: false, dueDate: "" }]);
  const [targetValue, setTargetValue] = useState(initial?.targetValue ? String(initial.targetValue) : "");
  const [currentValue, setCurrentValue] = useState(initial?.currentValue ? String(initial.currentValue) : "");
  const [unit, setUnit] = useState(initial?.unit || "");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(640px,100%)", padding: 16, animation: "pop .18s ease", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial ? "Edit goal" : "New goal"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Title *
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Description
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Deadline
              <input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Color</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div style={{ padding: 10, borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Measurable target (optional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
              <input className="input" placeholder="Target value (e.g., 100)" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
              <input className="input" placeholder="Current value" value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
              <input className="input" placeholder="Unit (km, paise, books…)" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>If set, progress derives from current/target instead of milestones. Leave blank to use milestones.</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Milestones
              <button className="btn btn-sm" onClick={() => setMilestones(m => [...m, { id: uid(), title: "", completed: false, dueDate: "" }])}>＋ Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {milestones.map((ms, idx) => (
                <div key={ms.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="input" placeholder="Milestone title" value={ms.title} onChange={e => setMilestones(arr => arr.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} style={{ flex: 1 }} />
                  <input className="input" type="date" value={ms.dueDate} onChange={e => setMilestones(arr => arr.map((x, i) => i === idx ? { ...x, dueDate: e.target.value } : x))} style={{ width: 160 }} />
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => setMilestones(arr => arr.filter((_, i) => i !== idx))}>✕</button>
                </div>
              ))}
            </div>
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!title.trim()) { setErr("Title required"); return; }
                const clean = milestones.filter(m => m.title.trim()).map(m => ({ id: m.id, title: m.title.trim(), completed: m.completed, dueDate: m.dueDate || null }));
                if (clean.length === 0) { setErr("Add at least one milestone"); return; }
                const tv = targetValue ? Number(targetValue) : null;
                const cv = currentValue ? Number(currentValue) : null;
                if (targetValue && !Number.isFinite(tv as number)) { setErr("Target must be a number"); return; }
                onSave({ title: title.trim(), description: description.trim(), deadline, color, milestones: clean, targetValue: tv, currentValue: cv, unit: unit || null });
              }}
            >
              Save goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoalsView({ q }: { q: string }) {
  const { state, addGoal, updateGoal, deleteGoal, toggleMilestone } = useStore();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const combinedQ = (q + " " + query).trim().toLowerCase();
  const filtered = useMemo(() => state.goals.filter(g => !combinedQ || (g.title + " " + g.description).toLowerCase().includes(combinedQ)), [state.goals, combinedQ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input className="input" placeholder="Search goals…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>＋ New goal</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {filtered.map(g => {
          const done = g.milestones.filter(m => m.completed).length;
          const pctMilestone = g.milestones.length ? Math.round(done / g.milestones.length * 100) : 0;
          const pctTarget = g.targetValue ? Math.min(100, Math.round((g.currentValue || 0) / g.targetValue * 100)) : pctMilestone;
          const pct = g.targetValue ? pctTarget : pctMilestone;
          const overdueMilestones = g.milestones.filter(m => !m.completed && m.dueDate && new Date(m.dueDate + "T23:59:59") < new Date());
          const isOverdue = new Date(g.deadline + "T23:59:59") < new Date() && pct < 100;
          const linkedTasks = state.tasks.filter(t => t.goalId === g.id);
          const linkedDone = linkedTasks.filter(t => t.status === "done").length;
          return (
            <div key={g.id} className="card" style={{ padding: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(400px 160px at 0% 0%, ${g.color}14, transparent 60%)` }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: g.color, display: "grid", placeItems: "center", color: "white", fontWeight: 900 }}>⬢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Due {g.deadline} {isOverdue && <span className="badge" style={{ background: "#ef444418", color: "var(--danger)" }}>Overdue</span>}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{done}/{g.milestones.length} milestones</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>{g.description}</div>
                <div className="progress-track" style={{ marginTop: 10 }}><div className="progress-fill" style={{ width: pct + "%", background: g.color }} /></div>
                {g.targetValue !== null && g.targetValue !== undefined && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontWeight: 700 }}>
                    Measurable: {fmtINR(g.unit === "paise" ? (g.currentValue || 0) : 0)} / {g.unit === "paise" ? fmtINR(g.targetValue) : g.targetValue + " " + (g.unit || "")}
                  </div>
                )}
                {linkedTasks.length > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontWeight: 700 }}>Tasks: {linkedDone}/{linkedTasks.length} completed</div>}
                {overdueMilestones.length > 0 && <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 8, background: "#ef444418", border: "1px solid #ef444430", color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>⚠ {overdueMilestones.length} overdue milestone(s): {overdueMilestones.map(m => m.title).join(", ")}</div>}

                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.milestones.map(ms => (
                    <label key={ms.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid var(--border)", cursor: "pointer" }}>
                      <input type="checkbox" checked={ms.completed} onChange={() => toggleMilestone(g.id, ms.id)} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, textDecoration: ms.completed ? "line-through" : "none", opacity: ms.completed ? 0.6 : 1 }}>{ms.title}</span>
                      {ms.dueDate && <span className="badge" style={{ background: !ms.completed && ms.dueDate && new Date(ms.dueDate + "T23:59:59") < new Date() ? "#ef444418" : "var(--bg-elev)", color: !ms.completed && ms.dueDate && new Date(ms.dueDate + "T23:59:59") < new Date() ? "var(--danger)" : "var(--text-muted)" }}>{ms.dueDate}</span>}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(g); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => { if (confirm(`Delete goal “${g.title}”?`)) deleteGoal(g.id); }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="card" style={{ padding: 16 }}><Empty text="No goals found." /></div>}

      {showForm && (
        <GoalForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing) updateGoal(editing.id, patch as any);
            else addGoal({ id: uid(), createdAt: todayISO(), ...patch as any });
            setShowForm(false);
          }}
        />
      )}

      <style>{`@media(max-width:900px){ div[style*="repeat(2,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
