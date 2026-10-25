import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { CalendarEvent } from "../models";
import { priorityColor } from "../components/constants";
import { hasConflict, todayISO, toMinutes, uid } from "../utils";
import { Empty, ColorPicker } from "../components/CommonUI";

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
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}>
      <div className="card" style={{ width: "min(560px,100%)", padding: 18, animation: "pop .18s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900 }}>{initial?.id ? "Edit event" : "New event"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Title *
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" style={{ minHeight: 40 }} />
          </label>
          <div className="form-three-col">
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Date *
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ minHeight: 40 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Start Time *
              <input className="input" type="time" value={start} onChange={e => setStart(e.target.value)} style={{ minHeight: 40 }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              End Time *
              <input className="input" type="time" value={end} onChange={e => setEnd(e.target.value)} style={{ minHeight: 40 }} />
            </label>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Link task (optional)
              <select className="select" value={taskId || ""} onChange={e => setTaskId(e.target.value)} style={{ minHeight: 40, marginTop: 4 }}>
                <option value="">No task linked</option>
                {state.tasks.slice(0, 30).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Color</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Description
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details, meeting link, or notes" rows={3} />
          </label>
          {previewConflict && <div style={{ padding: "8px 10px", borderRadius: 8, background: "#ef444418", border: "1px solid #ef444430", color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>⚠ Time conflicts with another event on {date}.</div>}
          {conflicts.has(initial?.id || "") && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>This event currently conflicts with another.</div>}
          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div>{initial?.id && <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)", minHeight: 40 }} onClick={() => { if (confirm("Delete event?")) onDelete(initial.id); }}>Delete</button>}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 40 }} onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ minHeight: 40, padding: "0 20px", fontWeight: 800 }}
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
  const [mode, setMode] = useState<"agenda" | "month" | "week" | "day">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "agenda" : "month"
  );
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

  const handlePrev = () => {
    if (mode === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    } else if (mode === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() - 7);
      setCursor(d);
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      setCursor(d);
    }
  };

  const handleNext = () => {
    if (mode === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    } else if (mode === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() + 7);
      setCursor(d);
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() + 1);
      setCursor(d);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Top Header / Mode Switcher */}
      <div className="card" style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" className={`btn btn-sm ${mode === "agenda" || mode === "day" ? "btn-primary" : "btn-ghost"}`} style={{ minHeight: 38, fontWeight: 800 }} onClick={() => setMode("agenda")}>
            📋 Agenda
          </button>
          <button type="button" className={`btn btn-sm ${mode === "month" ? "btn-primary" : "btn-ghost"}`} style={{ minHeight: 38, fontWeight: 800 }} onClick={() => setMode("month")}>
            📅 Month
          </button>
          <button type="button" className={`btn btn-sm ${mode === "week" ? "btn-primary" : "btn-ghost"}`} style={{ minHeight: 38, fontWeight: 800 }} onClick={() => setMode("week")}>
            📆 Week
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button type="button" className="btn btn-sm" style={{ minWidth: 38, minHeight: 38, fontSize: 16, fontWeight: 800 }} onClick={handlePrev} aria-label="Previous">‹</button>
          <div style={{ fontWeight: 900, minWidth: 140, textAlign: "center", fontSize: 14 }}>
            {cursor.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            {(mode === "agenda" || mode === "day") && " • " + cursor.toLocaleDateString("en-IN", { day: "numeric", weekday: "short" })}
          </div>
          <button type="button" className="btn btn-sm" style={{ minWidth: 38, minHeight: 38, fontSize: 16, fontWeight: 800 }} onClick={handleNext} aria-label="Next">›</button>
          <button type="button" className="btn btn-sm btn-ghost" style={{ minHeight: 38, fontWeight: 700 }} onClick={() => setCursor(new Date())}>Today</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {conflicts.size > 0 && (
            <span className="badge" style={{ background: "#ef444418", color: "var(--danger)", borderColor: "#ef444430", fontSize: 11 }}>
              ● {conflicts.size} Conflict{conflicts.size > 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ minHeight: 38, fontWeight: 800 }}
            onClick={() => {
              setEditing({ id: "", title: "", date: cursor.toISOString().slice(0, 10), start: "10:00", end: "11:00", color: "#7c6cff" } as any);
              setShowForm(true);
            }}
          >
            ＋ New event
          </button>
        </div>
      </div>

      {/* Month View (Protected with Horizontal Scroll for Small Screens) */}
      {mode === "month" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 580 }}>
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
                  const isSelected = iso === cursor.toISOString().slice(0, 10);
                  const unscheduledTasks = state.tasks.filter(t => t.dueDate === iso && t.status !== "done" && !state.events.find(e => e.taskId === t.id));
                  return (
                    <div
                      key={iso}
                      onClick={() => setCursor(new Date(y, m, day))}
                      style={{
                        minHeight: 110,
                        padding: 8,
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        background: isSelected ? "rgba(124,108,255,.12)" : isToday ? "rgba(124,108,255,.05)" : "var(--card)",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 99, background: isToday ? "var(--accent)" : "transparent", color: isToday ? "white" : "var(--text)", fontWeight: 800, fontSize: 12 }}>{day}</span>
                        {unscheduledTasks.length > 0 && <span className="badge" style={{ background: "#f59e0b18", color: "var(--warn)", borderColor: "#f59e0b30", fontSize: 10, padding: "1px 5px" }}>{unscheduledTasks.length} tasks</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                        {evs.slice(0, 3).map(e => (
                          <button key={e.id} onClick={(evt) => { evt.stopPropagation(); setEditing(e); setShowForm(true); }} style={{ textAlign: "left", padding: "4px 6px", borderRadius: 7, border: "1px solid " + (conflicts.has(e.id) ? "#ef444450" : e.color + "40"), background: conflicts.has(e.id) ? "#ef444418" : e.color + "18", fontSize: 11, fontWeight: 700, color: "var(--text)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {e.start} {e.title}
                          </button>
                        ))}
                        {evs.length > 3 && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>+{evs.length - 3} more</div>}
                        {unscheduledTasks.slice(0, 1).map(t => <div key={t.id} style={{ fontSize: 10, color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: 7, padding: "2px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>○ {t.title}</div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week View (Protected with Horizontal Scroll for Small Screens) */}
      {mode === "week" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 620 }}>
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
          </div>
        </div>
      )}

      {/* Agenda & Day View (Mobile Optimized Default with Week Strip Picker) */}
      {(mode === "agenda" || mode === "day") && (
        <div className="card" style={{ padding: 14 }}>
          {/* Week Strip Picker */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Week Strip</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Tap day to view agenda</span>
          </div>

          <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 6 }}>
            {weekDays.map(d => {
              const iso = d.toISOString().slice(0, 10);
              const isSelected = iso === cursor.toISOString().slice(0, 10);
              const isToday = iso === todayISO();
              const dayEvs = eventsByDate.get(iso) || [];
              const hasTasks = state.tasks.some(t => t.dueDate === iso && t.status !== "done");
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setCursor(d)}
                  style={{
                    flex: 1,
                    minWidth: 46,
                    minHeight: 56,
                    padding: "6px 4px",
                    borderRadius: 12,
                    border: "1.5px solid " + (isSelected ? "var(--accent)" : isToday ? "rgba(124,108,255,0.4)" : "var(--border)"),
                    background: isSelected ? "var(--accent)" : isToday ? "rgba(124,108,255,0.12)" : "var(--bg-elev2)",
                    color: isSelected ? "#fff" : "var(--text)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    cursor: "pointer",
                    touchAction: "manipulation",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 8px var(--accent-glow)" : "none"
                  }}
                >
                  <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, opacity: isSelected ? 0.95 : 0.65 }}>
                    {d.toLocaleDateString("en-IN", { weekday: "short" })}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 900 }}>
                    {d.getDate()}
                  </span>
                  <div style={{ display: "flex", gap: 3, height: 4, alignItems: "center" }}>
                    {dayEvs.length > 0 && <span style={{ width: 4, height: 4, borderRadius: 99, background: isSelected ? "#fff" : "var(--accent)" }} />}
                    {hasTasks && <span style={{ width: 4, height: 4, borderRadius: 99, background: isSelected ? "#fde047" : "var(--warn)" }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Agenda Feed for Selected Day */}
          <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 16 }}>
                  {cursor.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {cursor.toISOString().slice(0, 10) === todayISO() ? "📍 Today • " : ""}
                  {(eventsByDate.get(cursor.toISOString().slice(0, 10)) || []).length} event(s) scheduled
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ minHeight: 36 }}
                onClick={() => {
                  setEditing({ id: "", title: "", date: cursor.toISOString().slice(0, 10), start: "10:00", end: "11:00", color: "#7c6cff" } as any);
                  setShowForm(true);
                }}
              >
                ＋ Add event
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {(eventsByDate.get(cursor.toISOString().slice(0, 10)) || []).map(e => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid " + (conflicts.has(e.id) ? "#ef444450" : "var(--border)"),
                    background: conflicts.has(e.id) ? "#ef444418" : "var(--bg-elev2)",
                    alignItems: "center"
                  }}
                >
                  <div style={{ width: 4, height: 40, borderRadius: 99, background: e.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{e.title}</span>
                      <span className="badge" style={{ fontSize: 11, background: "var(--bg-elev)", padding: "2px 7px" }}>
                        ⏱ {e.start}–{e.end}
                      </span>
                      {conflicts.has(e.id) && (
                        <span className="badge" style={{ background: "#ef444418", color: "var(--danger)", fontSize: 10 }}>
                          ⚠ Conflict
                        </span>
                      )}
                    </div>
                    {e.description && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                        {e.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-sm btn-ghost" style={{ minHeight: 34 }} onClick={() => { setEditing(e); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)", minHeight: 34 }} onClick={() => { if (confirm("Delete event?")) deleteEvent(e.id); }}>Delete</button>
                  </div>
                </div>
              ))}

              {(eventsByDate.get(cursor.toISOString().slice(0, 10)) || []).length === 0 && (
                <Empty text="No scheduled events for this day." actionLabel="＋ Schedule event" onAction={() => {
                  setEditing({ id: "", title: "", date: cursor.toISOString().slice(0, 10), start: "10:00", end: "11:00", color: "#7c6cff" } as any);
                  setShowForm(true);
                }} />
              )}

              {/* Unscheduled Tasks Section */}
              <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>
                  Unscheduled tasks due this day
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {state.tasks.filter(t => t.dueDate === cursor.toISOString().slice(0, 10) && t.status !== "done").map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px dashed var(--border)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: priorityColor[t.priority], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                      <span className="badge" style={{ fontSize: 10, padding: "1px 6px" }}>{t.category}</span>
                      <button className="btn btn-sm" style={{ minHeight: 32 }} onClick={() => { setEditing({ id: "", title: t.title, date: cursor.toISOString().slice(0, 10), start: "10:00", end: "11:00", color: "#7c6cff", taskId: t.id } as any); setShowForm(true); }}>
                        ⚡ Schedule
                      </button>
                    </div>
                  ))}
                  {state.tasks.filter(t => t.dueDate === cursor.toISOString().slice(0, 10) && t.status !== "done").length === 0 && (
                    <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 0" }}>
                      No pending tasks due today.
                    </div>
                  )}
                </div>
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
