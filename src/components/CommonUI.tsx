export function Empty({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: "var(--bg-elev2)", border: "1px dashed var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
      {text} {actionLabel && onAction && <button className="btn btn-sm" style={{ marginLeft: 8 }} onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

export function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="card" style={{ padding: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(300px 120px at 20% 0%, ${accent}18, transparent 60%)` }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .06 + "em", color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -.03 + "em", marginTop: 6 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}
