import React, { useState } from "react";
import type { Task, SubTask, Priority, TaskStatus } from "../models";
import { priorityColor } from "../components/constants";
import { isOverdue, uid } from "../utils";
import { useStore } from "../store";

export function TaskRow({
  t,
  compact,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
  draggable,
  onDragStart,
  focusMinutes
}: {
  t: Task;
  compact?: boolean;
  onToggle?: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  focusMinutes?: number;
}) {
  const overdue = isOverdue(t.dueDate) && t.status !== "done";
  const [expanded, setExpanded] = useState(false);
  const subtasks = t.subtasks || [];
  const subDone = subtasks.filter(s => s.completed).length;
  const subPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : 0;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      style={{
        display: "flex",
        flexDirection: "column",
        borderBottom: "1px solid var(--border)",
        background: overdue ? "rgba(239,68,68,.06)" : undefined
      }}
    >
      <div style={{ display: "flex", gap: 12, padding: compact ? "10px 12px" : "12px 14px", alignItems: "center" }}>
        <button
          aria-label="Toggle complete"
          onClick={onToggle}
          style={{
            width: 24,
            height: 24,
            minWidth: 24,
            minHeight: 24,
            borderRadius: 8,
            border: "1px solid " + (t.status === "done" ? "var(--success)" : "var(--border)"),
            background: t.status === "done" ? "var(--success)" : "transparent",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          {t.status === "done" ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 750,
              fontSize: 13,
              textDecoration: t.status === "done" ? "line-through" : "none",
              opacity: t.status === "done" ? .7 : 1,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            {t.title}
            <span className="badge" style={{ fontSize: 10, padding: "1px 6px", textTransform: "capitalize", background: `${priorityColor[t.priority]}15`, color: priorityColor[t.priority], borderColor: `${priorityColor[t.priority]}35` }}>
              ● {t.priority}
            </span>
            <span className="badge" style={{ background: "var(--bg-elev2)" }}>{t.category}</span>
            {overdue && <span className="badge" style={{ background: "#ef444418", color: "var(--danger)", borderColor: "#ef444430" }}>Overdue</span>}
            {t.goalId && <span className="badge" style={{ background: "#7c6cff18", color: "var(--accent)", borderColor: "#7c6cff30" }}>Goal-linked</span>}
            {focusMinutes ? <span className="badge" style={{ background: "#7c6cff18", color: "var(--accent)", borderColor: "#7c6cff30" }}>⏱ {focusMinutes}m focus</span> : null}

            {/* Subtask count badge */}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                className="badge"
                style={{
                  background: subPct === 100 ? "#22c55e18" : "var(--accent-elev)",
                  color: subPct === 100 ? "var(--success)" : "var(--accent)",
                  borderColor: subPct === 100 ? "#22c55e30" : "var(--border-strong)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
                title="Click to toggle checklist"
              >
                <span>☑ {subDone}/{subtasks.length} ({subPct}%)</span>
                <span style={{ fontSize: 9 }}>{expanded ? "▲" : "▼"}</span>
              </button>
            )}
          </div>

          {/* Subtask progress bar */}
          {subtasks.length > 0 && (
            <div className="progress-track" style={{ marginTop: 6, maxWidth: 240, height: 4 }}>
              <div className="progress-fill" style={{ width: `${subPct}%`, background: subPct === 100 ? "var(--success)" : "var(--accent)" }} />
            </div>
          )}

          {!compact && t.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t.description}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 12, color: "var(--text-muted)", alignItems: "center" }}>
            {t.dueDate ? <span>Due {t.dueDate}</span> : <span>No due date</span>}
            <span>•</span><span style={{ textTransform: "capitalize" }}>{t.status}</span>
          </div>
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: 6 }}>
            {onToggle && <button className="btn btn-sm" onClick={onToggle}>{t.status === "done" ? "Undo" : "Done"}</button>}
            {onEdit && <button className="btn btn-sm btn-ghost" onClick={onEdit}>Edit</button>}
            {onDelete && <button className="btn btn-sm btn-ghost" onClick={onDelete} style={{ color: "var(--danger)" }}>Delete</button>}
          </div>
        )}
      </div>

      {/* Expanded subtask checklist */}
      {expanded && subtasks.length > 0 && (
        <div style={{ padding: "0 14px 12px 48px", display: "flex", flexDirection: "column", gap: 6 }}>
          {subtasks.map(st => (
            <label
              key={st.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 8,
                background: "var(--bg-elev2)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask && onToggleSubtask(st.id)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ flex: 1, fontWeight: 600, textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1 }}>
                {st.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskForm({
  initial,
  onClose,
  onSave
}: {
  initial: Task | null;
  onClose: () => void;
  onSave: (p: Partial<Task>) => void;
}) {
  const { state } = useStore();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState<Priority>(initial?.priority || "medium");
  const [category, setCategory] = useState(initial?.category || "Work" as any);
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status || "todo");
  const [goalId, setGoalId] = useState(initial?.goalId || "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(initial?.subtasks ? [...initial.subtasks] : []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const addSubtaskItem = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { id: uid(), title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <div className="card" style={{ width: "min(580px, 100%)", padding: "clamp(16px, 3.5vw, 22px)", animation: "pop .18s ease", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontWeight: 900, fontSize: 16 }}>{initial ? "Edit task" : "New task"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "4px 8px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
            Title *
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" />
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
            Description
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details (optional)" rows={3} />
          </label>
          <div className="form-two-col">
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Priority
              <select className="select" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Category
              <select className="select" value={category} onChange={e => setCategory(e.target.value as any)}>
                {["Work", "Personal", "Health", "Finance", "Learning", "Home"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <div className="form-two-col">
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Due date
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Status
              <select className="select" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>
            Link to goal (optional)
            <select className="select" value={goalId} onChange={e => setGoalId(e.target.value)}>
              <option value="">No goal</option>
              {state.goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </label>

          {/* Subtasks Builder */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>
                Subtasks Checklist ({subtasks.filter(s => s.completed).length}/{subtasks.length})
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                className="input"
                placeholder="Add checklist item…"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtaskItem(); } }}
                style={{ flex: 1, minHeight: 38 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addSubtaskItem}
                style={{ minHeight: 38, padding: "0 14px", fontWeight: 700, borderRadius: 8 }}
              >
                ＋ Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {subtasks.map(st => (
                  <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--card)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s))}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1, wordBreak: "break-word" }}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSubtasks(prev => prev.filter(s => s.id !== st.id))}
                      style={{ padding: "4px 8px", color: "var(--danger)", fontSize: 12, minWidth: 28, minHeight: 28 }}
                      title="Remove subtask"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" style={{ minHeight: 38, flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ minHeight: 38, flex: 2, fontWeight: 700 }} onClick={() => {
              if (!title.trim()) { setErr("Title is required."); return; }
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category,
                dueDate: dueDate || null,
                status,
                goalId: goalId || null,
                subtasks
              });
            }}>Save task</button>
          </div>
        </div>
      </div>
    </div>
  );
}
