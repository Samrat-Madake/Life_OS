import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import type { Task, Priority, TaskStatus } from "../models";
import { priorityColor, statusLabel } from "../components/constants";
import { isOverdue, uid } from "../utils";
import { Empty } from "../components/CommonUI";
import { TaskRow, TaskForm } from "../components/TaskComponents";

export function TasksView({ q, onToast }: { q: string; onToast: (m: string) => void }) {
  const { state, addTask, updateTask, deleteTask, toggleTask, toggleSubtask } = useStore();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [filterPri, setFilterPri] = useState<"all" | Priority>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"due" | "priority" | "created">("due");
  const [editing, setEditing] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const combinedQ = (q + " " + query).trim();

  const focusByTask = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of state.focusSessions) {
      if (s.completed && s.taskId) m.set(s.taskId, (m.get(s.taskId) || 0) + s.durationMinutes);
    }
    return m;
  }, [state.focusSessions]);

  const filtered = useMemo(() => {
    let arr = [...state.tasks];
    if (combinedQ) arr = arr.filter(t => (t.title + " " + (t.description || "") + " " + t.category).toLowerCase().includes(combinedQ.toLowerCase()));
    if (filterStatus !== "all") arr = arr.filter(t => t.status === filterStatus);
    if (filterPri !== "all") arr = arr.filter(t => t.priority === filterPri);
    if (filterCat !== "all") arr = arr.filter(t => t.category === filterCat);
    const priRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    arr.sort((a, b) => {
      if (sortBy === "priority") return priRank[a.priority] - priRank[b.priority];
      if (sortBy === "due") {
        const ad = a.dueDate || "9999-12-31", bd = b.dueDate || "9999-12-31";
        if (ad !== bd) return ad.localeCompare(bd);
        return priRank[a.priority] - priRank[b.priority];
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return arr;
  }, [state.tasks, combinedQ, filterStatus, filterPri, filterCat, sortBy]);

  const onDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateTask(id, { status });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className={`btn ${view === "list" ? "btn-primary" : ""}`} onClick={() => setView("list")}>List</button>
          <button className={`btn ${view === "kanban" ? "btn-primary" : ""}`} onClick={() => setView("kanban")}>Kanban</button>
        </div>
        <input className="input" placeholder="Search tasks…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ width: 130 }}>
          <option value="all">All status</option>
          <option value="todo">To do</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
        <select className="select" value={filterPri} onChange={e => setFilterPri(e.target.value as any)} style={{ width: 130 }}>
          <option value="all">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 140 }}>
          <option value="all">All categories</option>
          {["Work", "Personal", "Health", "Finance", "Learning", "Home"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ width: 140 }}>
          <option value="due">Sort: Due + Priority</option>
          <option value="priority">Sort: Priority</option>
          <option value="created">Sort: Newest</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>＋ New task</button>
      </div>

      {view === "list" ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
            {filtered.map(t => (
              <TaskRow
                key={t.id}
                t={t}
                focusMinutes={focusByTask.get(t.id) || 0}
                onToggle={() => { toggleTask(t.id); onToast("Task completed"); }}
                onToggleSubtask={(subId) => toggleSubtask(t.id, subId)}
                onEdit={() => { setEditing(t); setShowForm(true); }}
                onDelete={() => { if (confirm(`Delete “${t.title}”?`)) deleteTask(t.id); }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 18 }}>
                <Empty
                  text="No tasks match your filters."
                  actionLabel="Clear filters"
                  onAction={() => { setFilterStatus("all"); setFilterPri("all"); setFilterCat("all"); setQuery(""); }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {(["todo", "doing", "done"] as TaskStatus[]).map(col => (
            <div key={col} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col)} className="card" style={{ padding: 10, minHeight: 320 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="badge" style={{ background: "var(--bg-elev2)" }}>{statusLabel[col]} • {filtered.filter(t => t.status === col).length}</span>
                <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 99, background: col === "done" ? "var(--success)" : col === "doing" ? "var(--accent)" : "var(--text-faint)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.filter(t => t.status === col).map(t => {
                  const subtasks = t.subtasks || [];
                  const subDone = subtasks.filter(s => s.completed).length;
                  const subPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : 0;
                  return (
                    <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", t.id)} style={{ padding: 12, borderRadius: 12, background: "var(--bg-elev)", border: "1px solid var(--border)", cursor: "grab" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: priorityColor[t.priority] }} /> {t.title}
                      </div>
                      {t.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4 }}>{t.description}</div>}

                      {/* Subtasks in Kanban */}
                      {subtasks.length > 0 && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
                            <span>Checklist</span>
                            <span>{subDone}/{subtasks.length} ({subPct}%)</span>
                          </div>
                          <div className="progress-track" style={{ marginTop: 4, height: 4 }}>
                            <div className="progress-fill" style={{ width: `${subPct}%`, background: subPct === 100 ? "var(--success)" : "var(--accent)" }} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                            {subtasks.map(st => (
                              <label key={st.id} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={st.completed}
                                  onChange={() => toggleSubtask(t.id, st.id)}
                                  style={{ cursor: "pointer" }}
                                />
                                <span style={{ textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1 }}>
                                  {st.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <span className="badge">{t.category}</span>
                        {t.dueDate && <span className="badge" style={{ background: isOverdue(t.dueDate) && t.status !== "done" ? "#ef444418" : "var(--bg-elev2)", color: isOverdue(t.dueDate) && t.status !== "done" ? "var(--danger)" : "var(--text-muted)", borderColor: isOverdue(t.dueDate) ? "#ef444430" : "var(--border)" }}>{isOverdue(t.dueDate) && t.status !== "done" ? "Overdue • " : ""}{t.dueDate}</span>}
                        {focusByTask.get(t.id) ? <span className="badge" style={{ background: "#7c6cff18", color: "var(--accent)", borderColor: "#7c6cff30" }}>⏱ {focusByTask.get(t.id)}m</span> : null}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button className="btn btn-sm" onClick={() => { toggleTask(t.id); onToast("Task completed"); }}>{t.status === "done" ? "Undo" : "Complete"}</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</button>
                      </div>
                    </div>
                  );
                })}
                {filtered.filter(t => t.status === col).length === 0 && <div style={{ padding: 10 }}><Empty text="Drop tasks here." /></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSave={(patch) => {
            if (editing) { updateTask(editing.id, patch as any); }
            else { addTask({ id: uid(), createdAt: new Date().toISOString().slice(0, 10), status: "todo", ...patch as any }); }
            setShowForm(false);
          }}
        />
      )}

      <style>{`@media(max-width:900px){ div[style*="repeat(3,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
