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
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 12 }}>
        <div className="card" style={{ padding: 18, textAlign: "center" }}>
          <div className="badge" style={{ background: mode === "focus" ? "#7c6cff18" : "#22c55e18", color: mode === "focus" ? "var(--accent)" : "var(--success)", borderColor: mode === "focus" ? "#7c6cff30" : "#22c55e30" }}>
            {mode === "focus" ? "FOCUS" : "BREAK"} • {mode === "focus" ? focusM : breakM}m
          </div>
          <div style={{ marginTop: 12, display: "grid", placeItems: "center" }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>
              <svg width={220} height={220} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={52} fill="none" stroke="var(--bg-elev2)" strokeWidth={10} />
                <circle cx={60} cy={60} r={52} fill="none" stroke={mode === "focus" ? "var(--accent)" : "var(--success)"} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${pct / 100 * 326} 326`} style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", transition: "stroke-dasharray .4s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div>
                  <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -.04 + "em", fontVariantNumeric: "tabular-nums" }}>
                    {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>{running ? "Running" : "Paused"} • {pct}%</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
            {!running ? (
              <button className="btn btn-primary" onClick={() => {
                if (!running && secondsLeft === totalForMode) {
                  const id = uid();
                  setSessionId(id);
                }
                setRunning(true);
              }}>▶ Start</button>
            ) : (
              <button className="btn" onClick={() => setRunning(false)}>⏸ Pause</button>
            )}
            <button className="btn" onClick={() => { setRunning(false); setSecondsLeft(totalForMode); }}>↺ Reset</button>
            <button className="btn btn-ghost" onClick={() => { setRunning(false); setMode(m => m === "focus" ? "break" : "focus"); }}>Switch to {mode === "focus" ? "break" : "focus"}</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Focus</span>
            <input type="range" min={5} max={60} value={focusM} onChange={e => setFocusM(Number(e.target.value))} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 800 }}>{focusM}m</span>
            <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 6px" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Break</span>
            <input type="range" min={3} max={30} value={breakM} onChange={e => setBreakM(Number(e.target.value))} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 800 }}>{breakM}m</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
              Link to task (optional)
              <select className="select" value={linkedTask} onChange={e => setLinkedTask(e.target.value)} style={{ marginTop: 6 }}>
                <option value="">No task</option>
                {state.tasks.filter(t => t.status !== "done").slice(0, 20).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          </div>
          {/* Ambient Sound Selector */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>🎧 Ambient Sound</span>
              {ambient !== "none" && (
                <span className="badge" style={{ background: "var(--accent-elev)", color: "var(--accent)", fontSize: 11, padding: "2px 8px" }}>
                  {running && mode === "focus" ? "Playing" : "Ready"}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(68px, 1fr))", gap: 6 }}>
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
                      padding: "8px 6px",
                      borderRadius: 8,
                      border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                      background: active ? "var(--bg-elev2)" : "transparent",
                      color: active ? "var(--text)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: active ? 800 : 600,
                      transition: "all .15s ease"
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {ambient !== "none" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={ambientVol}
                  onChange={e => setAmbientVol(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span className="mono" style={{ fontSize: 11, fontWeight: 800, minWidth: 32, textAlign: "right" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, maxHeight: 260, overflow: "auto" }}>
              {[...state.focusSessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 12).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--bg-elev2)", border: "1px solid var(--border)" }}>
                  <span className="badge" style={{ background: s.completed ? "#22c55e18" : "#f59e0b18", color: s.completed ? "var(--success)" : "var(--warn)" }}>{s.completed ? "✓" : "○"} {s.durationMinutes}m</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.taskTitle || "Unlinked session"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(s.startedAt).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              ))}
              {state.focusSessions.length === 0 && <Empty text="No sessions yet — start the timer." />}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14 }}>Today's focus by hour (mock)</h3>
            <div style={{ display: "flex", alignItems: "end", gap: 6, height: 90, marginTop: 10 }}>
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
      <style>{`@media(max-width:1000px){ div[style*="1.1fr .9fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
