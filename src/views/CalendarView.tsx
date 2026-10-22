import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { CalendarEvent } from "../models";
import { priorityColor } from "../components/constants";
import { hasConflict, todayISO, toMinutes, uid } from "../utils";
import { Empty } from "../components/CommonUI";

function EventForm({
  initial,
  onClose,
  onSave,
  onDelete,
  conflicts
}: {
  initial: CalendarEvent | null;
  onClose: () => void;
  onSave: (p: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
  conflicts: Set<string>;
}) {
  const { state } = useStore();
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [start, setStart] = useState(initial?.start || "10:00");
  const [end, setEnd] = useState(initial?.end || "11:00");
  const [color, setColor] = useState(initial?.color || "#7c6cff");
  const [description, setDescription] = useState(initial?.description || "");
  const [taskId, setTaskId] = useState(initial?.taskId || "");
  const [err, setErr] = useState<string | null>(null);

  const previewConflict = useMemo(() => {
    const others = state.events.filter(e => e.id !== initial?.id && e.date === date);
    return others.some(o => hasConflict({ start, end }, { start: o.start, end: o.end }));
  }, [state.events, initial, date, start, end]);

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(560px,100%)", padding: 16, animation: "pop .18s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial?.id ? "Edit event" : "New event"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Title *
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Date
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Start
              <input className="input" type="time" value={start} onChange={e => setStart(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              End
              <input className="input" type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Color
              <input className="input" type="color" value={color} onChange={e => setColor(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Link task
              <select className="select" value={taskId || ""} onChange={e => setTaskId(e.target.value)}>
                <option value="">No task</option>
                {state.tasks.slice(0, 30).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Description
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details" />
          </label>
          {previewConflict && <div style={{ padding: 8, borderRadius: 8, background: "#ef444418", border: "1px solid #ef444430", color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>⚠ Time conflicts with another event on {date}.</div>}
          {conflicts.has(initial?.id || "") && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>This event currently conflicts with another.</div>}
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 4 }}>
            <div>{initial?.id && <button className="btn" style={{ color: "var(--danger)" }} onClick={() => { if (confirm("Delete event?")) onDelete(initial.id); }}>Delete</button>}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!title.trim()) { setErr("Title required"); return; }
                  if (toMinutes(end) <= toMinutes(start)) { setErr("End must be after start"); return; }
                  onSave({ title: title.trim(), date, start, end, color, description: description.trim() || undefined, taskId: taskId || null });
                }}
              >
                Save event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ q }: { q: string }) {
  const { state, addEvent, updateEvent, deleteEvent } = useStore();
  const [mode, setMode] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const monthStart = new Date(y, m, 1), monthEnd = new Date(y, m + 1, 0);
  const startPad = monthStart.getDay(); // 0 Sun
  const daysInMonth = monthEnd.getDate();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of state.events) {
      if (q && !(e.title + " " + (e.description || "")).toLowerCase().includes(q.toLowerCase())) continue;
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    }
    for (const [, arr] of map) arr.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    return map;
  }, [state.events, q]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    for (const [, arr] of eventsByDate) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (hasConflict(arr[i], arr[j])) {
            set.add(arr[i].id);
            set.add(arr[j].id);
          }
        }
      }
    }
    return set;
  }, [eventsByDate]);

  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - cursor.getDay());
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className={`btn ${mode === "month" ? "btn-primary" : ""}`} onClick={() => setMode("month")}>Month</button>
          <button className={`btn ${mode === "week" ? "btn-primary" : ""}`} onClick={() => setMode("week")}>Week</button>
          <button className={`btn ${mode === "day" ? "btn-primary" : ""}`} onClick={() => setMode("day")}>Day</button>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="btn btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
          <div style={{ fontWeight: 900, minWidth: 140, textAlign: "center" }}>
            {cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} {mode !== "month" && "• " + cursor.toLocaleDateString("en-IN", { day: "numeric" })}
          </div>
          <button className="btn btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setCursor(new Date())}>Today</button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge" style={{ background: "#ef444418", color: "var(--danger)", borderColor: "#ef444430" }}>● Conflict</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>＋ New event</button>
        </div>
      </div>

      {mode === "month" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg-elev2)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textAlign: "center" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0 }}>
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={"pad" + i} style={{ minHeight: 110, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-elev)" }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = new Date(y, m, day).toISOString().slice(0, 10);
              const evs = eventsByDate.get(iso) || [];
              const isToday = iso === todayISO();
              const unscheduledTasks = state.tasks.filter(t => t.dueDate === iso && t.status !== "done" && !state.events.find(e => e.taskId === t.id));
              return (
                <div key={iso} style={{ minHeight: 110, padding: 8, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: isToday ? "rgba(124,108,255,.08)" : "var(--card)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 99, background: isToday ? "var(--accent)" : "transparent", color: isToday ? "white" : "var(--text)", fontWeight: 800, fontSize: 12 }}>{day}</span>
                    {unscheduledTasks.length > 0 && <span className="badge" style={{ background: "#f59e0b18", color: "var(--warn)", borderColor: "#f59e0b30" }}>{unscheduledTasks.length} tasks</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                    {evs.slice(0, 3).map(e => (
                      <button key={e.id} onClick={() => { setEditing(e); setShowForm(true); }} style={{ textAlign: "left", padding: "4px 6px", borderRadius: 7, border: "1px solid " + (conflicts.has(e.id) ? "#ef444450" : e.color + "40"), background: conflicts.has(e.id) ? "#ef444418" : e.color + "18", fontSize: 11, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>
                        {e.start} {e.title}
                      </button>
                    ))}
                    {evs.length > 3 && <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>+{evs.length - 3} more</div>}
                    {unscheduledTasks.slice(0, 1).map(t => <div key={t.id} style={{ fontSize: 11, color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 7, padding: "3px 6px" }}>○ {t.title}</div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "week" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "70px repeat(7,1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg-elev2)" }}>
            <div style={{ padding: 8, fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}></div>
            {weekDays.map(d => (
              <div key={d.toISOString()} style={{ padding: 8, textAlign: "center", fontSize: 12, fontWeight: 800, color: d.toISOString().slice(0, 10) === todayISO() ? "var(--accent)" : "var(--text-muted)" }}>
                {d.toLocaleDateString("en-IN", { weekday: "short" })} {d.getDate()}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "70px repeat(7,1fr)" }}>
            <div style={{ borderRight: "1px solid var(--border)" }}>
              {Array.from({ length: 13 }).map((_, i) => {
                const h = 7 + i;
                return <div key={h} style={{ height: 48, padding: "6px 8px", fontSize: 11, color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{String(h).padStart(2, "0")}:00</div>
              })}
            </div>
            {weekDays.map(d => {
              const iso = d.toISOString().slice(0, 10);
              const evs = eventsByDate.get(iso) || [];
              return (
                <div key={iso} style={{ position: "relative", borderRight: "1px solid var(--border)", background: iso === todayISO() ? "rgba(124,108,255,.05)" : "transparent" }}>
                  {Array.from({ length: 13 }).map((_, i) => <div key={i} style={{ height: 48, borderBottom: "1px solid var(--border)" }} />)}
                  {evs.map(e => {
                    const top = (toMinutes(e.start) - 7 * 60) / 60 * 48;
                    const h = (toMinutes(e.end) - toMinutes(e.start)) / 60 * 48;
                    if (top < 0 || top > 600) return null;
                    return (
                      <button key={e.id} onClick={() => { setEditing(e); setShowForm(true); }} style={{ position: "absolute", left: 4, right: 4, top: Math.max(0, top), height: Math.max(22, h), background: conflicts.has(e.id) ? "#ef4444" : e.color, color: "white", borderRadius: 8, padding: "4px 6px", fontSize: 11, fontWeight: 800, textAlign: "left", border: "1px solid rgba(0,0,0,.1)", cursor: "pointer", overflow: "hidden" }}>
                        {e.title} • {e.start}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "day" && (
        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ fontWeight: 900 }}>{cursor.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {(eventsByDate.get(cursor.toISOString().slice(0, 10)) || []).map(e => (
              <div key={e.id} style={{ display: "flex", gap: 10, padding: 12, borderRadius: 12, border: "1px solid " + (conflicts.has(e.id) ? "#ef444450" : "var(--border)"), background: conflicts.has(e.id) ? "#ef444418" : "var(--bg-elev2)" }}>
                <div style={{ width: 4, borderRadius: 99, background: e.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{e.title} <span className="badge" style={{ marginLeft: 6 }}>{e.start}–{e.end}</span> {conflicts.has(e.id) && <span className="badge" style={{ background: "#ef444418", color: "var(--danger)" }}>Conflict</span>}</div>
                  {e.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{e.description}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(e); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => { if (confirm("Delete event?")) deleteEvent(e.id); }}>Delete</button>
                </div>
              </div>
            ))}
            {(eventsByDate.get(cursor.toISOString().slice(0, 10)) || []).length === 0 && <Empty text="No events this day — add one or drag a task here." />}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>Unscheduled tasks due this day</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {state.tasks.filter(t => t.dueDate === cursor.toISOString().slice(0, 10) && t.status !== "done").map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px dashed var(--border)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: priorityColor[t.priority] }} /> <span style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</span> <span className="badge" style={{ marginLeft: "auto" }}>{t.category}</span>
                    <button className="btn btn-sm" onClick={() => { setEditing({ id: "", title: t.title, date: cursor.toISOString().slice(0, 10), start: "10:00", end: "11:00", color: "#7c6cff", taskId: t.id } as any); setShowForm(true); }}>Schedule</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <EventForm
          initial={editing}
          conflicts={conflicts}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing && editing.id) { updateEvent(editing.id, patch as any); }
            else { addEvent({ id: uid(), ...patch as any }); }
            setShowForm(false);
          }}
          onDelete={(id) => { deleteEvent(id); setShowForm(false); }}
        />
      )}
    </div>
  );
}
