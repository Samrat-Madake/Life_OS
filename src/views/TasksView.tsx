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
  const [mobileKanbanCol, setMobileKanbanCol] = useState<TaskStatus>("todo");
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
      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: "clamp(10px, 2.5vw, 14px)", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Top Control Strip: View switch, Search input, + New Task */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elev2)", padding: 3, borderRadius: 10 }}>
            <button
              className={`btn btn-sm ${view === "list" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 8, fontWeight: 700 }}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              className={`btn btn-sm ${view === "kanban" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 8, fontWeight: 700 }}
              onClick={() => setView("kanban")}
            >
              Kanban
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
            <input
              className="input"
              placeholder="Search tasks…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: "100%", paddingRight: query ? 28 : 12 }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 14,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
            style={{ fontWeight: 700, borderRadius: 10, flexShrink: 0 }}
          >
            ＋ New task
          </button>
        </div>

        {/* Horizontally scrollable pill filter row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
            WebkitOverflowScrolling: "touch",
            alignItems: "center"
          }}
        >
          <select
            className="select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            style={{
              height: 34,
              padding: "0 10px",
              fontSize: 12,
              borderRadius: 8,
              flexShrink: 0,
              background: filterStatus !== "all" ? "var(--bg-elev2)" : undefined,
              fontWeight: filterStatus !== "all" ? 700 : 500
            }}
          >
            <option value="all">All Status</option>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>

          <select
            className="select"
            value={filterPri}
            onChange={e => setFilterPri(e.target.value as any)}
            style={{
              height: 34,
              padding: "0 10px",
              fontSize: 12,
              borderRadius: 8,
              flexShrink: 0,
              background: filterPri !== "all" ? "var(--bg-elev2)" : undefined,
              fontWeight: filterPri !== "all" ? 700 : 500
            }}
          >
            <option value="all">Any Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className="select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{
              height: 34,
              padding: "0 10px",
              fontSize: 12,
              borderRadius: 8,
              flexShrink: 0,
              background: filterCat !== "all" ? "var(--bg-elev2)" : undefined,
              fontWeight: filterCat !== "all" ? 700 : 500
            }}
          >
            <option value="all">All Categories</option>
            {["Work", "Personal", "Health", "Finance", "Learning", "Home"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              height: 34,
              padding: "0 10px",
              fontSize: 12,
              borderRadius: 8,
              flexShrink: 0
            }}
          >
            <option value="due">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="created">Sort: Newest</option>
          </select>

          {(filterStatus !== "all" || filterPri !== "all" || filterCat !== "all" || query) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFilterStatus("all"); setFilterPri("all"); setFilterCat("all"); setQuery(""); }}
              style={{ fontSize: 11, color: "var(--danger)", flexShrink: 0, height: 34, padding: "0 10px" }}
            >
              Clear filters ✕
            </button>
          )}
        </div>
      </div>

      {view === "list" ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
            {filtered.map(t => (
              <TaskRow
                key={t.id}
                t={t}
                focusMinutes={focusByTask.get(t.id) || 0}
                onToggle={() => { toggleTask(t.id); onToast(t.status === "done" ? "Task reopened" : "Task completed"); }}
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
        <div>
          {/* Mobile Segmented Column Tab Bar (< 768px) */}
          <div
            className="mobile-only"
            style={{
              display: "flex",
              gap: 6,
              padding: 4,
              borderRadius: 12,
              background: "var(--bg-elev2)",
              marginBottom: 12
            }}
          >
            {(["todo", "doing", "done"] as TaskStatus[]).map(col => {
              const count = filtered.filter(t => t.status === col).length;
              const isActive = mobileKanbanCol === col;
              return (
                <button
                  key={col}
                  type="button"
                  className={`btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "8px 6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                  onClick={() => setMobileKanbanCol(col)}
                >
                  <span>{statusLabel[col]}</span>
                  <span
                    style={{
                      fontSize: 10,
                      background: isActive ? "rgba(255,255,255,0.25)" : "var(--border)",
                      padding: "1px 6px",
                      borderRadius: 999
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kanban Board Grid */}
          <div className="kanban-board-grid">
            {(["todo", "doing", "done"] as TaskStatus[]).map(col => (
              <div
                key={col}
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDrop(e, col)}
                className={`card ${col !== mobileKanbanCol ? "kanban-col-hidden-mobile" : ""}`}
                style={{ padding: "clamp(10px, 2.5vw, 14px)", minHeight: 320 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span className="badge" style={{ background: "var(--bg-elev2)", fontWeight: 700 }}>
                    {statusLabel[col]} • {filtered.filter(t => t.status === col).length}
                  </span>
                  <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 99, background: col === "done" ? "var(--success)" : col === "doing" ? "var(--accent)" : "var(--text-faint)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.filter(t => t.status === col).map(t => {
                    const subtasks = t.subtasks || [];
                    const subDone = subtasks.filter(s => s.completed).length;
                    const subPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : 0;
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData("text/plain", t.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: "var(--bg-elev)",
                          border: "1px solid var(--border)",
                          cursor: "grab",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span className="badge" style={{ fontSize: 10, padding: "1px 5px", textTransform: "capitalize", background: `${priorityColor[t.priority]}15`, color: priorityColor[t.priority], borderColor: `${priorityColor[t.priority]}35`, flexShrink: 0 }}>
                            ● {t.priority}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>{t.title}</span>
                        </div>
                        {t.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4, wordBreak: "break-word" }}>{t.description}</div>}

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
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                              {subtasks.map(st => (
                                <label key={st.id} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, cursor: "pointer", padding: "2px 0" }}>
                                  <input
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={() => toggleSubtask(t.id, st.id)}
                                    style={{ width: 14, height: 14, cursor: "pointer" }}
                                  />
                                  <span style={{ textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1, wordBreak: "break-word" }}>
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span className="badge">{t.category}</span>
                          {t.dueDate && (
                            <span
                              className="badge"
                              style={{
                                background: isOverdue(t.dueDate) && t.status !== "done" ? "#ef444418" : "var(--bg-elev2)",
                                color: isOverdue(t.dueDate) && t.status !== "done" ? "var(--danger)" : "var(--text-muted)",
                                borderColor: isOverdue(t.dueDate) ? "#ef444430" : "var(--border)"
                              }}
                            >
                              {isOverdue(t.dueDate) && t.status !== "done" ? "Overdue • " : ""}{t.dueDate}
                            </span>
                          )}
                          {focusByTask.get(t.id) ? (
                            <span className="badge" style={{ background: "#7c6cff18", color: "var(--accent)", borderColor: "#7c6cff30" }}>
                              ⏱ {focusByTask.get(t.id)}m
                            </span>
                          ) : null}
                        </div>

                        {/* Quick Touch-Friendly Status Transitions & Actions */}
                        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                          <button
                            className="btn btn-sm"
                            style={{ minHeight: 30, fontSize: 11, padding: "2px 8px" }}
                            onClick={() => { toggleTask(t.id); onToast(t.status === "done" ? "Task reopened" : "Task completed"); }}
                          >
                            {t.status === "done" ? "Undo" : "Complete"}
                          </button>
                          {t.status !== "todo" && (
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ fontSize: 11, padding: "2px 8px" }}
                              onClick={() => { updateTask(t.id, { status: "todo" }); onToast("Moved to To-Do"); }}
                            >
                              ← To-Do
                            </button>
                          )}
                          {t.status !== "doing" && (
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ fontSize: 11, padding: "2px 8px", color: "var(--accent)" }}
                              onClick={() => { updateTask(t.id, { status: "doing" }); onToast("Moved to In Progress"); }}
                            >
                              {t.status === "todo" ? "Start →" : "← Doing"}
                            </button>
                          )}
                          {t.status !== "done" && (
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ fontSize: 11, padding: "2px 8px", color: "var(--success)" }}
                              onClick={() => { updateTask(t.id, { status: "done" }); onToast("Moved to Done"); }}
                            >
                              Done ✓
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px" }}
                            onClick={() => { setEditing(t); setShowForm(true); }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.filter(t => t.status === col).length === 0 && (
                    <div style={{ padding: 10 }}>
                      <Empty text="No tasks in this column." />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}
