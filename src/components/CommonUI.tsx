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

const PRESET_COLORS = [
  "#7c6cff", // Purple
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6"  // Violet
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const isCustom = !PRESET_COLORS.some(c => c.toLowerCase() === (value || "").toLowerCase());

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
      {PRESET_COLORS.map(c => {
        const isSelected = (value || "").toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: c,
              border: isSelected ? "2px solid #ffffff" : "2px solid transparent",
              outline: isSelected ? `2px solid ${c}` : "none",
              outlineOffset: 2,
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              transform: isSelected ? "scale(1.15)" : "scale(1)",
              display: "grid",
              placeItems: "center",
              padding: 0,
              boxShadow: isSelected ? `0 2px 10px ${c}88` : "none"
            }}
            title={c}
            aria-label={`Select color ${c}`}
          >
            {isSelected && (
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>
            )}
          </button>
        );
      })}

      {/* Custom Color Selector */}
      <label
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          borderRadius: 8,
          background: "var(--bg-elev2)",
          border: isCustom ? `2px solid ${value}` : "1px solid var(--border)",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text)",
          transition: "all 0.15s ease",
          userSelect: "none"
        }}
        title="Custom color"
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: value || "#7c6cff",
            border: "1px solid rgba(255,255,255,0.3)",
            display: "inline-block"
          }}
        />
        <span>{value ? value.toUpperCase() : "CUSTOM"}</span>
        <input
          type="color"
          value={value || "#7c6cff"}
          onChange={e => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer"
          }}
        />
      </label>
    </div>
  );
}
