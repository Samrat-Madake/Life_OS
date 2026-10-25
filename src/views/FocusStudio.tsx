import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { minutesToHM, uid } from "../utils";
import { ambientPlayer, SOUND_OPTIONS, type AmbientSound } from "../audio";
import { Empty } from "../components/CommonUI";

export function FocusStudio({ onToast }: { onToast: (s: string) => void }) {
  const { state, addFocusSession, upsertFocusSession } = useStore();
  const [focusM, setFocusM] = useState(25);
  const [breakM, setBreakM] = useState(5);
  const [linkedTask, setLinkedTask] = useState<string>("");
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const totalForMode = (mode === "focus" ? focusM : breakM) * 60;

  const [ambient, setAmbient] = useState<AmbientSound>("none");
  const [ambientVol, setAmbientVol] = useState<number>(0.5);

  // ambient audio sync with timer and mode
  useEffect(() => {
    if (running && mode === "focus" && ambient !== "none") {
      ambientPlayer.play(ambient, ambientVol);
    } else {
      ambientPlayer.pause();
    }
  }, [running, mode, ambient, ambientVol]);

  // volume updates live
  useEffect(() => {
    ambientPlayer.setVolume(ambientVol);
  }, [ambientVol]);

  // cleanup audio on unmount
  useEffect(() => {
    return () => {
      ambientPlayer.stop();
    };
  }, []);

  // avoid duplicate timers on nav: cleanup on unmount / mode switch
  useEffect(() => {
    if (!running) setSecondsLeft((mode === "focus" ? focusM : breakM) * 60);
  }, [focusM, breakM, mode, running]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(intervalRef.current!); intervalRef.current = null;
          setRunning(false);
          const completed = mode === "focus";
          if (sessionId) {
            if (completed) {
              const taskTitle = linkedTask ? state.tasks.find(t => t.id === linkedTask)?.title : undefined;
              upsertFocusSession({ id: sessionId, startedAt: new Date().toISOString(), durationMinutes: focusM, completed: true, taskId: linkedTask || null, taskTitle: taskTitle || null });
              onToast(`Focus session completed — ${focusM}m`);
            }
          } else if (completed) {
            const id = uid();
            const taskTitle = linkedTask ? state.tasks.find(t => t.id === linkedTask)?.title : undefined;
            addFocusSession({ id, startedAt: new Date().toISOString(), durationMinutes: focusM, completed: true, taskId: linkedTask || null, taskTitle: taskTitle || null });
            onToast(`Focus session completed — ${focusM}m`);
          }
          const nextMode = completed ? "break" : "focus";
          setMode(nextMode);
          const nextSeconds = (nextMode === "focus" ? focusM : breakM) * 60;
          setTimeout(() => setSecondsLeft(nextSeconds), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [running, mode, focusM, breakM, sessionId, state.focusSessions, state.tasks, linkedTask, addFocusSession, upsertFocusSession, onToast]);

  useEffect(() => {
    const onVis = () => { if (document.hidden && running) { /* keep running */ } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running]);

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current); }, []);

  const pct = totalForMode ? Math.round((1 - secondsLeft / totalForMode) * 100) : 0;
  const mm = Math.floor(secondsLeft / 60), ss = secondsLeft % 60;
  const focusMinutesTotal = state.focusSessions.filter(s => s.completed).reduce((a, s) => a + s.durationMinutes, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="focus-main-grid">
        <div className="card" style={{ padding: "18px 16px", textAlign: "center" }}>
          <div className="badge" style={{ background: mode === "focus" ? "#7c6cff18" : "#22c55e18", color: mode === "focus" ? "var(--accent)" : "var(--success)", borderColor: mode === "focus" ? "#7c6cff30" : "#22c55e30" }}>
            {mode === "focus" ? "FOCUS" : "BREAK"} • {mode === "focus" ? focusM : breakM}m
          </div>
          <div style={{ marginTop: 14, display: "grid", placeItems: "center" }}>
            <div style={{ position: "relative", width: "min(280px, max(200px, 45vw))", height: "min(280px, max(200px, 45vw))" }}>
              <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", display: "block" }}>
                <circle cx={60} cy={60} r={52} fill="none" stroke="var(--bg-elev2)" strokeWidth={10} />
                <circle cx={60} cy={60} r={52} fill="none" stroke={mode === "focus" ? "var(--accent)" : "var(--success)"} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${pct / 100 * 326} 326`} style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dasharray .4s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div>
                  <div style={{ fontSize: "clamp(34px, 8.5vw, 46px)", fontWeight: 900, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
                    {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>{running ? "Running" : "Paused"} • {pct}%</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            {!running ? (
              <button
                className="btn btn-primary"
                style={{ minHeight: 46, minWidth: 120, fontSize: 15, fontWeight: 800, padding: "0 22px", touchAction: "manipulation" }}
                onClick={() => {
                  if (!running && secondsLeft === totalForMode) {
                    const id = uid();
                    setSessionId(id);
                  }
                  setRunning(true);
                }}
              >
                ▶ Start
              </button>
            ) : (
              <button
                className="btn"
                style={{ minHeight: 46, minWidth: 120, fontSize: 15, fontWeight: 800, background: "var(--warn)", color: "#000", borderColor: "var(--warn)", padding: "0 22px", touchAction: "manipulation" }}
                onClick={() => setRunning(false)}
              >
                ⏸ Pause
              </button>
            )}
            <button
              className="btn"
              style={{ minHeight: 46, minWidth: 90, fontSize: 14, fontWeight: 800, padding: "0 18px", touchAction: "manipulation" }}
              onClick={() => { setRunning(false); setSecondsLeft(totalForMode); }}
            >
              ↺ Reset
            </button>
            <button
              className="btn btn-ghost"
              style={{ minHeight: 46, fontSize: 13, fontWeight: 700, padding: "0 14px", touchAction: "manipulation" }}
              onClick={() => { setRunning(false); setMode(m => m === "focus" ? "break" : "focus"); }}
            >
              Switch to {mode === "focus" ? "break" : "focus"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, alignItems: "center", flexWrap: "wrap", background: "var(--bg-elev2)", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>Focus</span>
              <input type="range" min={5} max={60} value={focusM} onChange={e => setFocusM(Number(e.target.value))} style={{ width: 95, accentColor: "var(--accent)" }} />
              <span className="mono" style={{ fontSize: 12, fontWeight: 800, minWidth: 28 }}>{focusM}m</span>
            </div>
            <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }} className="desktop-only" />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>Break</span>
              <input type="range" min={3} max={30} value={breakM} onChange={e => setBreakM(Number(e.target.value))} style={{ width: 95, accentColor: "var(--success)" }} />
              <span className="mono" style={{ fontSize: 12, fontWeight: 800, minWidth: 28 }}>{breakM}m</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", textAlign: "left" }}>
              Link to task (optional)
              <select className="select" value={linkedTask} onChange={e => setLinkedTask(e.target.value)} style={{ marginTop: 6, minHeight: 40 }}>
                <option value="">No task</option>
                {state.tasks.filter(t => t.status !== "done").slice(0, 20).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          </div>
          {/* Ambient Sound Selector */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>🎧 Ambient Soundscapes</span>
              {ambient !== "none" && (
                <span className="badge" style={{ background: "var(--accent-elev)", color: "var(--accent)", fontSize: 11, padding: "2px 8px" }}>
                  {running && mode === "focus" ? "Playing" : "Ready"}
                </span>
              )}
            </div>

            <div className="focus-soundscapes-grid">
              {SOUND_OPTIONS.map(s => {
                const active = ambient === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAmbient(s.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      minHeight: 52,
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: "1.5px solid " + (active ? "var(--accent)" : "var(--border)"),
                      background: active ? "var(--accent-glow)" : "var(--bg-elev2)",
                      color: active ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: active ? 800 : 600,
                      touchAction: "manipulation",
                      boxShadow: active ? "0 2px 8px var(--accent-glow)" : "none",
                      transition: "all .15s ease"
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ whiteSpace: "nowrap" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {ambient !== "none" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, background: "var(--bg-elev2)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 15 }}>🔊</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={ambientVol}
                  onChange={e => setAmbientVol(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--accent)", minHeight: 28 }}
                  aria-label="Ambient sound volume"
                />
                <span className="mono" style={{ fontSize: 12, fontWeight: 800, minWidth: 36, textAlign: "right" }}>
                  {Math.round(ambientVol * 100)}%
                </span>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 12 }}>Plays automatically when focus timer starts • Pauses on break or pause.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Session history</h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Total focus {minutesToHM(focusMinutesTotal)} • {state.focusSessions.filter(s => s.completed).length} completed</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, maxHeight: 280, overflowY: "auto" }}>
              {[...state.focusSessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 15).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
                  <span className="badge" style={{ background: s.completed ? "#22c55e18" : "#f59e0b18", color: s.completed ? "var(--success)" : "var(--warn)", borderColor: s.completed ? "#22c55e30" : "#f59e0b30", fontWeight: 800, fontSize: 11, padding: "2px 8px", flexShrink: 0 }}>
                    {s.completed ? "✓" : "○"} {s.durationMinutes}m
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.taskTitle || "Unlinked session"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(s.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {new Date(s.startedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</div>
                  </div>
                </div>
              ))}
              {state.focusSessions.length === 0 && <Empty text="No sessions yet — start the timer." />}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Today's focus by hour (mock)</h3>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "end", gap: 6, height: 90, marginTop: 10, minWidth: 260 }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const h = 9 + i;
                  const isActive = new Date().getHours() === h;
                  const v = [20, 45, 10, 60, 30, 15, 40, 25][i];
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: "100%", height: Math.round(v / 60 * 70) + 10, background: isActive ? "var(--accent)" : "var(--bg-elev2)", border: "1px solid var(--border)", borderRadius: 8 }} />
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>{h}:00</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
